import { ViolationTracker } from "./ViolationTracker";
import { ScreenshotService } from "./ScreenshotService";
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface TrackedObject {
    class: string;
    bbox: [number, number, number, number];
    score: number;
    ttl: number;
    age: number;
}

const DEBUG_AI = true;

export class ObjectDetectionHook {
    private tracker: ViolationTracker;
    private videoElement: HTMLVideoElement | null;
    private isRunning: boolean = false;
    private model: cocoSsd.ObjectDetection | null = null;
    private trackedObjects: TrackedObject[] = [];

    private debugCanvas: HTMLCanvasElement | null = null;
    private debugCtx: CanvasRenderingContext2D | null = null;

    private readonly PROHIBITED_LABELS = [
        "cell phone", "remote", "laptop", "book"
    ];

    constructor(tracker: ViolationTracker, videoElement: HTMLVideoElement | null) {
        this.tracker = tracker;
        this.videoElement = videoElement;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        if (!this.model) {
            if (DEBUG_AI) console.log("[ObjectDetectionHook] Loading model...");
            try {
                // Set a timeout for model loading
                const loadPromise = (async () => {
                    tf.enableProdMode();
                    tf.env().set('WEBGL_PACK', true);
                    try {
                        await tf.setBackend('webgl');
                    } catch (e) {
                        console.warn("[ObjectDetectionHook] WebGL backend failed on this device, falling back to CPU", e);
                        await tf.setBackend('cpu');
                    }
                    await tf.ready();

                    this.model = await cocoSsd.load();

                    // Warm up
                    tf.engine().startScope();
                    // Forced cast to int32 for production compatibility
                    const dummy = tf.zeros([720, 1280, 3], 'int32').toInt() as tf.Tensor3D;
                    for (let i = 0; i < 3; i++) {
                        await this.model.detect(dummy);
                    }
                    tf.engine().endScope();
                    console.log("[ObjectDetectionHook] Model loaded and warmed up.");
                })();

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Model loading timed out")), 15000)
                );

                await Promise.race([loadPromise, timeoutPromise]);
            } catch (err) {
                console.error("[ObjectDetectionHook] Failed to load model:", err);
                this.isRunning = false; // Disable if failed
                throw err; // Re-throw for ProctoringManager to catch
            }
        }

