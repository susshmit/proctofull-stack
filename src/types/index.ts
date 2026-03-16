export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  avatar?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number; // minutes
  duration_minutes?: number;
  totalQuestions: number;
  total_questions?: number;
  scheduledAt: string;
  created_at?: string;
  status: "upcoming" | "active" | "completed";
  instructions: string[];
  start_time?: string;
  end_time?: string;
  allowed_students?: string[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  type: "mcq" | "true-false";
}

export interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  answers: Record<string, string>;
  warnings: Violation[];
  status: "in-progress" | "submitted" | "flagged";
}

export interface Violation {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  type: "face-not-visible" | "multiple-faces" | "tab-switch" | "noise-detected" | "phone-detected" | "looking-away";
  severity: "low" | "medium" | "high";
  timestamp: string;
  screenshot?: string;
}

export interface ExamReport {
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  totalQuestions: number;
  answered: number;
  integrityScore: number; // 0-100
  violations: number;
  submittedAt: string;
  status: "clean" | "suspicious" | "flagged";
}

export interface SystemCheck {
  camera: "checking" | "pass" | "fail";
  microphone: "checking" | "pass" | "fail";
  internet: "checking" | "pass" | "fail";
  browser: "checking" | "pass" | "fail";
}
