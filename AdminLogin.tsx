import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Terminal, Loader2, Eye, EyeOff, Lock, BarChart3, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@university.edu");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      user.role = "admin";
      setUser(user);
      navigate("/admin");
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background gradient-mesh">
      {/* Left panel — Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
        <div className="relative z-10 space-y-8 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary mb-6">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-black text-foreground leading-tight">
              Admin Control <span className="text-primary">Center</span>
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              Monitor live exams, review AI-generated integrity reports, and manage your proctoring infrastructure.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            {[
              { icon: Users, title: "Live Student Monitoring", desc: "Real-time video feeds with AI anomaly overlay" },
              { icon: AlertTriangle, title: "Violation Tracking", desc: "Automated flagging with severity classification" },
              { icon: BarChart3, title: "Integrity Analytics", desc: "Trust score dashboards and session reports" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl glass-card"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex flex-1 items-center justify-center p-4 pt-24 lg:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile logo */}
          <div className="text-center space-y-2 lg:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary glow-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Portal</h1>
            <p className="text-sm text-muted-foreground font-mono">Proctoring Control Center</p>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Administrator Sign In</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Access the proctoring control panel</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-sm">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
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

                <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-4 text-center space-y-2">
                  <Lock className="mx-auto h-8 w-8 text-primary/40" />
                  <p className="text-xs text-muted-foreground font-mono">Two-factor authentication placeholder</p>
                </div>

                <Button type="submit" className="w-full rounded-lg glow-primary" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                  {loading ? "Authenticating..." : "Sign In as Admin"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Student? <a href="/login" className="text-primary hover:underline font-mono">Login here</a>
                </p>
              </form>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground font-mono">
              Protected by ProctorAI Security • Session encrypted with AES-256
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
