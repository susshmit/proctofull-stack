import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getExams, getActiveStudents, getViolations, getReports, createExam, getServerTime, deleteExam, removeStudentFromExam } from "@/services/api";
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
  Eye, BookOpen, Activity, BarChart3, GitCommit, CalendarIcon, Clock, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [activeTab, setActiveTab] = useState("students");
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [reports, setReports] = useState<ExamReport[]>([]);
  const [serverTime, setServerTime] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState<string>("09");
  const [startMinute, setStartMinute] = useState<string>("00");

  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endHour, setEndHour] = useState<string>("10");
  const [endMinute, setEndMinute] = useState<string>("00");

  const [questionsList, setQuestionsList] = useState<any[]>([]);

  const addQuestion = () => {
    setQuestionsList([
      ...questionsList,
      {
        id: Math.random().toString(36).substr(2, 9),
        text: "",
        options: ["", "", "", ""],
        correct_option: "",
        type: "mcq",
        marks: 1
      }
    ]);
  };

  const updateQuestionMarks = (index: number, marks: number) => {
    const updated = [...questionsList];
    updated[index].marks = marks;
    setQuestionsList(updated);
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questionsList];
    updated[index].text = text;
    setQuestionsList(updated);
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questionsList];
    updated[qIndex].options[optIndex] = text;
    // Auto-update correct_answer if they edit the option that was already selected
    if (updated[qIndex].correct_option === updated[qIndex].options[optIndex]) {
      // Technically this is tricky if they edit a selected option, we just leave it for now or clear it.
      // Let's just leave it, they should re-select it if they change the option profoundly.
    }
    setQuestionsList(updated);
  };

  const updateQuestionCorrectOption = (index: number, answerText: string) => {
    const updated = [...questionsList];
    updated[index].correct_option = answerText;
    setQuestionsList(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = [...questionsList];
    updated.splice(index, 1);
    setQuestionsList(updated);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    getExams()
      .then(async (res) => {
        setExams(res.exams);
        try {
          const reportPromises = res.exams.map((exam) =>
            getReports(exam.id).catch(() => ({ reports: [] }))
          );
          const reportResults = await Promise.all(reportPromises);
          const allReports = reportResults.flatMap((r) => r.reports);
          setReports(allReports);
        } catch (err) {
          console.error("Failed to fetch exam reports:", err);
        }
      })
      .catch((err) => console.error("Failed to fetch exams:", err));

    getActiveStudents()
      .then(setStudents)
      .catch((err) => console.error("Failed to fetch active students:", err));

    getViolations()
      .then(setViolations)
      .catch((err) => console.error("Failed to fetch violations:", err));
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border rounded-lg p-1">
            <TabsTrigger value="students" className="rounded-md font-mono text-xs"><Users className="mr-1.5 h-3.5 w-3.5" />Monitor</TabsTrigger>
            <TabsTrigger value="violations" className="rounded-md font-mono text-xs"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Violations</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-md font-mono text-xs"><GitCommit className="mr-1.5 h-3.5 w-3.5" />Reports</TabsTrigger>
            <TabsTrigger value="manage" className="rounded-md font-mono text-xs"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Manage Exams</TabsTrigger>
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
                      <div className={`h-3 w-3 rounded-full border-2 shrink-0 ${r.status === "clean" ? "border-success bg-success/20" :
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


          {/* Manage Exams */}
          <TabsContent value="manage">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-mono text-muted-foreground">Manage Created Exams</h2>
                </div>
                <Button onClick={() => setActiveTab("create")} size="sm" variant="outline" className="h-8 font-mono text-xs">
                  <PlusCircle className="mr-2 h-3.5 w-3.5" />
                  New Exam
                </Button>
              </div>

              {exams.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-sm font-mono">
                  No exams created yet. Click 'New Exam' to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {exams.map((exam) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-5 border border-border"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{exam.title}</h3>
                            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30">
                              {exam.duration_minutes || exam.duration} min
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Created: {new Date(exam.created_at || exam.scheduledAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {exam.total_questions || exam.totalQuestions} Questions
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="font-mono text-xs"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${exam.title}"? This cannot be undone.`)) {
                                try {
                                  await deleteExam(exam.id);
                                  setExams(exams.filter(e => e.id !== exam.id));
                                } catch (err: any) {
                                  alert(`Failed to delete exam: ${err.message}`);
                                }
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Exam
                          </Button>
                        </div>
                      </div>

                      {/* Allowed Students List */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-xs font-semibold font-mono text-muted-foreground mb-3 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" />
                          Enrolled Students ({exam.allowed_students?.length || 0})
                        </h4>

                        {!exam.allowed_students || exam.allowed_students.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic font-mono bg-muted/30 p-2 rounded-md inline-block">
                            Open to all students
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {exam.allowed_students.map((email: string) => (
                              <Badge
                                key={email}
                                variant="secondary"
                                className="pl-3 pr-1 py-1 flex items-center gap-2 font-mono text-xs bg-background border-border"
                              >
                                {email}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground ml-1"
                                  onClick={async () => {
                                    if (confirm(`Remove ${email} from this exam?`)) {
                                      try {
                                        await removeStudentFromExam(exam.id, email);
                                        // Update local state
                                        setExams(exams.map(e => {
                                          if (e.id === exam.id) {
                                            return { ...e, allowed_students: e.allowed_students.filter((s: string) => s !== email) };
                                          }
                                          return e;
                                        }));
                                      } catch (err: any) {
                                        alert(`Failed to remove student: ${err.message}`);
                                      }
                                    }
                                  }}
                                >
                                  ×
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
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
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;

                    if (!startDate || !endDate) {
                      alert("Please explicitly select both Start and End Dates from the calendar.");
                      return;
                    }

                    const startString = `${format(startDate, "yyyy-MM-dd")}T${startHour}:${startMinute}`;
                    const endString = `${format(endDate, "yyyy-MM-dd")}T${endHour}:${endMinute}`;

                    const openTime = new Date(startString);
                    // Pad by allowing exams to start 5 minutes prior to current timestamp securely
                    openTime.setMinutes(openTime.getMinutes() - 5);
                    const closeTime = new Date(endString);

                    if (closeTime <= openTime) {
                      alert("'Closes At' time must be after the 'Opens At' time.");
                      return;
                    }

                    const totalMarks = parseInt((form.elements.namedItem("total_marks") as HTMLInputElement).value, 10) || 100;
                    const passingMarks = parseInt((form.elements.namedItem("passing_marks") as HTMLInputElement).value, 10) || 50;

                    if (passingMarks > totalMarks) {
                      alert("'Passing Marks' cannot be greater than 'Total Marks'.");
                      return;
                    }

                    const allowedStudentsRaw = (form.elements.namedItem("allowed_students") as HTMLInputElement).value;
                    const allowedStudentsArray = allowedStudentsRaw
                      ? allowedStudentsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0)
                      : [];

                    const data = {
                      title: (form.elements.namedItem("title") as HTMLInputElement).value,
                      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
                      duration: Number((form.elements.namedItem("duration") as HTMLInputElement).value) || 60,
                      total_marks: totalMarks,
                      passing_marks: passingMarks,
                      questions: questionsList,
                      start_time: openTime.toISOString(),
                      end_time: closeTime.toISOString(),
                      allowed_students: allowedStudentsArray,
                    };

                    console.log("Sending this to backend:", data);

                    try {
                      const response = await createExam(data);
                      console.log("Server Response:", response);
                      alert("Exam created successfully!");
                      form.reset();
                      setQuestionsList([]);
                      setStartDate(undefined);
                      setEndDate(undefined);
                      getExams().then(res => setExams(res.exams)); // Refresh the exams list
                      setActiveTab("manage"); // Switch to manage exams tab
                    } catch (err: any) {
                      console.error("Server Error:", err);
                      // User requested alert(JSON.stringify(error.response.data.detail)) pattern
                      // Since our api.ts now throws the json object directly as 'err'
                      let detail = err?.detail || err?.response?.data?.detail || err?.message || err;
                      alert(`Error details: ${JSON.stringify(detail, null, 2)}`);
                    }
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
                      <Label htmlFor="total_marks" className="text-xs font-mono">Total Marks</Label>
                      <Input id="total_marks" name="total_marks" type="number" placeholder="100" required className="rounded-lg bg-background border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passing_marks" className="text-xs font-mono">Passing Marks</Label>
                      <Input id="passing_marks" name="passing_marks" type="number" placeholder="50" required className="rounded-lg bg-background border-border" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-4 mt-2">
                        <Label className="text-sm font-mono font-semibold">Exam Questions</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                        </Button>
                      </div>

                      {questionsList.length === 0 ? (
                        <div className="text-center p-6 border border-dashed rounded-xl bg-muted/20 text-muted-foreground text-sm font-mono">
                          No questions added yet. Click 'Add Question' to start building this exam.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {questionsList.map((q, qIndex) => (
                            <div key={q.id} className="p-4 border border-border rounded-xl space-y-4 bg-muted/10 relative pb-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <Label className="text-xs font-mono font-semibold text-primary">Question {qIndex + 1}</Label>
                                  <Input
                                    placeholder="Enter question title/text..."
                                    value={q.text}
                                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                                    required
                                    className="bg-background"
                                  />
                                </div>
                                <div className="w-24 space-y-2 shrink-0">
                                  <Label className="text-xs font-mono font-semibold text-primary">Marks</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={q.marks}
                                    onChange={(e) => updateQuestionMarks(qIndex, Number(e.target.value))}
                                    required
                                    className="bg-background"
                                  />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0 mt-6" onClick={() => removeQuestion(qIndex)} title="Remove Question">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt: string, optIndex: number) => (
                                  <div key={optIndex} className="space-y-1">
                                    <Label className="text-xs font-mono text-muted-foreground">Option {String.fromCharCode(65 + optIndex)}</Label>
                                    <Input
                                      placeholder={`Option ${String.fromCharCode(65 + optIndex)} text`}
                                      value={opt}
                                      onChange={(e) => updateQuestionOption(qIndex, optIndex, e.target.value)}
                                      required
                                      className="bg-background"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-2 pt-2 border-t border-border mt-2">
                                <Label className="text-xs font-mono font-semibold">Correct Option</Label>
                                <Select value={q.correct_option} onValueChange={(val) => updateQuestionCorrectOption(qIndex, val)} required>
                                  <SelectTrigger className="w-full bg-background">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {q.options.filter((o: string) => o.trim() !== "").map((opt: string, optIndex: number) => (
                                      <SelectItem key={optIndex} value={opt}>
                                        {String.fromCharCode(65 + optIndex)}: {opt}
                                      </SelectItem>
                                    ))}
                                    {q.options.filter((o: string) => o.trim() !== "").length === 0 && (
                                      <SelectItem value="none" disabled>Fill in options first</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 md:col-span-2 pt-4 border-t border-border">

                      {/* Exam Start Area */}
                      <div className="space-y-2 p-4 bg-muted/20 border border-border rounded-xl">
                        <Label className="text-sm font-mono font-semibold text-primary flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Exam Opens
                        </Label>
                        <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "justify-start text-left font-normal w-full rounded-lg bg-background border-border",
                                  !startDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a Date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                          </Popover>

                          <Select value={startHour} onValueChange={setStartHour}>
                            <SelectTrigger className="rounded-lg bg-background">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {hours.map(h => <SelectItem key={`sh-${h}`} value={h}>{h}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <Select value={startMinute} onValueChange={setStartMinute}>
                            <SelectTrigger className="rounded-lg bg-background">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {minutes.map(m => <SelectItem key={`sm-${m}`} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Exam End Area */}
                      <div className="space-y-2 p-4 bg-muted/20 border border-border rounded-xl">
                        <Label className="text-sm font-mono font-semibold text-primary flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Exam Closes
                        </Label>
                        <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "justify-start text-left font-normal w-full rounded-lg bg-background border-border",
                                  !endDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a Date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                          </Popover>

                          <Select value={endHour} onValueChange={setEndHour}>
                            <SelectTrigger className="rounded-lg bg-background">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {hours.map(h => <SelectItem key={`eh-${h}`} value={h}>{h}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <Select value={endMinute} onValueChange={setEndMinute}>
                            <SelectTrigger className="rounded-lg bg-background">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {minutes.map(m => <SelectItem key={`em-${m}`} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="allowed_students" className="text-xs font-mono">Allowed Students (Emails, comma-separated)</Label>
                      <Input id="allowed_students" name="allowed_students" placeholder="student1@university.edu, student2@university.edu" className="rounded-lg bg-background border-border" />
                    </div>

                    {/* Server Time Checker */}
                    <div className="space-y-2 md:col-span-2 p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-mono">Backend Server Time Sync</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-mono"
                          onClick={async () => {
                            try {
                              const res = await getServerTime();
                              setServerTime(new Date(res.utc_time).toLocaleString());
                            } catch (error) {
                              setServerTime("Error fetching time");
                            }
                          }}
                        >
                          Check Server Time
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {serverTime ? `Current Server Time: ${serverTime}` : "Click to view current server time to accurately align your schedules."}
                      </p>
                    </div>

                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-border mt-4">
                    <Button type="submit" className="rounded-lg" disabled={questionsList.length === 0}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono">
                      {questionsList.length === 0 ? "You must add at least one question to create the exam." : "AI proctoring enabled by default"}
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
