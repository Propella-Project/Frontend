import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUserStore } from "@/state/user.store";
import { referralApi, type ReferralStats } from "@/api/referral.api";
import { buildReferralLink } from "@/utils/referral";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  Users, 
  Coins,
  ArrowLeft,
  Link2
} from "lucide-react";
import { toast } from "sonner";

interface ProfileProps {
  onBack?: () => void;
}

export function Profile({ onBack }: ProfileProps) {
  const { nickname, user_id } = useUserStore();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch referral stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await referralApi.getReferralStats();
        setReferralStats(stats);
      } catch (error) {
        console.error("Failed to fetch referral stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const referralCode = referralStats?.user?.referral_code || "";
  const referralLink = referralCode 
    ? buildReferralLink(referralCode, nickname || undefined)
    : "";
  const totalReferrals = referralStats?.user?.total_referrals || 0;
  const totalPoints = referralStats?.user?.referral_points || 0;

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: "Join Propella",
          text: `Use my referral code ${referralCode} to join Propella and start your JAMB preparation!`,
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-[#9CA3AF] hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-[#9CA3AF]">Manage your account & referrals</p>
        </div>
      </motion.header>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6D28D9] to-[#CCFF00] rounded-full flex items-center justify-center text-2xl">
              <User className="w-8 h-8 text-[#0F0F11]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{nickname || "Student"}</h2>
              <p className="text-sm text-[#9CA3AF]">ID: {user_id?.slice(0, 8) || "..."}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Referral Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-[#CCFF00]" />
          <h2 className="text-lg font-bold">Referral Program</h2>
        </div>

        <Card className="bg-gradient-to-br from-[#6D28D9]/20 to-[#1A1A1E] border-[#2A2A2E] p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0F0F11] rounded-lg p-4 text-center">
              <Users className="w-5 h-5 text-[#3B82F6] mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalReferrals}</p>
              <p className="text-xs text-[#9CA3AF]">Total Referrals</p>
            </div>
            <div className="bg-[#0F0F11] rounded-lg p-4 text-center">
              <Coins className="w-5 h-5 text-[#F59E0B] mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-xs text-[#9CA3AF]">Points Earned</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm text-[#9CA3AF]">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={loading ? "Loading..." : referralCode}
                  readOnly
                  className="bg-[#0F0F11] border-[#2A2A2E] text-center text-lg font-mono font-bold tracking-wider"
                />
              </div>
              <Button
                onClick={handleCopyCode}
                disabled={!referralCode || loading}
                className={`min-w-[100px] transition-all ${
                  copiedCode 
                    ? "bg-[#10B981] hover:bg-[#10B981]" 
                    : "bg-[#6D28D9] hover:bg-[#5B21B6]"
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm text-[#9CA3AF]">Referral Link</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  value={loading ? "Loading..." : referralLink}
                  readOnly
                  className="pl-10 bg-[#0F0F11] border-[#2A2A2E] text-sm truncate"
                />
              </div>
              <Button
                onClick={handleCopyLink}
                disabled={!referralLink || loading}
                variant="outline"
                className="border-[#2A2A2E] hover:bg-[#2A2A2E]"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={!referralLink || loading}
            className="w-full bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share with Friends
          </Button>

          {/* Info */}
          <div className="bg-[#0F0F11] rounded-lg p-4">
            <p className="text-sm text-[#9CA3AF]">
              Share your referral code with friends. When they sign up using your code, 
              you earn <Badge variant="outline" className="border-[#CCFF00] text-[#CCFF00] mx-1">10 points</Badge> per referral!
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Referral List */}
      {referralStats?.referrals && referralStats.referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {referralStats.referrals.map((referral, index) => (
              <Card
                key={referral.id}
                className="bg-[#1A1A1E] border-[#2A2A2E] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2A2A2E] rounded-full flex items-center justify-center text-lg font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{referral.nickname}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(referral.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]">
                  +{referral.points_earned} pts
                </Badge>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
