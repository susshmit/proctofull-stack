import { ViolationTracker } from "./ViolationTracker";
import { ScreenshotService } from "./ScreenshotService";

/**
 * Monitors the browser's fullscreen API.
 */
export class FullscreenMonitor {
    private tracker: ViolationTracker;
    private videoElement: HTMLVideoElement | null;
    private boundHandler: () => void;
    private isMonitoring: boolean = false;

    constructor(tracker: ViolationTracker, videoElement: HTMLVideoElement | null) {
        this.tracker = tracker;
        this.videoElement = videoElement;
        this.boundHandler = this.onFullscreenChange.bind(this);
    }

    /**
     * Automatically requests fullscreen for the document element.
     */
    public async enterFullscreen() {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.warn("Fullscreen request failed. This usually happens if not triggered by a user gesture.", err);
        }
    }

    public start() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        // We attempt to enter fullscreen immediately when monitoring starts
        this.enterFullscreen().then(() => {
            console.log("[FullscreenMonitor] Fullscreen requested and monitor active.");
        }).catch(() => {
            console.warn("[FullscreenMonitor] Fullscreen request failed (User gesture required).");
        });

        document.addEventListener("fullscreenchange", this.boundHandler);
    }

    public stop() {
        if (!this.isMonitoring) return;
        this.isMonitoring = false;
        document.removeEventListener("fullscreenchange", this.boundHandler);

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.warn(err));
        }
    }

    private onFullscreenChange() {
        if (!document.fullscreenElement && this.isMonitoring) {
            // User exited fullscreen during the active exam!
            const evidence = ScreenshotService.captureEvidence(this.videoElement);
            this.tracker.registerViolation(
                "fullscreen_exit",
                "Fullscreen mode exited. You must remain in fullscreen throughout the exam.",
                evidence
            );

            // Force them back into fullscreen (might fail if not triggered by gesture, but we try)
            this.enterFullscreen().catch(() => { });
        }
    }
}
