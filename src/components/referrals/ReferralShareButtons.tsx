import { motion } from "framer-motion";
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  MessageCircle,
  Send,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/state/user.store";
import type { SharePlatform } from "@/types/referral";

const sharePlatforms = [
  {
    platform: "twitter" as SharePlatform,
    icon: Twitter,
    label: "Twitter",
    color: "bg-[#1DA1F2] hover:bg-[#1a91da]",
  },
  {
    platform: "facebook" as SharePlatform,
    icon: Facebook,
    label: "Facebook",
    color: "bg-[#4267B2] hover:bg-[#365899]",
  },
  {
    platform: "linkedin" as SharePlatform,
    icon: Linkedin,
    label: "LinkedIn",
    color: "bg-[#0077B5] hover:bg-[#006399]",
  },
  {
    platform: "whatsapp" as SharePlatform,
    icon: MessageCircle,
    label: "WhatsApp",
    color: "bg-[#25D366] hover:bg-[#1fb955]",
  },
  {
    platform: "sms" as SharePlatform,
    icon: Send,
    label: "SMS",
    color: "bg-[#6D28D9] hover:bg-[#5B21B6]",
  },
];

export function ReferralShareButtons() {
  const { referralCode, nickname, user_id } = useUserStore();

  const referralLink = `https://propella-lp.vercel.app/?ref=${referralCode || "REF123"}&name=${encodeURIComponent(nickname || "User")}&email=${encodeURIComponent(user_id ? `${user_id}@propella.app` : "user@propella.app")}`;

  const handleShare = (platform: SharePlatform) => {
    const text = `I just joined the PROPELLA waitlist! 🚀 AI-powered JAMB preparation is coming. Join me and be ready to ace your exams! ${referralLink}`;

    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;

      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;

      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;

      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;

      case "sms":
        url = `sms:?body=${encodeURIComponent(text)}`;
        break;
    }

    if (url) window.open(url, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-[#9CA3AF]" />
        <h3 className="text-sm font-medium text-[#9CA3AF]">Share With Friends</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {sharePlatforms.map((platform, index) => (
          <motion.div
            key={platform.platform}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05 }}
          >
            <Button
              onClick={() => handleShare(platform.platform)}
              className={`${platform.color} text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200`}
              size="sm"
            >
              <platform.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{platform.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
