import type { User, Exam, Question, Violation, ExamReport, ExamSession } from "@/types";

// Simulate network delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Mock data removed in favor of real database API endpoints.

// ---- API Functions ----

const API_URL = "/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("proctor_token");
  const isValidToken = token && token !== "undefined" && token !== "null" && token.trim() !== "";
  return {
    "Content-Type": "application/json",
    ...(isValidToken ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("proctor_token", data.access_token);
  }
  return data.user;
}

export async function register(name: string, email: string, password: string, role: string, adminKey?: string): Promise<{ user: User, access_token: string }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role, adminKey }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  const data = await response.json();
  return data;
}

export async function getServerTime(): Promise<{ utc_time: string; timestamp: number }> {
  const response = await fetch(`${API_URL}/time`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch server time");
  return response.json();
}

export async function createExam(examData: Partial<Exam>): Promise<{ message: string; exam_id: string; exam: Partial<Exam> }> {
  const response = await fetch(`${API_URL}/admin/exams`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(examData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || "Failed to create exam");
  }
  return response.json();
}

export async function getStudentResults(): Promise<{ exam_id: string; exam_title: string; final_score: number; submitted_at: string }[]> {
  const response = await fetch(`${API_URL}/student/results`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch student results");
  const data = await response.json();
  return data.results;
}

export async function getExams(): Promise<{ exams: Exam[] }> {
  const response = await fetch(`${API_URL}/admin/exams`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch exams");
  return response.json();
}

export async function deleteExam(examId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/admin/exams/${examId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete exam");
  }
  return response.json();
}

export async function removeStudentFromExam(examId: string, email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/admin/exams/${examId}/students/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to remove student from exam");
  }
  return response.json();
}

export async function getStudentExams(): Promise<Exam[]> {
  const response = await fetch(`${API_URL}/exams`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch student exams");
  return response.json();
}

export async function getExam(id: string): Promise<Exam | undefined> {
  const response = await fetch(`${API_URL}/exams/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch exam details");
  return response.json();
}

export async function startExam(examId: string): Promise<{ session: ExamSession; questions: Question[]; exam: Partial<Exam> }> {
  const response = await fetch(`${API_URL}/exams/start`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ exam_id: examId })
  });
  if (!response.ok) throw new Error("Failed to start exam");
  return response.json();
}

export async function submitExam(sessionId: string, answers: Record<string, string>, violations?: any[]): Promise<{ result: any }> {
  const response = await fetch(`${API_URL}/exams/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ session_id: sessionId, answers, violations })
  });
  if (!response.ok) throw new Error("Failed to submit exam");
  return response.json();
}

export async function sendMonitoringAlert(violation: Omit<Violation, "id">): Promise<{ acknowledged: boolean }> {
  await delay(200);
  console.log("Monitoring alert:", violation.type);
  return { acknowledged: true };
}

export async function getViolations(): Promise<Violation[]> {
  const response = await fetch(`${API_URL}/admin/violations`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return []; // Fallback to empty array if route isn't implemented
  return response.json();
}

export async function getReports(examId: string): Promise<{ reports: ExamReport[] }> {
  const response = await fetch(`${API_URL}/admin/reports/${examId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch exam reports");
  return response.json();
}

export async function getActiveStudents() {
  const response = await fetch(`${API_URL}/admin/active-students`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return []; // Fallback handling
  return response.json();
}

export async function generateReport(examId: string): Promise<{ reports: ExamReport[] }> {
  const response = await fetch(`${API_URL}/admin/reports/${examId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error("Failed to fetch exam reports");
  return response.json();
}
