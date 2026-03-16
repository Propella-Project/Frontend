import { useState, useEffect, useCallback } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useUserStore } from "@/state/user.store";
import { useAuth } from "@/contexts/AuthContext";
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
import { CheckCircle, Lock, Loader2, Check, Sparkles, Zap, Crown, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useFlutterwave, closePaymentModal, FlutterWaveTypes } from "flutterwave-react-v3";

type FlutterwaveConfig = FlutterWaveTypes.FlutterwaveConfig;
import { getFlutterwavePublicKey, generateTransactionRef, isFlutterwaveConfigured } from "@/services/flutterwave.service";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaultFwConfig: FlutterwaveConfig = {
  public_key: "",
  tx_ref: "init",
  amount: 0,
  currency: "NGN",
  payment_options: "card,ussd,banktransfer,account",
  customer: { email: "", name: "", phone_number: "" },
  customizations: {
    title: "Propella",
    description: "Subscription payment",
    logo: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : "",
  },
  redirect_url: typeof window !== "undefined" ? `${window.location.origin}/payments/verify` : "/payments/verify",
};

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { loading, plans, selectPlan } = usePayment();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const userEmail = useUserStore((s) => s.email);
  const userNickname = useUserStore((s) => s.nickname);
  const userUsername = useUserStore((s) => s.username);
  const { user: authUser } = useAuth();
  const email = (userEmail ?? authUser?.email ?? "").trim();
  const [isProcessing, setIsProcessing] = useState(false);
  const [payConfig, setPayConfig] = useState<FlutterwaveConfig>(() => ({
    ...defaultFwConfig,
    public_key: isFlutterwaveConfigured() ? getFlutterwavePublicKey() : "",
  }));
  const [triggerPay, setTriggerPay] = useState(false);

  const handleFlutterPayment = useFlutterwave(payConfig);

  useEffect(() => {
    if (!triggerPay || payConfig.amount <= 0) return;
    handleFlutterPayment({
      callback: (response) => {
        closePaymentModal();
        if (response.status === "successful") {
          localStorage.setItem("pending_transaction_id", String(response.transaction_id));
          toast.success("Payment successful! Redirecting...");
        }
        setTriggerPay(false);
        setIsProcessing(false);
      },
      onClose: () => {
        setTriggerPay(false);
        setIsProcessing(false);
      },
    });
    setTriggerPay(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when we trigger with a valid amount
  }, [triggerPay, payConfig.amount]);

  const handleSelectPlan = useCallback(
    (plan: SubscriptionPlan) => {
      if (!isAuthenticated) {
        toast.error("Please log in to subscribe");
        localStorage.setItem("propella_pending_subscription_plan", plan.id);
        window.location.href = "/login";
        return;
      }

      const name = userNickname || userUsername || authUser?.nickname || authUser?.username || "Customer";
      if (!email) {
        return;
      }
      if (!isFlutterwaveConfigured()) {
        toast.error("Payment is not configured. Set VITE_FLUTTERWAVE_PUBLIC_KEY in .env");
        return;
      }

      selectPlan(plan);
      setIsProcessing(true);

      const txRef = generateTransactionRef();
      localStorage.setItem("pending_transaction_id", txRef);
      localStorage.setItem("pending_plan_id", plan.id);

      setPayConfig({
        ...defaultFwConfig,
        public_key: getFlutterwavePublicKey(),
        tx_ref: txRef,
        amount: plan.amount,
        currency: (plan.currency as "NGN") ?? "NGN",
        customer: {
          email: email || "",
          name,
          phone_number: "",
        },
        customizations: {
          title: "Propella",
          description: "Subscription payment",
          logo: `${window.location.origin}/favicon.ico`,
        },
        redirect_url: `${window.location.origin}/payments/verify`,
        meta: { plan_id: plan.id },
      });
      setTriggerPay(true);
    },
    [isAuthenticated, email, userNickname, userUsername, authUser, selectPlan]
  );

  const handleClose = () => {
    if (!loading && !isProcessing) onClose();
  };

  const safePlans = Array.isArray(plans) ? plans : [];

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("year") || name.includes("annual")) return <Crown className="w-6 h-6 text-[#CCFF00]" />;
    if (name.includes("quarter")) return <Sparkles className="w-6 h-6 text-[#F59E0B]" />;
    return <Zap className="w-6 h-6 text-[#3B82F6]" />;
  };

  /** Display description; fallback if API sent placeholder text */
  const getPlanDescription = (plan: SubscriptionPlan) => {
    const d = (plan.description || "").trim();
    if (d && !/lorem\s+ipsum/i.test(d)) return d;
    const name = (plan.name || "").toLowerCase();
    if (name.includes("smart") || name.includes("monthly")) return "Full access to your personalized study roadmap, AI tutor, and analytics for 30 days.";
    if (name.includes("quarter")) return "Three months of full access with the best per-day value.";
    if (name.includes("year") || name.includes("annual")) return "Full access for 12 months with maximum savings.";
    return "Full access to your personalized roadmap, AI tutor, and performance analytics.";
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

        {!email && isAuthenticated && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200">
              Please add your email in Profile settings to subscribe. We need it to send your receipt and subscription details.
            </p>
          </div>
        )}

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
                  className="relative overflow-hidden border-[#2A2A2E] bg-[#0F0F11] hover:border-[#CCFF00] transition-all"
                >
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
                        <p className="text-sm text-[#9CA3AF] mb-3">{getPlanDescription(plan)}</p>
                        <ul className="space-y-1.5">
                          {(plan.features || []).slice(0, 4).map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                              <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isProcessing || (!email && isAuthenticated)}
                          className="w-full mt-4 bg-[#6D28D9] hover:bg-[#5B21B6] text-white disabled:opacity-70"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Opening...
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
          Secure payment by Flutterwave. You&apos;ll be redirected after payment to confirm your subscription.
        </p>
      </DialogContent>
    </Dialog>
  );
}
