import { Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReferralAnimation } from "./ReferralAnimation";
import { ReferralStats } from "./ReferralStats";
import { ReferralLinkBox } from "./ReferralLinkBox";
import { ReferralShareButtons } from "./ReferralShareButtons";
import { ReferralLeaderboard } from "./ReferralLeaderboard";

interface ReferralPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralPanel({ isOpen, onClose }: ReferralPanelProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 bg-[#0F0F11] border-[#2A2A2E] overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-[#6D28D9]/20 via-[#0F0F11] to-[#CCFF00]/5 p-6 pb-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#CCFF00] to-[#6D28D9] rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[#0F0F11]" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Referral Program
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#9CA3AF]">
                    Invite friends & earn rewards
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Animated illustration */}
          <ReferralAnimation />
        </div>

        {/* Scrollable content */}
        <ScrollArea className="max-h-[calc(90vh-220px)]">
          <div className="p-6 pt-2 space-y-6">
            {/* Stats Section */}
            <ReferralStats />

            {/* Divider */}
            <div className="h-px bg-[#2A2A2E]" />

            {/* Referral Link Section */}
            <ReferralLinkBox />

            {/* Divider */}
            <div className="h-px bg-[#2A2A2E]" />

            {/* Share Buttons */}
            <ReferralShareButtons />

            {/* Divider */}
            <div className="h-px bg-[#2A2A2E]" />

            {/* Leaderboard */}
            <ReferralLeaderboard />
          </div>
        </ScrollArea>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0F0F11] to-transparent pointer-events-none" />
      </DialogContent>
    </Dialog>
  );
}
