import { ViolationTracker, type ViolationTrackerConfig, type ViolationRecord } from "./ViolationTracker";
import { FullscreenMonitor } from "./FullscreenMonitor";
import { FaceMonitor } from "./FaceMonitor";
import { ObjectDetectionHook } from "./ObjectDetectionHook";
import { ScreenshotService } from "./ScreenshotService";

/**
 * Controller configuration passed from React
 */
export interface ProctoringConfig {
    videoElement: HTMLVideoElement | null;
    maxViolations: number;
    onWarningStateChange: (isVisible: boolean, message: string, current: number, max: number) => void;
    onAutoSubmit: () => void;
    onProctoringUpdate?: (score: number, metrics: any) => void;
}

/**
 * The central facade that orchestrates all individual AI monitoring hooks.
 * This class keeps the React components clean and modular.
 */
export class ProctoringManager {
    private tracker: ViolationTracker;
    private fullscreenMonitor: FullscreenMonitor;
    private faceMonitor: FaceMonitor;
    private objectMonitor: ObjectDetectionHook;

    private isRunning: boolean = false;
    private config: ProctoringConfig;
    private boundVisibilityHandler: () => void;

    private warningTimeoutId: number | NodeJS.Timeout | null = null;
    private inferenceIntervalId: number | null = null;
    private frameId: number = 0;
    private startTime: number = 0;

    constructor(config: ProctoringConfig) {
        this.config = config;

        // 1. Initialize centralized tracker
        this.tracker = new ViolationTracker({
            maxViolations: config.maxViolations,
            onWarning: this.handleWarning.bind(this),
            onThresholdReached: config.onAutoSubmit,
            onUpdate: config.onProctoringUpdate
        });

        // 2. Initialize sub-monitors with the tracker
        this.fullscreenMonitor = new FullscreenMonitor(this.tracker, config.videoElement);
        this.faceMonitor = new FaceMonitor(this.tracker, config.videoElement);
        this.objectMonitor = new ObjectDetectionHook(this.tracker, config.videoElement);

        // Bind global handlers
        this.boundVisibilityHandler = this.onVisibilityChange.bind(this);
    }

    /**
     * Starts all monitoring systems natively
     */
    public async startProctoring() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = Date.now();
        this.frameId = 0;

        console.log("[Proctoring Manager] Securing exam environment...");

        // Start sub-systems linearly
        this.fullscreenMonitor.start();
        await this.faceMonitor.start();
        await this.objectMonitor.start();

        // Hook native browser tab-switch detection
        document.addEventListener("visibilitychange", this.boundVisibilityHandler);

        // Unified deterministic pipeline: Object Detection -> Face Detection
        this.inferenceIntervalId = window.setInterval(async () => {
            if (!this.isRunning) return;
            this.frameId++;
            await this.objectMonitor.processFrame(this.frameId);
            await this.faceMonitor.processFrame(this.frameId);
        }, 400);
    }

    public stopProctoring() {
        if (!this.isRunning) return;
        this.isRunning = false;

        console.log("[Proctoring Manager] Releasing exam environment...");

        if (this.inferenceIntervalId) {
            window.clearInterval(this.inferenceIntervalId);
            this.inferenceIntervalId = null;
        }

        this.fullscreenMonitor.stop();
        this.faceMonitor.stop();
        this.objectMonitor.stop();

        document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    }

    /**
     * Handles the warning event emitted from the Tracker, triggering the UI React Hook
     */
    private handleWarning(message: string, current: number, max: number) {
        // Show UI element
        this.config.onWarningStateChange(true, message, current, max);

        // Clear any previous dismiss timeouts
        if (this.warningTimeoutId) {
            clearTimeout(this.warningTimeoutId as number);
        }

        // Auto-dismiss the popup after 4 seconds
        this.warningTimeoutId = setTimeout(() => {
            this.config.onWarningStateChange(false, "", current, max);
        }, 4000);
    }

    /**
     * Triggers a violation if the tab changes focus (blur/hidden)
     */
    private onVisibilityChange() {
        if (document.hidden && this.isRunning) {
            const evidence = ScreenshotService.captureEvidence(this.config.videoElement);
            this.tracker.registerViolation(
                "tab_switch",
                "Tab switch detected. You must remain on the exam tab.",
                evidence
            );
        }
    }

    /**
     * Accessible method to get the final violation report logs
     */
    public getFinalReport() {
        const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const violations = this.tracker.getViolations();
        const metrics = this.tracker.getMetrics();

        return {
            // Native UI Backward Compatibility
            violations: violations,
            score: this.tracker.getIntegrityScore(),
            metrics: metrics,

            // Structured Payload requested for logging
            structuredReport: {
                examDuration: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
                faceWarnings: metrics.faceMissing + metrics.gazeDeviations,
                phoneDetections: violations.filter(v => v.type === 'prohibited_object' && (v.message.includes('phone') || v.message.includes('remote') || v.message.includes('device'))).length,
                violations: violations.map(v => ({
                    timestamp: new Date(v.timestamp).toISOString(),
                    type: v.type,
                    message: v.message,
                    frameId: v.frameId,
                    confidence: v.confidence ? `${(v.confidence * 100).toFixed(1)}%` : undefined,
                    hasScreenshot: !!v.evidenceBase64
                })),
                finalIntegrityScore: this.tracker.getIntegrityScore()
            }
        };
    }
}
