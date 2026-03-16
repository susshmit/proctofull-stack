import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { ScrollToTop } from "@/components/ScrollToTop";
import Footer from "@/components/Footer";
import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";
import Signup from "./pages/Signup";
import AdminLogin from "./pages/AdminLogin";
import SystemCheck from "./pages/SystemCheck";
import StudentDashboard from "./pages/StudentDashboard";
import ExamInstructions from "./pages/ExamInstructions";
import ExamInterface from "./pages/ExamInterface";
import ExamComplete from "./pages/ExamComplete";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ExamProtectedRoute({ children }: { children: React.ReactNode }) {
  const { examId } = useParams();

  // If no examId or if verification flag is missing/false, redirect to dashboard or system check
  if (!examId || sessionStorage.getItem(`system_verified_${examId}`) !== 'true') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/system-check" element={<SystemCheck />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/exam/:examId/instructions" element={<ExamInstructions />} />
          <Route path="/exam/:examId" element={<ExamProtectedRoute><ExamInterface /></ExamProtectedRoute>} />
          <Route path="/exam-complete" element={<ExamComplete />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <AnimatedRoutes />
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
