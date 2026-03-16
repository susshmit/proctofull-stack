import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExam } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Exam } from "@/types";

export default function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (examId) getExam(examId).then((e) => setExam(e ?? null));
  }, [examId]);

  if (!exam)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground pt-20 font-mono">
        Loading...
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-24 gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl glass-card rounded-xl overflow-hidden"
      >
        <div className="space-y-1 text-center border-b border-border p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary glow-primary mb-2">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{exam.title}</h1>
          <p className="text-sm text-muted-foreground font-mono">
            Read instructions carefully before proceeding
          </p>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 border border-border p-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{exam.duration}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground font-mono">{exam.totalQuestions}</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary font-mono">AI</p>
              <p className="text-xs text-muted-foreground">Proctored</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning shrink-0" />
            <div className="text-sm text-foreground space-y-1">
              <p className="font-semibold">AI Proctoring Active</p>
              <p className="text-muted-foreground">
                Webcam, microphone, and screen activity will be monitored. Suspicious
                activity is flagged automatically.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Instructions</h2>
            <ul className="space-y-2">
              {(exam.instructions && exam.instructions.length > 0
                ? exam.instructions
                : [
                  "Ensure your face is clearly visible at all times.",
                  "Do not look away from the screen for extended periods.",
                  "Mobile phones and books are strictly prohibited.",
                  "Do not switch tabs or exit fullscreen mode.",
                  "Multiple people in the camera frame will result in immediate disqualification.",
                ]
              ).map((inst, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success shrink-0" />
                  <span>{inst}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-sm text-foreground">
              I have read and agree to the examination rules and AI proctoring policy
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-lg border-border"
              onClick={() => navigate("/dashboard")}
            >
              Go Back
            </Button>
            <Button
              className="flex-1 rounded-lg"
              disabled={!agreed}
              onClick={() => {
                sessionStorage.removeItem(`system_verified_${examId}`);
                navigate(`/system-check`, { state: { examId } });
              }}
            >
              Begin Exam
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
