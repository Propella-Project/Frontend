/**
 * Dashboard Layout
 * 
 * Main layout for the authenticated dashboard with header navigation.
 * Only accessible to authenticated users.
 */

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "./DashboardHeader";
import { LoadingScreen } from "./LoadingScreen";

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

  // If not authenticated, the auth context will redirect to login
  // This is a safety check
  if (!isAuthenticated) {
    return <LoadingScreen message="Redirecting to login..." />;
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
