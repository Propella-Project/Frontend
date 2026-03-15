import { motion } from "framer-motion";
import { Trophy, Medal, Star, Crown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/state/user.store";
import type { LeaderboardEntry } from "@/types/referral";

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <Star className="w-4 h-4 text-[#6D28D9]" />;
  }
};

const getRankStyle = (rank: number, isCurrentUser: boolean) => {
  if (isCurrentUser) {
    return "bg-gradient-to-r from-[#6D28D9]/30 to-[#CCFF00]/10 border-[#CCFF00]/50";
  }
  
  switch (rank) {
    case 1:
      return "bg-yellow-500/10 border-yellow-500/30";
    case 2:
      return "bg-gray-500/10 border-gray-500/30";
    case 3:
      return "bg-amber-600/10 border-amber-600/30";
    default:
      return "bg-[#1A1A1E] border-[#2A2A2E]";
  }
};

export function ReferralLeaderboard() {
  const { nickname, referralPoints, totalReferrals } = useUserStore();

  // Add current user to leaderboard if not already there
  const currentUserEntry: LeaderboardEntry = {
    rank: 0, // Will be calculated
    id: "current-user",
    nickname: nickname || "You",
    referralPoints,
    totalReferrals,
    isCurrentUser: true,
  };

  const allEntries = totalReferrals > 0 ? [currentUserEntry] : [];
  const sortedLeaderboard = allEntries
    .sort((a, b) => b.referralPoints - a.referralPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
    .slice(0, 10); // Top 10

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#F59E0B]" />
        <h3 className="text-sm font-medium text-[#9CA3AF]">Referral Leaderboard</h3>
      </div>

      <div className="bg-[#1A1A1E] rounded-xl border border-[#2A2A2E] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0F0F11] text-xs text-[#9CA3AF]">
          <span>Rank</span>
          <span className="flex-1 ml-4">User</span>
          <span className="text-right">Points</span>
        </div>

        {/* Leaderboard list */}
        <ScrollArea className="h-[200px]">
          <div className="divide-y divide-[#2A2A2E]">
            {sortedLeaderboard.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`flex items-center justify-between px-4 py-3 border-l-2 ${getRankStyle(
                  entry.rank,
                  entry.isCurrentUser
                )}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-[#9CA3AF]">
                    {entry.rank <= 3 ? (
                      getRankIcon(entry.rank)
                    ) : (
                      entry.rank
                    )}
                  </span>
                  <span className={`font-medium ${entry.isCurrentUser ? "text-[#CCFF00]" : "text-white"}`}>
                    {entry.nickname}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs text-[#9CA3AF]">(You)</span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#CCFF00]">
                    {entry.referralPoints} pts
                  </span>
                  <span className="text-xs text-[#9CA3AF]">
                    ({entry.totalReferrals} refs)
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {totalReferrals === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-[#9CA3AF] text-center py-2"
        >
          Start referring friends to appear on the leaderboard!
        </motion.p>
      )}
    </motion.div>
  );
}