        this.setupDebugOverlay();
        this.trackedObjects = [];
    }

    public stop() {
        this.isRunning = false;
        this.cleanupDebugOverlay();
    }

    private setupDebugOverlay() {
        if (!this.videoElement || this.debugCanvas || !this.videoElement.parentElement) return;

        this.debugCanvas = document.createElement("canvas");
        this.debugCtx = this.debugCanvas.getContext("2d");

        this.debugCanvas.style.position = "absolute";
        this.debugCanvas.style.top = "0";
        this.debugCanvas.style.left = "0";
        this.debugCanvas.style.width = "100%";
        this.debugCanvas.style.height = "100%";
        this.debugCanvas.style.pointerEvents = "none";
        this.debugCanvas.style.zIndex = "50";

        const parent = this.videoElement.parentElement;
        if (window.getComputedStyle(parent).position === "static") {
            parent.style.position = "relative";
        }

        parent.appendChild(this.debugCanvas);
        this.resizeDebugCanvas();
    }

    private resizeDebugCanvas() {
        if (this.debugCanvas && this.videoElement) {
            this.debugCanvas.width = this.videoElement.videoWidth || 640;
            this.debugCanvas.height = this.videoElement.videoHeight || 480;
        }
    }

    private cleanupDebugOverlay() {
        if (this.debugCanvas && this.debugCanvas.parentElement) {
            this.debugCanvas.parentElement.removeChild(this.debugCanvas);
            this.debugCanvas = null;
            this.debugCtx = null;
        }
    }

    public async processFrame(frameId: number) {
        if (!this.model || !this.videoElement || !this.isRunning) return;
        if (this.videoElement.readyState < 2) return;

        this.resizeDebugCanvas();
        if (this.debugCtx && this.debugCanvas) {
            this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
        }

        tf.engine().startScope();
        try {
            // Fix Dtype Mismatch: Cast to int32 explicitly for production models
            const rawTensor = tf.browser.fromPixels(this.videoElement);
            const tensor = tf.cast(rawTensor, 'int32');
            
            const predictions = await this.model.detect(tensor as any);

            const persons = predictions.filter(p => p.class === 'person');
            const validDetections: cocoSsd.DetectedObject[] = [];

            for (const p of predictions) {
                // We care about prohibited labels and persons (persons are handled above)
                if (!this.PROHIBITED_LABELS.includes(p.class)) continue;

                // Lower detection threshold 0.25
                if (p.score < 0.25) continue;

                // Phone Detection Recovery
                let targetClass = p.class;
                let isPhoneSuspect = false;

                if (targetClass === 'remote' || targetClass.includes('electronic')) {
                    const [px, py, pw, ph] = p.bbox;
                    const pCenter = { x: px + pw / 2, y: py + ph / 2 };

                    for (const person of persons) {
                        const [hx, hy, hw, hh] = person.bbox;
                        if (pCenter.x >= hx - 50 && pCenter.x <= hx + hw + 50 &&
                            pCenter.y >= hy - 50 && pCenter.y <= hy + hh + 50) {
                            // Flag internally as suspected phone, DO NOT modify score
                            isPhoneSuspect = true;
                            break;
                        }
                    }
                }

                validDetections.push({
                    class: isPhoneSuspect ? 'suspected_phone' : targetClass,
                    score: p.score,
                    bbox: p.bbox
                });
            }

            if (validDetections.length > 0) {
                console.log(`[ObjectMonitor] Detected ${validDetections.length} objects:`, validDetections.map(d => d.class).join(", "));
            } else if (frameId % 90 === 0) {
                console.log("[ObjectMonitor] Heartbeat: Scanning for prohibited objects...");
            }
            this.evalPredictions(validDetections, frameId);

        } catch (err) {
            console.error("[ObjectDetectionHook] Full frame inference error:", err);
        } finally {
            tf.engine().endScope();
        }
    }

    private evalPredictions(predictions: cocoSsd.DetectedObject[], frameId: number) {
        // Track persistence
        const updatedTracks: TrackedObject[] = [];

        for (const p of predictions) {
            const existingTrack = this.trackedObjects.find(t =>
                t.class === p.class && this.calculateIoU(t.bbox, p.bbox as number[]) > 0.3
            );

            this.drawDebugBox(p);

            if (existingTrack) {
                existingTrack.score = p.score;
                existingTrack.bbox = p.bbox as [number, number, number, number];
                existingTrack.ttl = 3;
                existingTrack.age++;
                updatedTracks.push(existingTrack);
            } else {
                updatedTracks.push({
                    class: p.class,
                    bbox: p.bbox as [number, number, number, number],
                    score: p.score,
                    ttl: 3,
                    age: 1
                });
            }
        }

        // Retain tracking for objects that might have fluttered
        for (const track of this.trackedObjects) {
            if (!updatedTracks.find(t => t === track)) {
                track.ttl--;
                if (track.ttl > 0) updatedTracks.push(track);
            }
        }
        this.trackedObjects = updatedTracks;

        for (const track of this.trackedObjects) {
            // Trigger violation if object persists for 2 consecutive frames
            if (track.age === 2) {
                // Note: Track will continue to age up, and won't re-trigger continuously.
                const evidence = ScreenshotService.captureEvidence(this.videoElement);
                const displayClass = track.class === 'suspected_phone' ? 'mobile phone' : track.class;

                // Check Desk Region: if checking is needed, we just know it's a violation either way, but maybe log it?
                const isDesk = track.bbox[1] > ((this.videoElement?.videoHeight || 480) * 0.5);
                const msg = isDesk ? `Prohibited object (${displayClass}) detected in desk region.` : `Prohibited object detected: ${displayClass}`;

                this.tracker.registerViolation(
                    "prohibited_object",
                    msg,
                    evidence,
                    track.bbox,
                    frameId,
                    track.score
                );

                // Track age continues to grow above 2, so it doesn't trigger repeatedly until it drops and comes back
            }
        }
    }

    private calculateIoU(box1: number[], box2: number[]): number {
        const xA = Math.max(box1[0], box2[0]);
        const yA = Math.max(box1[1], box2[1]);
        const xB = Math.min(box1[0] + box1[2], box2[0] + box2[2]);
        const yB = Math.min(box1[1] + box1[3], box2[1] + box2[3]);

        const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        const box1Area = box1[2] * box1[3];
        const box2Area = box2[2] * box2[3];

        return interArea / (box1Area + box2Area - interArea);
    }

    private drawDebugBox(prediction: cocoSsd.DetectedObject) {
        if (!this.debugCtx) return;
        const [x, y, width, height] = prediction.bbox;
        const color = "#ef4444";

        this.debugCtx.strokeStyle = color;
        this.debugCtx.lineWidth = 3;
        this.debugCtx.strokeRect(x, y, width, height);

        this.debugCtx.fillStyle = color;
        const displayClass = prediction.class === 'suspected_phone' ? 'Phone?' : prediction.class;
        const text = `${displayClass} ${(prediction.score * 100).toFixed(0)}%`;
        const textWidth = this.debugCtx.measureText(text).width;

        this.debugCtx.fillRect(x, y - 25, textWidth + 10, 25);
        this.debugCtx.fillStyle = "#ffffff";
        this.debugCtx.font = "16px sans-serif";
        this.debugCtx.fillText(text, x + 5, y - 7);
    }
}
