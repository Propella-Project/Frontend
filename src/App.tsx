/**
 * Propella Dashboard App
 * 
 * Authenticated dashboard application for Propella.
 * Hosted at: https://dashboard.propella.ng
 * API: https://api.propella.ng
 * 
 * This app requires authentication. It reads the token from localStorage
 * (set by the landing page at propella.ng) and uses it for API calls.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

// Dashboard Pages
import {
  DashboardPage,
  ReferralsPage,
  PaymentsPage,
  ProfilePage,
  StudyRoadmapPage,
  AiTutorPage,
} from "@/dashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Dashboard Routes - All require authentication via AuthProvider */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/study-roadmap" element={<StudyRoadmapPage />} />
          <Route path="/ai-tutor" element={<AiTutorPage />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A1D',
            color: '#F3F4F6',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
