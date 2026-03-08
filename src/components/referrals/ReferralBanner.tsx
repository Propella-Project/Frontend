import { motion } from "framer-motion";
import { Rocket, X } from "lucide-react";
import { useState, useEffect } from "react";
import { hasReferralData, getReferrerDisplayName } from "@/utils/referral";

export function ReferralBanner() {
  const [show, setShow] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    if (hasReferralData()) {
      setReferrerName(getReferrerDisplayName());
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-gradient-to-r from-[#6D28D9] to-[#CCFF00] p-4 rounded-xl mb-4"
    >
      <button
        onClick={() => setShow(false)}
        className="absolute top-2 right-2 text-[#0F0F11]/50 hover:text-[#0F0F11] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0F0F11]/10 rounded-full flex items-center justify-center">
          <Rocket className="w-5 h-5 text-[#0F0F11]" />
        </div>
        <div>
          <p className="text-[#0F0F11] font-semibold">
            🚀 You were referred by {referrerName || "a friend"}!
          </p>
          <p className="text-[#0F0F11]/70 text-sm">
            Welcome to PROPELLA. Start your JAMB preparation journey today.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default ReferralBanner;
