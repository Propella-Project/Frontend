/**
 * Dashboard Layout
 * 
 * Main layout for the authenticated dashboard with header navigation.
 */

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "./DashboardHeader";
import { LoadingScreen } from "./LoadingScreen";
import { Button } from "@/components/ui/button";
import { ENV } from "@/config/env";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }

  // If not authenticated, show message to go back to landing page
  // (Landing page handles login, then redirects back here)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F0F11] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Session Expired</h2>
          <p className="text-gray-400 mb-6">
            Please log in through the landing page to access the dashboard.
          </p>
          <Button 
            onClick={() => window.location.href = ENV.LANDING_PAGE_URL}
            className="bg-[#18A0FB] hover:bg-[#0B54A0]"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6]">
      {/* Header with Navigation */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default DashboardLayout;
