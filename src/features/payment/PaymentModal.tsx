import { useState } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useUserStore } from "@/state/user.store";
import type { SubscriptionPlan } from "@/api/subscription.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Lock, Loader2, Check, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { 
    loading, 
    plans, 
    selectedPlan, 
    selectPlan, 
    initiatePayment 
  } = usePayment();
  const { isAuthenticated } = useUserStore();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error("Please log in to subscribe");
      // Store the current intent so we can return after login
      localStorage.setItem("propella_pending_subscription_plan", plan.id);
      // Redirect to login
      window.location.href = "/login";
      return;
    }
    
    selectPlan(plan);
    setIsProcessing(true);
    
    // Initiate payment with plan - backend handles Flutterwave redirect with email/username
    const response = await initiatePayment(plan);
    
    if (response?.payment_link) {
      // Redirect to Flutterwave payment page
      window.location.href = response.payment_link;
    } else {
      setIsProcessing(false);
      toast.error("Failed to initiate payment. Please try again.");
    }
  };

  const handleClose = () => {
    if (!loading && !isProcessing) {
      onClose();
    }
  };

  // Ensure plans is always an array
  const safePlans = Array.isArray(plans) ? plans : [];
  
  // Get icon based on plan
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('year') || name.includes('annual')) return <Crown className="w-6 h-6 text-[#CCFF00]" />;
    if (name.includes('quarter')) return <Sparkles className="w-6 h-6 text-[#F59E0B]" />;
    return <Zap className="w-6 h-6 text-[#3B82F6]" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1A1E] border-[#2A2A2E] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#CCFF00]" />
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            Select a plan to unlock your personalized study roadmap
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {safePlans.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#CCFF00]" />
              <p className="text-[#9CA3AF]">Loading plans...</p>
            </div>
          ) : (
            safePlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative overflow-hidden cursor-pointer transition-all hover:border-[#CCFF00] ${
                    selectedPlan?.id === plan.id
                      ? "border-[#CCFF00] ring-1 ring-[#CCFF00]"
                      : "border-[#2A2A2E]"
                  } bg-[#0F0F11]`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {/* Popular badge for non-monthly plans */}
                  {plan.duration_days > 30 && (
                    <div className="absolute top-0 right-0 bg-[#CCFF00] text-[#0F0F11] text-xs font-bold px-3 py-1 rounded-bl-lg">
                      BEST VALUE
                    </div>
                  )}
                  
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#2A2A2E] rounded-xl flex items-center justify-center flex-shrink-0">
                        {getPlanIcon(plan.name)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#CCFF00]">
                              ₦{plan.amount?.toLocaleString() || 1499}
                            </span>
                            <span className="text-xs text-[#9CA3AF] block">
                              /{plan.duration_days || 30} days
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-[#9CA3AF] mb-3">{plan.description}</p>
                        
                        {/* Features */}
                        <ul className="space-y-1.5">
                          {(plan.features || []).slice(0, 4).map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                              <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        {/* Subscribe button */}
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isProcessing}
                          className="w-full mt-4 bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
                        >
                          {isProcessing && selectedPlan?.id === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Redirecting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Subscribe Now
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] text-center mt-4">
          You&apos;ll be redirected to Flutterwave&apos;s secure payment page to complete your subscription
        </p>
      </DialogContent>
    </Dialog>
  );
}
