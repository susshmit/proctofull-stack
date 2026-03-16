import { ViolationTracker } from "./ViolationTracker";
import { FullscreenMonitor } from "./FullscreenMonitor";
import { FaceMonitor } from "./FaceMonitor";
import { ObjectDetectionHook } from "./ObjectDetectionHook";
import { ScreenshotService } from "./ScreenshotService";

export interface ProctoringConfig {
    videoElement: HTMLVideoElement | null;
    maxViolations: number;
    onWarningStateChange: (isVisible: boolean, message: string, current: number, max: number) => void;
    onAutoSubmit: () => void;
    onProctoringUpdate?: (score: number, metrics: any) => void;
}

export class ProctoringManager {
    private tracker: ViolationTracker;
    private fullscreenMonitor: FullscreenMonitor;
    private faceMonitor: FaceMonitor;
    private objectMonitor: ObjectDetectionHook;
    private isRunning: boolean = false;
    private config: ProctoringConfig;
    private boundVisibilityHandler: () => void;
    private frameId: number = 0;

    constructor(config: ProctoringConfig) {
        this.config = config;
        this.tracker = new ViolationTracker({
            maxViolations: config.maxViolations,
            onWarning: this.handleWarning.bind(this),
            onThresholdReached: config.onAutoSubmit,
            onUpdate: config.onProctoringUpdate
        });

        this.fullscreenMonitor = new FullscreenMonitor(this.tracker, config.videoElement);
        this.faceMonitor = new FaceMonitor(this.tracker, config.videoElement);
        this.objectMonitor = new ObjectDetectionHook(this.tracker, config.videoElement);
        this.boundVisibilityHandler = this.onVisibilityChange.bind(this);
    }

    public async startProctoring() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log("%c [Proctoring Manager] STARTING AI ENGINE...", "color: green; font-weight: bold; font-size: 14px;");

        // Start Monitors
        this.fullscreenMonitor.start();
        await this.faceMonitor.start();
        await this.objectMonitor.start();

        document.addEventListener("visibilitychange", this.boundVisibilityHandler);

        // NATIVE RECURSIVE LOOP
        const mainLoop = async () => {
            if (!this.isRunning) return;

            this.frameId++;

            // Run both detections
            try {
                await this.objectMonitor.processFrame(this.frameId);
                await this.faceMonitor.processFrame(this.frameId);
            } catch (e) {
                console.error("[Proctoring Loop] Frame error:", e);
            }

            // Queue the next frame
            requestAnimationFrame(mainLoop);
        };

        mainLoop();
    }

    public stopProctoring() {
        this.isRunning = false;
        console.log("%c [Proctoring Manager] STOPPING AI ENGINE...", "color: red; font-weight: bold;");

        this.fullscreenMonitor.stop();
        this.faceMonitor.stop();
        this.objectMonitor.stop();
        document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    }

    private handleWarning(message: string, current: number, max: number) {
        this.config.onWarningStateChange(true, message, current, max);
        setTimeout(() => {
            this.config.onWarningStateChange(false, "", current, max);
        }, 4000);
    }

    private onVisibilityChange() {
        if (document.hidden && this.isRunning) {
            console.warn("[Proctoring Manager] Tab Switch Detected!");
            const evidence = ScreenshotService.captureEvidence(this.config.videoElement);
            this.tracker.registerViolation("tab_switch", "Tab switch detected.", evidence);
        }
    }
}