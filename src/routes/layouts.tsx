import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/store";
import { Dashboard } from "@/sections/Dashboard";
import { RoadmapPage } from "@/sections/RoadmapPage";
import { TutorPage } from "@/sections/TutorPage";
import { TasksPage } from "@/sections/TasksPage";
import { QuizInterface } from "@/sections/QuizInterface";
import { QuestionCatalog } from "@/sections/QuestionCatalog";
import { Profile } from "@/sections/Profile";
import { OnboardingFlow } from "@/sections/OnboardingFlow";
import { BottomNav } from "@/components/BottomNav";
import { PaymentCallback } from "@/features/payment/PaymentCallback";
import { VerifyPage } from "@/features/payment/VerifyPage";
import { PaymentsVerifyPage } from "@/features/payment/PaymentsVerifyPage";
import { PayPage } from "@/sections/PayPage";

/**
 * Auth Layout - Minimal layout for auth pages (login, forgot-password, reset-password)
 * No navigation, no protected content
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0F0C15] text-[#F3F4F6]">
      <Outlet />
      <Toaster />
    </div>
  );
}

/**
 * Onboarding Layout - For onboarding flow
 * Authenticated users only, no main navigation
 */
export function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6]">
      <OnboardingFlow />
      <Toaster />
    </div>
  );
}

/**
 * Main App Layout - For dashboard and all app features
 * Authenticated + onboarding complete users
 * Includes bottom navigation and page transitions
 */
export function MainLayout() {
  const { currentPage } = useStore();

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6] pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "roadmap" && <RoadmapPage />}
          {currentPage === "tutor" && <TutorPage />}
          {currentPage === "tasks" && <TasksPage />}
          {currentPage === "quiz" && <QuizInterface />}
          {currentPage === "catalog" && <QuestionCatalog />}
          {currentPage === "profile" && <Profile onBack={() => useStore.getState().setCurrentPage("dashboard")} />}
        </motion.div>
      </AnimatePresence>

      {currentPage !== "quiz" && <BottomNav />}
      <Toaster />
    </div>
  );
}

/**
 * Payment Callback Layout - Handles payment redirects (legacy routes)
 */
export function PaymentCallbackLayout() {
  const navigate = useNavigate();
  const { setCurrentPage } = useStore();

  const handleComplete = () => {
    setCurrentPage("dashboard");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6]">
      <PaymentCallback onComplete={handleComplete} />
      <Toaster />
    </div>
  );
}

/**
 * Verify Layout - Payment verification page at /verify (legacy Flutterwave redirect_url)
 */
export function VerifyLayout() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6]">
      <VerifyPage />
      <Toaster />
    </div>
  );
}

/**
 * Payments Verify Layout - Flutterwave callback at /payments/verify
 * Reads tx_ref from query, POSTs { tx_ref } to API_BASE_URL + /accounts/verify-subscription/
 */
export function PaymentsVerifyLayout() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6]">
      <PaymentsVerifyPage />
      <Toaster />
    </div>
  );
}

/**
 * Pay Page Layout - Full-page subscription checkout at /dashboard/pay
 */
export function PayPageLayout() {
  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6]">
      <PayPage />
      <Toaster />
    </div>
  );
}
