import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentExams, getStudentResults } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Calendar, ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import type { Exam } from "@/types";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Record<string, number>>({});

  useEffect(() => {
    getStudentExams().then(setExams).catch(err => console.error("Could not load exams", err));

    getStudentResults()
      .then(data => {
        const scoreMap: Record<string, number> = {};
        data.forEach(item => {
          scoreMap[item.exam_id] = item.final_score;
        });
        setResults(scoreMap);
      })
      .catch(err => console.error("Could not load exam results", err));
  }, []);

  const statusColor = (status: Exam["status"]) => {
    if (status === "active") return "bg-success/10 text-success border-success/30";
    if (status === "upcoming") return "bg-primary/10 text-primary border-primary/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background pt-20 gradient-mesh">
      <main className="container py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-xs font-mono text-success">System Online</span>
          </div>
          <h1 className="text-3xl font-black text-foreground">
            Welcome back, <span className="text-primary">{user?.name || "Student"}</span>
          </h1>
          <p className="text-muted-foreground">Your proctored examinations</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="glass-card rounded-xl overflow-hidden group hover:border-primary/30 transition-all"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground leading-tight">{exam.title}</h3>
                    <p className="text-sm text-muted-foreground">{exam.subject}</p>
                  </div>
                  <Badge variant="outline" className={statusColor(exam.status)}>
                    {exam.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{exam.duration}m</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{exam.totalQuestions}Q</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(exam.scheduledAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {exam.status === "active" ? (
                  <Button
                    className="w-full rounded-lg group-hover:glow-primary transition-shadow"
                    onClick={() => navigate(`/exam/${exam.id}/instructions`)}
                  >
                    Start Exam <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : exam.status === "upcoming" ? (
                  <Button className="w-full rounded-lg" variant="outline" disabled>
                    Not Yet Available
                  </Button>
                ) : (
                  <Button className="w-full rounded-lg" variant="secondary" disabled>
                    {results[exam.id] !== undefined ? `Completed - ${results[exam.id].toFixed(0)}%` : "Completed"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
