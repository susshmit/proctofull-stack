import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { startExam, submitExam } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@/types";

import { ProctoringManager } from "@/proctoring/ProctoringManager";
import { WarningPopup } from "@/components/proctoring/WarningPopup";
import { AIReportDashboard } from "@/components/proctoring/AIReportDashboard";
import type { BehaviorMetrics, ViolationRecord } from "@/proctoring/ViolationTracker";

export default function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [warningCount, setWarningCount] = useState(0);
  const maxWarnings = 5;
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const proctoringManagerRef = useRef<ProctoringManager | null>(null);

  // SaaS Real-Time Monitoring State
  const [integrityScore, setIntegrityScore] = useState(100);
  const [behaviorMetrics, setBehaviorMetrics] = useState<BehaviorMetrics | null>(null);

  // Dashboard End State
  const [showReport, setShowReport] = useState(false);
  const [finalReportData, setFinalReportData] = useState<{
    score: number,
    metrics: BehaviorMetrics,
    violations: ViolationRecord[],
    questionsAnswered: number,
    totalQuestions: number,
    timeTakenSeconds: number
  } | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (examId) {
      startExam(examId).then(({ questions: qs, session }) => {
        setQuestions(qs);
        setSessionId(session.id);
      }).catch(err => {
        console.error("Failed to start exam via API", err);
      });
    }
  }, [examId]);

  useEffect(() => {
    if (submitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !submitted) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  // Handle Exam Submission Interception Phase
  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    // Stop monitoring natively
    let finalLog = null;
    if (proctoringManagerRef.current) {
      proctoringManagerRef.current.stopProctoring();
      const rawLog = proctoringManagerRef.current.getFinalReport();
      finalLog = {
        ...rawLog,
        questionsAnswered: Object.keys(answers).length,
        totalQuestions: questions.length,
        timeTakenSeconds: 3600 - timeLeft
      };
      setFinalReportData(finalLog);
    }

    // Process backend submit decoupled from UI
    try {
      if (sessionId) {
        await submitExam(sessionId, answers, finalLog?.violations || []);
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
    }

    // Trigger SaaS dashboard popup instead of navigating away instantly
    if (finalLog) {
      setShowReport(true);
    } else {
      navigate("/exam-complete", { state: { report: null } });
    }
  }, [submitted, sessionId, answers, navigate]);

  // Actually finish and leave exam interface
  const handleFinishExam = () => {
    navigate("/exam-complete", { state: { report: finalReportData } });
  };

  // Advanced AI Proctoring Manager Initialization
  useEffect(() => {
    if (questions.length > 0 && videoRef.current && !submitted && !proctoringManagerRef.current) {
      const manager = new ProctoringManager({
        videoElement: videoRef.current,
        maxViolations: maxWarnings,
        onWarningStateChange: (isVisible, msg, current, _max) => {
          setShowWarning(isVisible);
          if (isVisible) {
            setWarningMsg(msg);
            setWarningCount(current);
          }
        },
        onAutoSubmit: () => {
          console.warn("Max violations reached. Executing auto-submit.");
          handleSubmit();
        },
        onProctoringUpdate: (score, metrics) => {
          setIntegrityScore(score);
          setBehaviorMetrics(metrics);
        }
      });

      proctoringManagerRef.current = manager;
      manager.startProctoring();
    }

    return () => {
      if (proctoringManagerRef.current && submitted) {
        proctoringManagerRef.current.stopProctoring();
      }
    };
  }, [questions.length, submitted, handleSubmit]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. If the time window closes, you cannot re-enter this exam. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const q = questions[currentQ];
  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;
  const isUrgent = timeLeft < 300;

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground font-mono">
        Loading exam...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background relative">

      {/* End of Exam AI Report Interceptor */}
      {showReport && finalReportData && (
        <AIReportDashboard
          score={finalReportData.score}
          metrics={finalReportData.metrics}
          violations={finalReportData.violations}
          questionsAnswered={finalReportData.questionsAnswered}
          totalQuestions={finalReportData.totalQuestions}
          timeTakenSeconds={finalReportData.timeTakenSeconds}
          onFinish={handleFinishExam}
        />
      )}

      {/* Normal Environment Rest */}
      {!showReport && (
        <WarningPopup
          isVisible={showWarning}
          message={warningMsg}
          currentWarning={warningCount}
          maxWarnings={maxWarnings}
        />
      )}

      {/* Real-Time SaaS Monitoring Panel */}
      <div className="absolute top-20 right-6 z-50 glass-card p-4 rounded-xl shadow-2xl border border-primary/20 w-64 animate-in fade-in slide-in-from-top-4 duration-500 hidden md:block">
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">AI Monitor Live</span>
          </div>
          <Shield className="h-4 w-4 text-primary opacity-50" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">Warnings</span>
            <Badge variant="outline" className={warningCount > 0 ? "text-destructive border-destructive/50" : "text-success border-success/50"}>
              {warningCount} / {maxWarnings}
            </Badge>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-mono text-muted-foreground">Integrity Score</span>
              <span className={`text-sm font-bold font-mono ${integrityScore >= 85 ? 'text-success' : integrityScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                {integrityScore}%
              </span>
            </div>
            <Progress
              value={integrityScore}
              className="h-1.5"
              indicatorClassName={`${integrityScore >= 85 ? 'bg-success' : integrityScore >= 60 ? 'bg-warning' : 'bg-destructive'}`}
            />
          </div>
        </div>
      </div>

      {/* Top bar — IDE style */}
      <header className="border-b border-border glass sticky top-0 z-40 px-4 py-2.5">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">proctored-exam</span>
            <span className="text-border">|</span>
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs font-mono">
                {warningCount} warn{warningCount > 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
              <span className="text-[10px] font-mono text-muted-foreground">REC</span>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 font-mono text-lg font-bold ${isUrgent ? "text-destructive animate-pulse-glow" : "text-foreground"
              }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Question navigator */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-card/30 p-4 gap-4">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Questions</h3>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`h-8 w-8 rounded-md text-xs font-mono transition-all ${i === currentQ
                  ? "bg-primary text-primary-foreground glow-primary"
                  : answers[questions[i].id]
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground border border-border hover:border-primary/30"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-auto space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Progress</span>
                <span>{Object.keys(answers).length}/{questions.length}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Webcam preview */}
            <div className="glass-card rounded-lg overflow-hidden">
              <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-glow" />
                  <span className="text-[9px] font-mono text-destructive/70">REC</span>
                </div>
              </div>
            </div>

            {/* Monitoring status */}
            <div className="space-y-1.5">
              {[
                { label: "Webcam", status: "Active" },
                { label: "Audio", status: "Active" },
                { label: "Screen", status: "Monitor" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="flex items-center gap-1 text-success">
                    <span className="h-1 w-1 rounded-full bg-success" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content — Question area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs border-border">
                    Q{currentQ + 1} / {questions.length}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize border-border font-mono">
                    {q.type === "mcq" ? "multiple-choice" : "true-false"}
                  </Badge>
                </div>

                <h2 className="text-lg font-semibold text-foreground leading-relaxed">{q.text}</h2>

                <div className="space-y-2.5">
                  {q.options.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className={`w-full text-left rounded-lg border p-4 text-sm transition-all ${answers[q.id] === opt
                        ? "border-primary bg-primary/10 text-foreground glow-primary"
                        : "border-border bg-card/30 text-foreground hover:border-primary/40"
                        }`}
                    >
                      <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-md border border-current text-xs font-mono">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-border"
                    disabled={currentQ === 0}
                    onClick={() => setCurrentQ((c) => c - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Prev
                  </Button>
                  {currentQ < questions.length - 1 ? (
                    <Button size="sm" className="rounded-lg" onClick={() => setCurrentQ((c) => c + 1)}>
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      className="rounded-lg bg-success hover:bg-success/90 text-success-foreground glow-success"
                    >
                      <Send className="mr-1 h-4 w-4" /> Submit
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
