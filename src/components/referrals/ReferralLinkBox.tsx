import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/state/user.store";
import { buildReferralLink } from "@/utils/referral";
import { toast } from "sonner";

export function ReferralLinkBox() {
  const { referralCode, nickname, user_id, fetchReferralStats } = useUserStore();
  const [copied, setCopied] = useState(false);

  // Fetch live referral stats on mount to get the latest referral code
  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  // Get user email from localStorage if available
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = userData.email || "";

  // Generate referral link using the user's personal referral code from backend
  // Falls back to a placeholder if not yet loaded
  const effectiveReferralCode = referralCode || "";
  const displayName = nickname || user_id || "User";
  
  const referralLink = effectiveReferralCode 
    ? buildReferralLink(effectiveReferralCode, displayName, userEmail)
    : "Loading your referral link...";

  const handleCopy = async () => {
    if (!effectiveReferralCode) {
      toast.error("Referral code not available yet. Please try again.");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <h3 className="text-sm font-medium text-[#9CA3AF]">Your Referral Link</h3>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            value={referralLink}
            readOnly
            disabled={!effectiveReferralCode}
            className="pl-10 bg-[#0F0F11] border-[#2A2A2E] text-[#9CA3AF] text-sm font-mono truncate disabled:opacity-50"
          />
        </div>
        
        <Button
          onClick={handleCopy}
          disabled={!effectiveReferralCode}
          className={`min-w-[100px] transition-all duration-300 disabled:opacity-50 ${
            copied 
              ? "bg-[#10B981] hover:bg-[#10B981]" 
              : "bg-[#6D28D9] hover:bg-[#5B21B6]"
          }`}
        >
          {copied ? (
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

      <p className="text-xs text-[#9CA3AF]">
        Share this link with friends. When they join using your code <span className="text-[#CCFF00] font-medium">{effectiveReferralCode || "..."}</span>, you earn points!
      </p>
    </motion.div>
  );
}
