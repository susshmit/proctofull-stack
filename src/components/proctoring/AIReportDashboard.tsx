import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, Monitor, Eye, UserX, Smartphone, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { BehaviorMetrics, ViolationRecord } from "@/proctoring/ViolationTracker";

export interface AIReportDashboardProps {
    score: number;
    metrics: BehaviorMetrics;
    violations: ViolationRecord[];
    questionsAnswered?: number;
    totalQuestions?: number;
    timeTakenSeconds?: number;
    onFinish: () => void;
}

export function AIReportDashboard({ score, metrics, violations, questionsAnswered, totalQuestions, timeTakenSeconds, onFinish }: AIReportDashboardProps) {
    const isClean = score >= 85;
    const isWarning = score >= 60 && score < 85;

    const getVerdict = () => {
        if (isClean) return { text: "Clean Attempt", color: "text-success", icon: CheckCircle2, bg: "bg-success/10" };
        if (isWarning) return { text: "Minor Suspicious Activity", color: "text-warning", icon: AlertTriangle, bg: "bg-warning/10" };
        return { text: "High Suspicion", color: "text-destructive", icon: ShieldAlert, bg: "bg-destructive/10" };
    };

    const verdict = getVerdict();
    const Icon = verdict.icon;

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const getMetricIcon = (key: keyof BehaviorMetrics) => {
        switch (key) {
            case 'faceMissing': return <UserX className="w-5 h-5 text-destructive" />;
            case 'gazeDeviations': return <Eye className="w-5 h-5 text-warning" />;
            case 'objectsDetected': return <Smartphone className="w-5 h-5 text-destructive" />;
            case 'tabSwitches': return <AlertTriangle className="w-5 h-5 text-destructive" />;
            case 'fullscreenExits': return <Monitor className="w-5 h-5 text-warning" />;
        }
    };

    const formatMetricKey = (key: string) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto">
            <div className="container max-w-5xl py-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tight">AI Proctoring Report</h1>
                        </div>
                        <p className="text-muted-foreground font-mono">Session analysis complete. Integrity metrics compiled.</p>
                    </div>

                    <Button size="lg" onClick={onFinish} className="gap-2 shadow-lg shadow-primary/20">
                        Acknowledge & Finish <CheckCircle2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Top Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                        className={`col-span-1 md:col-span-2 rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative glass-card`}>
                        <div className="flex justify-between items-start z-10 relative">
                            <div className="space-y-1">
                                <p className="font-mono text-sm text-muted-foreground font-bold tracking-wider uppercase">Integrity Score</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-6xl font-black font-mono tracking-tighter">{score}</h2>
                                    <span className="text-2xl font-mono text-muted-foreground font-bold">/100</span>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${verdict.bg} ${verdict.color} border border-current/20`}>
                                <Icon className="w-5 h-5" />
                                <span className="font-bold text-sm tracking-wide">{verdict.text}</span>
                            </div>
                        </div>

                        <div className="mt-8 relative z-10">
                            <Progress value={score} className="h-3" indicatorClassName={isClean ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive"} />
                            <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground font-bold">
                                <span>0 (Critical)</span>
                                <span>60 (Warning)</span>
                                <span>85 (Clean)</span>
                                <span>100 (Perfect)</span>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${isClean ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive"}`} />
                    </motion.div>

                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">

                        {/* Violations Block */}
                        <div className="flex-1 p-5 flex flex-col justify-center items-center text-center border-b border-border bg-destructive/5 relative">
                            <h3 className={`text-4xl font-black font-mono tracking-tighter ${violations.length > 0 ? 'text-destructive' : 'text-success'}`}>{violations.length}</h3>
                            <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest uppercase mt-1">Total Warnings</p>
                        </div>

                        {/* Session Stats Block */}
                        {questionsAnswered !== undefined && totalQuestions !== undefined && timeTakenSeconds !== undefined && (
                            <div className="flex-1 bg-muted/20 grid grid-cols-2 divide-x divide-border">
                                <div className="p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-bold font-mono text-primary">{questionsAnswered}/{totalQuestions}</span>
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">Answered</span>
                                </div>
                                <div className="p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-xl font-bold font-mono text-primary">
                                        {Math.floor(timeTakenSeconds / 60)}m {timeTakenSeconds % 60}s
                                    </span>
                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">Time Taken</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Left Col: Behavior Metrics */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-2"><ActivityIcon /> Behavioral Signals</h3>
                            <div className="grid gap-3">
                                {Object.entries(metrics).map(([key, val], i) => (
                                    <div key={key} className="flex justify-between items-center p-4 rounded-xl border border-border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            {getMetricIcon(key as keyof BehaviorMetrics)}
                                            <span className="font-medium text-sm">{formatMetricKey(key)}</span>
                                        </div>
                                        <span className={`font-mono font-bold text-lg ${(val as number) > 0 ? 'text-destructive hidden-bump' : 'text-muted-foreground'}`}>{val as number}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary/80">
                            <p>Metrics are calculated using active tracking intervals running every 300ms. Detections rely on temporal fusion spanning 5 continuous frames to eliminate false positives.</p>
                        </div>
                    </motion.div>

                    {/* Right Col: Event Timeline & Evidence */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2"><Clock className="w-5 h-5 text-muted-foreground" /> Examination Timeline</h3>

                        {violations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl glass-card">
                                <CheckCircle2 className="w-12 h-12 text-success/50 mb-4" />
                                <p className="font-mono text-sm">No suspicious events recorded.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {violations.map((v, i) => (
                                    <div key={i} className="flex border border-border rounded-xl bg-card overflow-hidden shadow-sm group hover:border-destructive/30 transition-colors">
                                        {/* Screenshot / Evidence Box */}
                                        <div className="w-32 bg-black flex-shrink-0 border-r border-border relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                            {v.evidenceBase64 ? (
                                                <img src={v.evidenceBase64} alt="Evidence" className="w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
                                                    <Monitor className="w-6 h-6 opacity-30" />
                                                </div>
                                            )}
                                            <div className="absolute top-1 left-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono text-white/90">
                                                EVIDENCE
                                            </div>
                                        </div>

                                        {/* Timeline Details */}
                                        <div className="p-4 flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant="destructive" className="uppercase text-[10px] tracking-wider rounded-sm font-mono">{v.type}</Badge>
                                                <span className="text-xs font-mono text-muted-foreground">{formatTime(v.timestamp)}</span>
                                            </div>
                                            <p className="text-sm font-medium leading-normal mt-2">{v.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

function ActivityIcon() {
    return (
        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
