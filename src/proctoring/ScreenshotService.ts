/**
 * Responsible for capturing evidence (screenshots) from an HTMLVideoElement.
 */
export class ScreenshotService {
    /**
     * Captures a base64 encoded JPEG screenshot from the provided video element.
     */
    static captureEvidence(videoElement: HTMLVideoElement | null): string | null {
        if (!videoElement) return null;

        try {
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Return a base64 encoded jpeg (quality 0.7 for reasonable size)
            return canvas.toDataURL("image/jpeg", 0.7);
        } catch (err) {
            console.error("Failed to capture screenshot evidence:", err);
            return null;
        }
    }
}
