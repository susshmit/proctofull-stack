export type ViolationType =
    | "tab_switch"
    | "fullscreen_exit"
    | "multiple_faces"
    | "no_face"
    | "looking_away"
    | "prohibited_object";

export interface ViolationRecord {
    type: ViolationType;
    message: string;
    timestamp: number;
    evidenceBase64: string | null;
    bbox?: [number, number, number, number];
    frameId?: number;
    confidence?: number;
}

export interface BehaviorMetrics {
    fullscreenExits: number;
    tabSwitches: number;
    gazeDeviations: number;
    faceMissing: number;
    objectsDetected: number;
}

export interface ViolationTrackerConfig {
    maxViolations: number;
    onWarning: (message: string, currentViolations: number, maxViolations: number) => void;
    onThresholdReached: () => void;
    onUpdate?: (score: number, metrics: BehaviorMetrics) => void;
}

/**
 * Centralized Tracker for all examination violations.
 */
export class ViolationTracker {
    private violations: ViolationRecord[] = [];
    private config: ViolationTrackerConfig;

    // SaaS Reporting Metrics
    private integrityScore: number = 100;
    private metrics: BehaviorMetrics = {
        fullscreenExits: 0,
        tabSwitches: 0,
        gazeDeviations: 0,
        faceMissing: 0,
        objectsDetected: 0
    };

    // Deduction Weights map
    private readonly PENALTIES: Record<ViolationType, number> = {
        "no_face": 10,
        "multiple_faces": 15,
        "looking_away": 8,
        "prohibited_object": 20, // Applies to phones, laptops, books
        "fullscreen_exit": 5,
        "tab_switch": 10
    };

    constructor(config: ViolationTrackerConfig) {
        this.config = config;
    }

    /**
     * Registers a new violation, stores the evidence, alerts the UI, and checks for threshold.
     */
    public registerViolation(
        type: ViolationType,
        message: string,
        evidenceBase64: string | null = null,
        bbox?: [number, number, number, number],
        frameId?: number,
        confidence?: number
    ) {
        this.violations.push({
            type,
            message,
            timestamp: Date.now(),
            evidenceBase64,
            bbox,
            frameId,
            confidence
        });

        // Update Integrity Score
        const penalty = this.PENALTIES[type] || 5;
        this.integrityScore = Math.max(0, this.integrityScore - penalty);

        // Update Behavior Metrics
        if (type === "fullscreen_exit") this.metrics.fullscreenExits++;
        if (type === "tab_switch") this.metrics.tabSwitches++;
        if (type === "looking_away") this.metrics.gazeDeviations++;
        if (type === "no_face" || type === "multiple_faces") this.metrics.faceMissing++;
        if (type === "prohibited_object") this.metrics.objectsDetected++;

        // Push real-time update to UI
        if (this.config.onUpdate) {
            this.config.onUpdate(this.integrityScore, this.metrics);
        }

        const currentCount = this.violations.length;

        console.warn(`[Proctoring Tracker] Violation logged [${type}]: ${message} (${currentCount}/${this.config.maxViolations})`);

        // Call UI hook to show warning
        this.config.onWarning(message, currentCount, this.config.maxViolations);

        // Auto-submit if the limit is reached
        if (currentCount >= this.config.maxViolations) {
            console.error(`[Proctoring Tracker] Maximum violations reached (${currentCount}). Triggering auto-submit.`);
            this.config.onThresholdReached();
        }
    }

    public getViolations(): ViolationRecord[] {
        return this.violations;
    }

    public getViolationCount(): number {
        return this.violations.length;
    }

    public getIntegrityScore(): number {
        return this.integrityScore;
    }

    public getMetrics(): BehaviorMetrics {
        return this.metrics;
    }
}
