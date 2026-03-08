import { motion } from "framer-motion";
import { User, Ticket, Star, Users, Wallet } from "lucide-react";
import { useUserStore } from "@/state/user.store";
import { useEffect } from "react";

export function ReferralStats() {
  const { username, nickname, user_id, referralCode, referralPoints, totalReferrals, fetchReferralStats, refreshUserData } = useUserStore();
  
  // Fetch live referral stats and user data on mount
  useEffect(() => {
    fetchReferralStats();
    refreshUserData();
  }, [fetchReferralStats, refreshUserData]);
  
  // Calculate earnings: 10 points = ₦30 (1 point = ₦3)
  const estimatedEarnings = referralPoints * 3;

  // Get username from backend (username > nickname > user_id > "User")
  const displayName = username || nickname || user_id || "User";

  const stats = [
    {
      label: "Username",
      value: displayName,
      icon: User,
      color: "text-[#3B82F6]",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Referral Code",
      value: referralCode || "---",
      icon: Ticket,
      color: "text-[#CCFF00]",
      bgColor: "bg-[#CCFF00]/10",
    },
    {
      label: "Referral Points",
      value: referralPoints,
      icon: Star,
      color: "text-[#F59E0B]",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Total Referrals",
      value: totalReferrals,
      icon: Users,
      color: "text-[#10B981]",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Estimated Earnings",
      value: `₦${estimatedEarnings}`,
      icon: Wallet,
      color: "text-[#8B5CF6]",
      bgColor: "bg-violet-500/10",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#9CA3AF] mb-3">Your Referral Stats</h3>
      
      <div className="grid grid-cols-1 gap-2">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-xl ${
              stat.highlight 
                ? "bg-gradient-to-r from-[#6D28D9]/20 to-[#CCFF00]/10 border border-[#6D28D9]/30" 
                : "bg-[#1A1A1E] border border-[#2A2A2E]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-sm text-[#9CA3AF]">{stat.label}</span>
            </div>
            <span className={`font-semibold ${stat.highlight ? "text-[#CCFF00] text-lg" : "text-white"}`}>
              {stat.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Points explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 p-3 bg-[#1A1A1E] rounded-xl border border-[#2A2A2E]"
      >
        <p className="text-xs text-[#9CA3AF] text-center">
          <span className="text-[#CCFF00]">1 referral</span> ={" "}
          <span className="text-[#CCFF00]">10 points</span> ={" "}
          <span className="text-[#CCFF00]">₦30</span>
        </p>
      </motion.div>
    </div>
  );
}
