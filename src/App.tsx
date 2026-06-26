import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseView from "./pages/CourseView";
import Community from "./pages/Community";
import Challenges from "./pages/Challenges";
import ChallengeView from "./pages/ChallengeView";
import CreateChallenge from "./pages/CreateChallenge";
import ProgressPage from "./pages/ProgressPage";

import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import Waitlist from "./pages/Waitlist";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import CourseCreator from "./pages/CourseCreator";
import PublicCourses from "./pages/PublicCourses";
import CourseEditor from "./pages/CourseEditor";
import BusinessLabDemo from "./pages/BusinessLabDemo";
import LabsPreview from "./pages/LabsPreview";
import GeneratingPreview from "./pages/GeneratingPreview";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <OnboardingFlow />
        <BrowserRouter>
          <Routes>
            {/* Pages without sidebar */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/lab/demo-business" element={<BusinessLabDemo />} />
            <Route path="/labs/preview" element={<LabsPreview />} />
            <Route path="/dev/generating" element={<GeneratingPreview />} />
            <Route path="/courses/:id" element={<CourseView />} />

            {/* Dashboard pages — persistent sidebar */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/create" element={<CourseCreator />} />
              <Route path="/courses/explore" element={<PublicCourses />} />
              {/* CourseView moved outside DashboardLayout for custom editorial layout */}
              <Route path="/courses/:id/edit" element={<CourseEditor />} />
              <Route path="/community" element={<Community />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/challenges/create" element={<CreateChallenge />} />
              <Route path="/challenges/:id" element={<ChallengeView />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
