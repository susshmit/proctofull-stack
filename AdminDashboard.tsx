import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getExams, getActiveStudents, getViolations, getReports } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, AlertTriangle, FileText, PlusCircle,
  Eye, BookOpen, Activity, BarChart3, GitCommit
} from "lucide-react";
import { motion } from "framer-motion";
import type { Exam, Violation, ExamReport } from "@/types";

type ActiveStudent = {
  id: string;
  name: string;
  exam: string;
  progress: number;
  warnings: number;
  status: "online" | "warning";
};

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <span className={className}>{display}</span>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [reports, setReports] = useState<ExamReport[]>([]);

  useEffect(() => {
    getExams().then(setExams);
    getActiveStudents().then(setStudents);
    getViolations().then(setViolations);
    getReports().then(setReports);
  }, []);

  const severityColor = (s: string) => {
    if (s === "high") return "bg-destructive/10 text-destructive border-destructive/30";
    if (s === "medium") return "bg-warning/10 text-warning border-warning/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const integrityColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const statusBadge = (s: ExamReport["status"]) => {
    if (s === "clean") return "bg-success/10 text-success border-success/30";
    if (s === "suspicious") return "bg-warning/10 text-warning border-warning/30";
    return "bg-destructive/10 text-destructive border-destructive/30";
  };

  const studentBorderColor = (warnings: number) => {
    if (warnings >= 3) return "border-l-destructive/60";
    if (warnings >= 1) return "border-l-warning/60";
    return "border-l-success/60";
  };

  const statsData = [
    { label: "Active Exams", value: exams.filter((e) => e.status === "active").length, icon: BookOpen, color: "text-primary" },
    { label: "Live Students", value: students.length, icon: Users, color: "text-success" },
    { label: "Violations", value: violations.length, icon: AlertTriangle, color: "text-warning" },
    { label: "Avg Integrity", value: reports.length ? Math.round(reports.reduce((a, r) => a + r.integrityScore, 0) / reports.length) : 0, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background pt-20 gradient-mesh">
      <main className="container py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-foreground">Admin Control Panel</h1>
            <p className="text-muted-foreground font-mono text-sm">Welcome, {user?.name || "Admin"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs font-mono text-success">System Active</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statsData.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-xl p-4 flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <AnimatedNumber value={stat.value} className="text-2xl font-black text-foreground font-mono" />
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="bg-card border border-border rounded-lg p-1">
            <TabsTrigger value="students" className="rounded-md font-mono text-xs"><Users className="mr-1.5 h-3.5 w-3.5" />Monitor</TabsTrigger>
            <TabsTrigger value="violations" className="rounded-md font-mono text-xs"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Violations</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-md font-mono text-xs"><GitCommit className="mr-1.5 h-3.5 w-3.5" />Reports</TabsTrigger>
            <TabsTrigger value="create" className="rounded-md font-mono text-xs"><PlusCircle className="mr-1.5 h-3.5 w-3.5" />Create</TabsTrigger>
          </TabsList>

          {/* Live Monitor */}
          <TabsContent value="students">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" />
                <h2 className="text-sm font-mono text-muted-foreground">Live Student Monitoring</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {students.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`glass-card rounded-xl overflow-hidden border-l-4 ${studentBorderColor(s.warnings)}`}
                  >
                    <div className="aspect-[4/3] bg-muted/20 relative flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground/20" />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${s.status === "warning" ? "bg-warning" : "bg-success"} animate-pulse-glow`} />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {s.status === "warning" ? "FLAG" : "LIVE"}
                        </span>
                      </div>
                      {s.warnings > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className={`text-[10px] font-mono ${severityColor(s.warnings >= 3 ? "high" : "medium")}`}>
                            {s.warnings}⚠
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                          <span>Integrity</span>
                          <span>{Math.max(100 - s.warnings * 15, 40)}%</span>
                        </div>
                        <Progress value={Math.max(100 - s.warnings * 15, 40)} className="h-1.5" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-xs rounded-md h-7 font-mono border-border">
                        <Eye className="mr-1 h-3 w-3" />View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Violations */}
          <TabsContent value="violations">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="text-sm font-mono text-muted-foreground">Detected Violations</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-mono text-xs">Student</TableHead>
                    <TableHead className="font-mono text-xs">Type</TableHead>
                    <TableHead className="font-mono text-xs">Severity</TableHead>
                    <TableHead className="font-mono text-xs">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((v) => (
                    <TableRow key={v.id} className="border-border">
                      <TableCell className="font-medium text-sm">{v.studentName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {v.type.replace(/-/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-xs ${severityColor(v.severity)}`}>
                          {v.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(v.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>

          {/* Reports — Git commit style */}
          <TabsContent value="reports">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-mono text-muted-foreground">Exam Reports</h2>
              </div>
              <div className="divide-y divide-border">
                {reports.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Commit dot */}
                      <div className={`h-3 w-3 rounded-full border-2 shrink-0 ${
                        r.status === "clean" ? "border-success bg-success/20" :
                        r.status === "suspicious" ? "border-warning bg-warning/20" :
                        "border-destructive bg-destructive/20"
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{r.studentName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{r.examTitle}</span>
                          <Badge variant="outline" className={`text-[10px] font-mono ${statusBadge(r.status)}`}>
                            {r.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                          <span>answered: {r.answered}/{r.totalQuestions}</span>
                          <span>violations: {r.violations}</span>
                          <span>{new Date(r.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xl font-bold font-mono ${integrityColor(r.integrityScore)}`}>
                          {r.integrityScore}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                        <div className="w-24 mt-1">
                          <Progress value={r.integrityScore} className="h-1" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Create Exam */}
          <TabsContent value="create">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl max-w-2xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-mono text-muted-foreground">Create New Exam</h2>
              </div>
              <div className="p-5">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("Exam created (mock)");
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-xs font-mono">Exam Title</Label>
                      <Input id="title" placeholder="e.g. Midterm Exam" required className="rounded-lg bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-mono">Subject</Label>
                      <Input id="subject" placeholder="e.g. Computer Science" required className="rounded-lg bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-xs font-mono">Duration (min)</Label>
                      <Input id="duration" type="number" placeholder="60" required className="rounded-lg bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="questions" className="text-xs font-mono">Questions</Label>
                      <Input id="questions" type="number" placeholder="25" required className="rounded-lg bg-background border-border" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="schedule" className="text-xs font-mono">Schedule</Label>
                      <Input id="schedule" type="datetime-local" required className="rounded-lg bg-background border-border" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" className="rounded-lg">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono">
                      AI proctoring enabled by default
                    </span>
                  </div>
                </form>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
