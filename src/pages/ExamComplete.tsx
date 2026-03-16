import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, ArrowRight, FileText, AlertTriangle } from "lucide-react";

export default function ExamComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const report = location.state?.report;

  // Derive display values from injected report or run fallbacks
  const answeredDisplay = report ? `${report.questionsAnswered}/${report.totalQuestions}` : "--";
  const integrityDisplay = report ? `${report.score}%` : "--";

  let durationDisplay = "--:--";
  if (report?.timeTakenSeconds) {
    const m = Math.floor(report.timeTakenSeconds / 60);
    const s = report.timeTakenSeconds % 60;
    durationDisplay = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const warningsDisplay = report ? report.violations.length : "--";
  const isClean = report ? report.score >= 85 : true;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border-2 border-success/30"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground">Exam Submitted</h1>
          <p className="text-muted-foreground">Your exam has been successfully submitted and recorded.</p>
        </div>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{answeredDisplay}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div>
              <p className={`text-2xl font-bold font-mono ${!report ? 'text-foreground' : isClean ? 'text-success' : 'text-destructive'}`}>{integrityDisplay}</p>
              <p className="text-xs text-muted-foreground">Integrity</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{durationDisplay}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-mono">Proctoring Status</span>
              <span className={`flex items-center gap-1.5 font-mono text-xs ${!report ? 'text-muted-foreground' : isClean ? 'text-success' : 'text-destructive'}`}>
                {!report ? <Shield className="h-3.5 w-3.5" /> : isClean ? <Shield className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {!report ? "Unknown" : isClean ? "Clean" : "Flagged"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-mono">Warnings</span>
              <span className="font-mono text-xs text-foreground">{warningsDisplay}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-mono">Session ID</span>
              <span className="font-mono text-[10px] text-muted-foreground">SES-{new Date().getTime().toString(16).toUpperCase().slice(-8)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl border-border" onClick={() => navigate("/dashboard")}>
            <FileText className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button className="flex-1 rounded-xl glow-primary" onClick={() => navigate("/")}>
            Home <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
