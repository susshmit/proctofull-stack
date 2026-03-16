import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Camera, Mic, Wifi, Monitor, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Scan, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SystemCheck } from "@/types";

export default function StudentLogin() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [user, navigate]);
  const [email, setEmail] = useState("student@university.edu");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "system-check" | "biometric">("login");
  const [systemCheck, setSystemCheck] = useState<SystemCheck>({
    camera: "checking",
    microphone: "checking",
    internet: "checking",
    browser: "checking",
  });
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      // Removed hardcoded `user.role = "student";` since the backend correctly returns it
      setUser(user);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        setStep("biometric");
        setTimeout(() => navigate("/dashboard"), 2500);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const checkIcon = (status: "checking" | "pass" | "fail") => {
    if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-success" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 pt-24 gradient-mesh">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/30">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Student Portal</h1>
          <p className="text-sm text-muted-foreground font-mono">Secure Examination Access</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="p-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Student Sign In</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Enter your student credentials to access exams</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Student Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-lg bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded-lg pr-10 bg-background border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center space-y-2">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground font-mono">Face verification activates post-login</p>
                  </div>

                  <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                    {loading ? "Authenticating..." : "Sign In as Student"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Admin? <a href="/admin-login" className="text-primary hover:underline font-mono">Login here</a>
                  </p>
                </form>
              </div>
            </motion.div>
          ) : step === "system-check" ? (
            <motion.div
              key="system-check"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 text-xs font-mono text-muted-foreground">system-check</span>
              </div>
              <div className="p-5 space-y-2 font-mono text-xs">
                <p className="text-muted-foreground">$ proctor --preflight-check</p>
                {terminalLines.map((line, i) => (
                  <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-success/90">{line}</motion.p>
                ))}
                <span className="inline-block h-4 w-1.5 bg-primary animate-pulse-glow" />
              </div>
              <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                {[
                  { key: "browser" as const, label: "Browser", icon: Monitor },
                  { key: "internet" as const, label: "Network", icon: Wifi },
                  { key: "camera" as const, label: "Camera", icon: Camera },
                  { key: "microphone" as const, label: "Audio", icon: Mic },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-2.5">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                    {checkIcon(systemCheck[item.key])}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="biometric"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Biometric Verification</h2>
                <p className="text-sm text-muted-foreground">Scanning face for identity match...</p>
                <div className="relative mx-auto w-48 h-48 rounded-2xl border-2 border-primary/40 bg-muted/20 flex items-center justify-center overflow-hidden">
                  <Scan className="h-16 w-16 text-primary/30" />
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary glow-primary"
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-primary rounded-tl-md" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-primary rounded-tr-md" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-primary rounded-bl-md" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-primary rounded-br-md" />
                </div>
                <p className="text-xs font-mono text-success terminal-glow">Matching identity...</p>
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
