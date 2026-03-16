import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, AlertTriangle } from "lucide-react";

export interface WarningPopupProps {
    message: string;
    isVisible: boolean;
    currentWarning: number;
    maxWarnings: number;
}

export function WarningPopup({ message, isVisible, currentWarning, maxWarnings }: WarningPopupProps) {
    const isCritical = currentWarning >= maxWarnings;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -100, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -100, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
                >
                    <div
                        className={`flex items-center gap-4 px-6 py-4 rounded-xl backdrop-blur-md shadow-2xl border ${isCritical
                                ? "bg-destructive/90 border-destructive/50 text-destructive-foreground shadow-destructive/20"
                                : "bg-orange-500/90 border-orange-400/50 text-white shadow-orange-500/20"
                            }`}
                    >
                        <div className="flex-shrink-0 animate-pulse">
                            {isCritical ? <AlertOctagon className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                        </div>

                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-tight uppercase tracking-wider">
                                {isCritical ? "Final Warning" : "Proctoring Alert"}
                            </span>
                            <span className="font-medium opacity-90">{message}</span>
                        </div>

                        <div className={`ml-4 pl-4 border-l ${isCritical ? "border-white/30" : "border-white/30"}`}>
                            <div className="text-sm font-mono opacity-80 uppercase tracking-widest">Strike</div>
                            <div className="text-2xl font-black tabular-nums leading-none">
                                {currentWarning} <span className="text-sm opacity-50">/ {maxWarnings}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
