import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Route Guards
import {
  AuthGuard,
  RequireOnboarding,
  PreventCompletedOnboarding,
} from "@/routes/guards";

// Layouts
import {
  AuthLayout,
  OnboardingLayout,
  MainLayout,
  PaymentCallbackLayout,
  VerifyLayout,
} from "@/routes/layouts";

// Page Components
import { Login } from "@/sections/Login";
import { ForgotPasswordPage } from "@/sections/ForgottenPassword";
import { ResetPasswordPage } from "@/sections/ResetPassword";

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
    </BrowserRouter>
  );
}

export default App;
