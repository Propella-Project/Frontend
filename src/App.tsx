import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SeoHead } from "@/components/seo/SeoHead";
import { Toaster } from "@/components/ui/sonner";

// Route Guards (small, keep in main chunk)
import {
  AuthGuard,
  RequireOnboarding,
  PreventCompletedOnboarding,
} from "@/routes/guards";

// Layouts – static import to avoid "Failed to fetch dynamically imported module" (Vite dev)
import {
  AuthLayout,
  OnboardingLayout,
  MainLayout,
  PayPageLayout,
  PaymentCallbackLayout,
  VerifyLayout,
  PaymentsVerifyLayout,
} from "@/routes/layouts";

// Page Components – lazy loaded
const Login = lazy(() => import("@/sections/Login"));
const ForgotPasswordPage = lazy(() => import("@/sections/ForgottenPassword"));
const ResetPasswordPage = lazy(() => import("@/sections/ResetPassword"));

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
        <SeoHead />
        <Routes>
          {/* ============================================================
            STANDALONE AUTH ROUTES (Public - no guard)
            Reset password must be outside AuthGuard so unauthenticated users can access
            ============================================================ */}
          <Route
            path="/reset-password/:uid/:token"
            element={
              <div className="min-h-screen bg-[#0F0C15] text-[#F3F4F6]">
                <ResetPasswordPage />
                <Toaster />
              </div>
            }
          />

          {/* ============================================================
            AUTH ROUTES (Public - but redirects if already authenticated)
            ============================================================ */}
          <Route
            element={
              <AuthGuard>
                <AuthLayout />
              </AuthGuard>
            }
          >
            {/* Root path IS the login page */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
            path="/dashboard/pay"
            element={
              <RequireOnboarding>
                <PayPageLayout />
              </RequireOnboarding>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireOnboarding>
                <MainLayout />
              </RequireOnboarding>
            }
          />

          {/* ============================================================
            PAYMENT VERIFY (Public - Flutterwave callback; tx_ref in query, POST verify-subscription with { tx_ref })
            ============================================================ */}
          <Route path="/payments/verify" element={<PaymentsVerifyLayout />} />
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
