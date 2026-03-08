/**
 * Referrals Page
 * 
 * Displays referral statistics and leaderboard for authenticated users.
 * Fetches data from GET /api/accounts/referrals/
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Copy, Check, Share2, Gift } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { referralApi, type ReferralStats, type LeaderboardEntry } from "@/api/referral.api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReferralsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch referral stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, leaderboardData] = await Promise.all([
          referralApi.getReferralStats(),
          referralApi.getLeaderboard().then((res: { leaderboard: LeaderboardEntry[] }) => res.leaderboard).catch(() => []),
        ]);
        setStats(statsData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("[Referrals] Failed to fetch data:", error);
        toast.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get referral link
  const referralCode = stats?.user?.referral_code || user?.referral_code || "";
  const referralLink = referralCode
    ? `https://propella.ng?ref=${referralCode}`
    : "";

  // Copy referral link
  const copyReferralLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    if (!referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Propella",
          text: "Study smarter with AI-powered JAMB preparation!",
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyReferralLink();
    }
  };

  // Calculate estimated earnings (1 point = ₦3)
  const totalPoints = stats?.total_points || stats?.user?.referral_points || 0;
  const totalReferrals = stats?.total_referrals || stats?.user?.total_referrals || 0;
  const estimatedEarnings = totalPoints * 3;

  if (loading) {
    return (
      <DashboardLayout title="Referrals">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18A0FB]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Referrals">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Referrals</h1>
            <p className="text-gray-400">Invite friends and earn rewards</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Referrals
                </CardTitle>
                <Users className="h-4 w-4 text-[#C4F135]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalReferrals}</div>
                <p className="text-xs text-gray-500">
                  people joined using your link
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Points
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalPoints}</div>
                <p className="text-xs text-gray-500">
                  points earned from referrals
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Estimated Earnings
                </CardTitle>
                <Gift className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ₦{estimatedEarnings.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  1 point = ₦3
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Your Referral Link</CardTitle>
              <CardDescription className="text-gray-400">
                Share this link with friends to earn points when they join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 truncate">
                  {referralLink || "Generating link..."}
                </div>
                <Button
                  onClick={copyReferralLink}
                  disabled={!referralLink}
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={shareReferralLink}
                  disabled={!referralLink}
                  className="bg-[#7C3AED] hover:bg-[#5B21B6]"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Earn 10 points for each friend who signs up using your link
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referred Users List */}
        {stats?.referrals && stats.referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Referred Users</CardTitle>
                <CardDescription className="text-gray-400">
                  People who joined using your referral link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.referrals.map((referral: { id: string; nickname: string; date: string; points_earned: number }, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0B0B0F] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F2B8F] flex items-center justify-center text-sm font-medium text-white">
                          {referral.nickname?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-white">{referral.nickname}</span>
                      </div>
                      <span className="text-xs text-green-400">+10 points</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Leaderboard
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Top referrers this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.is_current_user
                          ? "bg-[#C4F135]/10 border border-[#18A0FB]/30"
                          : "bg-[#0B0B0F] border border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {entry.rank}
                        </span>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-sm font-medium text-white">
                          {entry.nickname?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-white">
                          {entry.nickname}
                          {entry.is_current_user && (
                            <span className="ml-2 text-xs text-[#C4F135]">(You)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {entry.total_referrals} refs
                        </span>
                        <span className="text-sm font-medium text-white">
                          {entry.referral_points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ReferralsPage;
