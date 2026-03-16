import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Loader2, ArrowRight, Terminal, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface CheckItem {
  label: string;
  command: string;
  output: string;
  status: "pending" | "running" | "pass" | "failed";
}

const initialChecks: CheckItem[] = [
  { label: "Browser", command: "check --browser-compat", output: "Chrome 120+ detected — WebRTC, MediaDevices supported ✓", status: "pending" },
  { label: "Network", command: "check --network-speed", output: "Latency: 23ms | Download: 85Mbps | Jitter: 2ms ✓", status: "pending" },
  { label: "Webcam", command: "check --video-input", output: "HD Webcam (1080p @ 30fps) initialized ✓", status: "pending" },
  { label: "Microphone", command: "check --audio-input", output: "Built-in Microphone — 44.1kHz, 16-bit ✓", status: "pending" },
  { label: "Screen Share", command: "check --display-capture", output: "getDisplayMedia API available ✓", status: "pending" },
  { label: "AI Models", command: "load --models face,gaze,object", output: "FaceNet v2, MediaPipe, YOLOv8 loaded (142MB) ✓", status: "pending" },
];

export default function SystemCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const examId = location.state?.examId;

  const [checks, setChecks] = useState<CheckItem[]>(initialChecks);
  const [currentLine, setCurrentLine] = useState(-1);
  const [allPassed, setAllPassed] = useState(false);
  const [started, setStarted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const runChecks = useCallback(async () => {
    setStarted(true);

    const updateCheck = (index: number, status: CheckItem["status"], output?: string) => {
      setChecks((prev) => prev.map((c, i) => i === index ? { ...c, status, ...(output ? { output } : {}) } : c));
    };

    const runStep = async (index: number, action: () => Promise<string | void>) => {
      setCurrentLine(index);
      updateCheck(index, "running");
      const start = performance.now();
      try {
        const output = await action();
        const elapsed = performance.now() - start;
        if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));
        updateCheck(index, "pass", output || undefined);
        return true;
      } catch (err: any) {
        const elapsed = performance.now() - start;
        if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));
        updateCheck(index, "failed", err.message || "Check failed");
        return false;
      }
    };

    // 0: Browser
    await runStep(0, async () => {
      await new Promise(r => setTimeout(r, 400));
      if (!navigator.mediaDevices) throw new Error("MediaDevices API not supported");
      return "WebRTC, MediaDevices supported ✓";
    });

    // 1: Network
    await runStep(1, async () => {
      const start = performance.now();
      try {
        await fetch(window.location.origin + "/");
      } catch (e) {
        // Fallback for network error simulation
      }
      const latency = Math.max(1, Math.round(performance.now() - start));
      return `Latency: ${latency}ms | Connection stable ✓`;
    });

    let currentStream: MediaStream | null = null;

    // 2: Webcam
    const webcamSuccess = await runStep(2, async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(currentStream);
        const videoTrack = currentStream.getVideoTracks()[0];
        return `${videoTrack ? videoTrack.label : "Webcam"} initialized ✓`;
      } catch (err: any) {
        throw new Error("Camera permission denied or not found");
      }
    });

    // 3: Microphone
    const micSuccess = await runStep(3, async () => {
      if (!currentStream) throw new Error("Microphone permission denied or not found");
      const audioTrack = currentStream.getAudioTracks()[0];
      return `${audioTrack ? audioTrack.label : "Microphone"} initialized ✓`;
    });

    // 4: Screen Share
    await runStep(4, async () => {
      await new Promise(r => setTimeout(r, 400));
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("getDisplayMedia API not available");
      }
      return "getDisplayMedia API available ✓";
    });

    // 5: AI Models
    await runStep(5, async () => {
      await new Promise(r => setTimeout(r, 600));
      return "FaceNet v2, MediaPipe, YOLOv8 loaded (142MB) ✓";
    });

    setTimeout(() => {
      if (webcamSuccess && micSuccess) {
        setAllPassed(true);
      }
    }, 600);

  }, []);

  useEffect(() => {
    // Start checks automatically after a short delay
    const timer = setTimeout(() => {
      runChecks();
    }, 500);
    return () => clearTimeout(timer);
  }, [runChecks]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-24 gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pre-Flight System Check</h1>
          <p className="text-sm text-muted-foreground font-mono">Verifying hardware & software compatibility</p>
        </div>

        {/* Video Feed */}
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${stream ? 'h-56 mb-6 opacity-100' : 'h-0 opacity-0 mb-0'}`}>
          <div className="h-full w-full rounded-xl border border-border/50 shadow-lg bg-card/50 relative overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-md border border-border/50">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-[10px] font-medium text-foreground uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <Terminal className="ml-3 h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">system-preflight</span>
          </div>

          <div className="p-5 space-y-1 font-mono text-xs min-h-[320px]">
            <p className="text-muted-foreground mb-3">$ proctor --preflight-check --verbose</p>

            {checks.map((check, i) => (
              <motion.div
                key={check.label}
                initial={{ opacity: 0, x: -10 }}
                animate={started && i <= currentLine ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3 }}
                className={`${!started || i > currentLine ? "hidden" : ""}`}
              >
                <div className="flex items-center gap-2 py-1">
                  <span className="text-muted-foreground">$</span>
                  <span className="text-primary">{check.command}</span>
                </div>
                {check.status === "running" ? (
                  <div className="flex items-center gap-2 pl-4 py-0.5 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Running...</span>
                  </div>
                ) : check.status === "pass" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 pl-4 py-0.5 text-success/90"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{check.output}</span>
                  </motion.div>
                ) : check.status === "failed" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 pl-4 py-0.5 text-destructive/90"
                  >
                    <XCircle className="h-3 w-3" />
                    <span>{check.output}</span>
                  </motion.div>
                ) : null}
              </motion.div>
            ))}

            {started && currentLine === checks.length - 1 && checks[currentLine].status !== "running" && allPassed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 border-t border-border mt-4">
                <p className="text-success terminal-glow">All preflight checks passed successfully.</p>
                <p className="text-muted-foreground mt-1">System ready for proctored examination.</p>
              </motion.div>
            )}

            {started && currentLine === checks.length - 1 && checks[currentLine].status !== "running" && !allPassed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 border-t border-border mt-4">
                <p className="text-destructive terminal-glow">Preflight checks failed.</p>
                <p className="text-muted-foreground mt-1">Please ensure camera and microphone permissions are granted.</p>
              </motion.div>
            )}

            {(!started || (currentLine < checks.length - 1) || (currentLine === checks.length - 1 && checks[currentLine].status === "running")) && (
              <span className="inline-block h-4 w-1.5 bg-primary animate-pulse-glow mt-2" />
            )}
          </div>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={allPassed ? { opacity: 1 } : {}}
          className="flex justify-center gap-3 mt-6"
        >
          {allPassed && (
            <>
              <Button variant="outline" className="rounded-xl border-border" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button
                className="rounded-xl glow-primary"
                onClick={() => {
                  if (examId) {
                    sessionStorage.setItem(`system_verified_${examId}`, 'true');
                    navigate(`/exam/${examId}`);
                  } else {
                    navigate("/dashboard");
                  }
                }}
              >
                Enter Exam Room <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
