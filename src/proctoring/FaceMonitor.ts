import { ViolationTracker } from "./ViolationTracker";
import { ScreenshotService } from "./ScreenshotService";
import * as mpFaceDetection from "@mediapipe/face_detection";
import * as mpFaceMesh from "@mediapipe/face_mesh";

type DetectionResults = mpFaceDetection.Results;
type MeshResults = mpFaceMesh.Results;
type FaceDetection = mpFaceDetection.FaceDetection;
type FaceMesh = mpFaceMesh.FaceMesh;

/**
 * Hook for Face and Gaze Detection using MediaPipe FaceDetection and FaceMesh.
 */
export class FaceMonitor {
    private tracker: ViolationTracker;
    private videoElement: HTMLVideoElement | null;

    private faceDetection: FaceDetection | null = null;
    private faceMesh: FaceMesh | null = null;
    private isRunning: boolean = false;
    // Gaze and Face Tracking State
    private consecutiveAways: number = 0;
    private consecutiveNoFace: number = 0;
    private currentFrameId: number = 0;

    constructor(tracker: ViolationTracker, videoElement: HTMLVideoElement | null) {
        this.tracker = tracker;
        this.videoElement = videoElement;
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        if (!this.faceDetection) {
            console.log("[FaceMonitor] Loading MediaPipe FaceDetection...");
            
            // Ultra-resilient constructor resolution
            let FaceDetectionConstructor: any = (mpFaceDetection as any).FaceDetection || 
                                                (mpFaceDetection as any).default?.FaceDetection || 
                                                mpFaceDetection || 
                                                (window as any).FaceDetection;
            
            if (typeof FaceDetectionConstructor !== "function") {
                // If it's an object containing the class (common in some bundles)
                const possible = FaceDetectionConstructor.FaceDetection || FaceDetectionConstructor.default;
                if (typeof possible === "function") FaceDetectionConstructor = possible;
            }

            if (typeof FaceDetectionConstructor !== "function") {
                console.error("[FaceMonitor] All FaceDetection constructor lookups failed.");
                throw new Error("FaceDetection is not a constructor");
            }
            
            this.faceDetection = new FaceDetectionConstructor({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/${file}`;
                }
            });

            this.faceDetection.setOptions({
                model: 'short',
                minDetectionConfidence: 0.5, // Restored baseline confidence
            });

            this.faceDetection.onResults(this.onFaceDetectionResults.bind(this));
            console.log("[FaceMonitor] FaceDetection loaded.");
        }

        if (!this.faceMesh) {
            console.log("[FaceMonitor] Loading MediaPipe FaceMesh...");
            
            // Ultra-resilient constructor resolution
            let FaceMeshConstructor: any = (mpFaceMesh as any).FaceMesh || 
                                           (mpFaceMesh as any).default?.FaceMesh || 
                                           mpFaceMesh || 
                                           (window as any).FaceMesh;
            
            if (typeof FaceMeshConstructor !== "function") {
                const possible = FaceMeshConstructor.FaceMesh || FaceMeshConstructor.default;
                if (typeof possible === "function") FaceMeshConstructor = possible;
            }

            if (typeof FaceMeshConstructor !== "function") {
                throw new Error("FaceMesh is not a constructor");
            }
            
            this.faceMesh = new FaceMeshConstructor({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                }
            });

            this.faceMesh.setOptions({
                maxNumFaces: 1, // Only need gaze tracking for the primary single face
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.faceMesh.onResults(this.onFaceMeshResults.bind(this));
            console.log("[FaceMonitor] FaceMesh loaded.");
        }
    }

    public stop() {
        this.isRunning = false;
    }

    public async processFrame(frameId: number) {
        if (!this.videoElement || !this.isRunning) return;
        if (this.videoElement.readyState < 2) return;

        this.currentFrameId = frameId;

        try {
            if (this.faceDetection) {
                await this.faceDetection.send({ image: this.videoElement });
            }
        } catch (err) {
            console.error("[FaceMonitor] FaceDetection error:", err);
        }
    }

    private calculateIoU(box1: any, box2: any): number {
        const xA = Math.max(box1.xCenter - box1.width / 2, box2.xCenter - box2.width / 2);
        const yA = Math.max(box1.yCenter - box1.height / 2, box2.yCenter - box2.height / 2);
        const xB = Math.min(box1.xCenter + box1.width / 2, box2.xCenter + box2.width / 2);
        const yB = Math.min(box1.yCenter + box1.height / 2, box2.yCenter + box2.height / 2);

        const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        const box1Area = box1.width * box1.height;
        const box2Area = box2.width * box2.height;

        return interArea / (box1Area + box2Area - interArea);
    }

    private async onFaceDetectionResults(results: DetectionResults) {
        if (!this.isRunning || !this.videoElement) return;

        const vidW = this.videoElement.videoWidth || 640;
        const vidH = this.videoElement.videoHeight || 480;

        const filteredFaces = [];
        for (const det of (results.detections || [])) {
            const bbox = det.boundingBox;
            const widthPx = bbox.width * vidW;
            const heightPx = bbox.height * vidH;

            // Reject faces smaller than 60px width
            if (widthPx < 60) continue;

            // Reject unreasonable aspect ratios (faces are vertical rectangles to almost square)
            const aspect = heightPx / widthPx;
            if (aspect < 0.8 || aspect > 2.0) continue;

            // Ignore overlapping boxes (IoU > 0.6)
            let isDuplicate = false;
            for (const existing of filteredFaces) {
                if (this.calculateIoU(bbox, existing.boundingBox) > 0.6) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                filteredFaces.push(det);
            }
        }

        const facesDetected = filteredFaces.length;

        // MULTIPLE FACES
        if (facesDetected > 1) {
            const evidence = ScreenshotService.captureEvidence(this.videoElement);
            this.tracker.registerViolation(
                "multiple_faces",
                "Multiple faces detected in the webcam feed.",
                evidence,
                undefined,
                this.currentFrameId
            );
        }
        // NO FACE
        else if (facesDetected === 0) {
            this.consecutiveNoFace++;
            // If faces === 0 for 3 checks (6 seconds total)
            if (this.consecutiveNoFace >= 3) {
                const evidence = ScreenshotService.captureEvidence(this.videoElement);
                this.tracker.registerViolation(
                    "no_face",
                    "No face detected in the webcam frame.",
                    evidence,
                    undefined,
                    this.currentFrameId
                );
                this.consecutiveNoFace = 0; // Reset after violation
            }
        } else if (facesDetected === 1) {
            this.consecutiveNoFace = 0; // Reset no face counter
            if (this.currentFrameId % 60 === 0) console.log("[FaceMonitor] 1 Face detected. Proceeding to gaze check.");

            try {
                if (this.faceMesh) {
                    if (this.currentFrameId % 60 === 0) console.log("[FaceMonitor] Running FaceMesh inference...");
                    await this.faceMesh.send({ image: this.videoElement });
                }
            } catch (err) {
                console.error("[FaceMonitor] FaceMesh error:", err);
            }
        }
    }

    private onFaceMeshResults(results: MeshResults) {
        if (!this.isRunning || !this.videoElement) return;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            // Note: Indices for FaceMesh
            // leftEye outer: 33, rightEye outer: 263
            // nose tip: 1
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];
            const nose = landmarks[1];

            const eyeDist = Math.abs(leftEye.x - rightEye.x);

            // Prevent division by zero
            if (eyeDist > 0.01) {
                // Calculate position of nose relative to eyes
                const turnRatio = Math.abs(nose.x - leftEye.x) / eyeDist;

                // If the turn ratio is far from 0.5 (center), user is looking away
                const isLookingAway = Math.abs(turnRatio - 0.5) > 0.3;

                if (isLookingAway) {
                    console.warn(`[FaceMonitor] Gaze deviation detected (ratio: ${turnRatio.toFixed(2)})`);
                    this.consecutiveAways++;
                    // If looking away > 4 seconds (i.e., at least 3 consecutive 2-second ticks == 6 seconds)
                    if (this.consecutiveAways >= 3) {
                        const evidence = ScreenshotService.captureEvidence(this.videoElement);
                        this.tracker.registerViolation(
                            "looking_away",
                            "Looking away from screen.",
                            evidence,
                            undefined,
                            this.currentFrameId
                        );
                        this.consecutiveAways = 0; // Reset after violation
                    }
                } else {
                    this.consecutiveAways = 0;
                }
            }
        }
    }
}
