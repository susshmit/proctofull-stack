import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Eye, EyeOff, BookOpen, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Signup() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"student" | "admin">("student");
    const [adminKey, setAdminKey] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { user, access_token } = await registerApi(name, email, password, role, adminKey);

            // Note: Ideally, you'd store the token in localStorage or cookies
            localStorage.setItem("proctor_token", access_token);

            setUser({ ...user, role });
            if (role === "admin") {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during registration");
        } finally {
            setLoading(false);
        }
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
                    <p className="text-sm text-muted-foreground font-mono">Secure Examination Registration</p>
                </div>

                <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card rounded-xl overflow-hidden"
                >
                    <div className="p-6 pb-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <h2 className="text-lg font-semibold text-foreground">Student Registration</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Register to access secure exams</p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleSignup} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 p-1 bg-muted/50 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setRole("student")}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${role === "student" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("admin")}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${role === "admin" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Teacher
                                </button>
                            </div>

                            {role === "admin" && (
                                <div className="space-y-2">
                                    <Label htmlFor="adminKey" className="text-sm">Admin Secret Key</Label>
                                    <Input
                                        id="adminKey"
                                        type="password"
                                        placeholder="Enter admin secret key"
                                        value={adminKey}
                                        onChange={(e) => setAdminKey(e.target.value)}
                                        required
                                        className="rounded-lg bg-background border-border"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Alex Johnson"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="rounded-lg bg-background border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm">
                                    {role === "admin" ? "Teacher Email" : "Student Email"}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={role === "admin" ? "teacher@university.edu" : "student@university.edu"}
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

                            <Button type="submit" className="w-full rounded-lg mt-2" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                                {loading ? "Registering..." : "Create Account"}
                            </Button>

                            <p className="text-xs text-center text-muted-foreground pt-2">
                                Already have an account? <Link to="/login" className="text-primary hover:underline font-mono">Sign in</Link>
                            </p>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
