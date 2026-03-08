/**
 * Dashboard Layout
 * 
 * Main layout for the dashboard. No auth blocking.
 */

import { motion } from "framer-motion";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white">
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
