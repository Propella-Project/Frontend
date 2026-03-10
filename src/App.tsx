import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Route Guards (small, keep in main chunk)
import {
  AuthGuard,
  RequireOnboarding,
  PreventCompletedOnboarding,
} from "@/routes/guards";

// Layouts – lazy loaded for smaller initial bundle
const AuthLayout = lazy(() => import("@/routes/layouts").then((m) => ({ default: m.AuthLayout })));
const OnboardingLayout = lazy(() => import("@/routes/layouts").then((m) => ({ default: m.OnboardingLayout })));
const MainLayout = lazy(() => import("@/routes/layouts").then((m) => ({ default: m.MainLayout })));
const PaymentCallbackLayout = lazy(() => import("@/routes/layouts").then((m) => ({ default: m.PaymentCallbackLayout })));
const VerifyLayout = lazy(() => import("@/routes/layouts").then((m) => ({ default: m.VerifyLayout })));

// Page Components – lazy loaded
const Login = lazy(() => import("@/sections/Login").then((m) => ({ default: m.Login })));
const ForgotPasswordPage = lazy(() => import("@/sections/ForgottenPassword").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/sections/ResetPassword").then((m) => ({ default: m.ResetPasswordPage })));

/**
 * App Router Configuration
 * 
 * Flow: / (Login) → (Onboarding if needed) → Dashboard
 * 
 * Protected routes ensure:
 * - Only authenticated users access onboarding and dashboard
 * - Onboarding must be completed before accessing dashboard
 * - Authenticated users cannot access auth pages
 */
function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Routes>
        {/* ============================================================
            AUTH ROUTES (Public - but redirects if already authenticated)
            ============================================================ */}
        <Route element={<AuthGuard><AuthLayout /></AuthGuard>}>
          {/* Root path IS the login page */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ============================================================
            ONBOARDING ROUTE (Protected - auth required, onboarding incomplete)
            ============================================================ */}
        <Route
          path="/onboarding"
          element={
            <PreventCompletedOnboarding>
              <OnboardingLayout />
            </PreventCompletedOnboarding>
          }
        />

        {/* ============================================================
            MAIN APP ROUTES (Protected - auth + onboarding required)
            ============================================================ */}
        <Route
          path="/dashboard"
          element={
            <RequireOnboarding>
              <MainLayout />
            </RequireOnboarding>
          }
        />

        {/* ============================================================
            PAYMENT VERIFY (Public - Flutterwave redirect_url target)
            ============================================================ */}
        <Route path="/verify" element={<VerifyLayout />} />

        {/* ============================================================
            PAYMENT CALLBACK (Public - legacy callback routes)
            ============================================================ */}
        <Route path="/payment/callback" element={<PaymentCallbackLayout />} />
        <Route path="/payment-success" element={<PaymentCallbackLayout />} />

        {/* ============================================================
            UNKNOWN ROUTES → Root (which is login)
            ============================================================ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
