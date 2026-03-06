import { useState } from "react";
import { usePayment } from "@/hooks/usePayment";
import { useUserStore } from "@/state/user.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle, Lock, CreditCard, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PAYMENT_AMOUNT } from "@/utils/constants";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { initiatePayment, verifyPayment, loading } = usePayment();
  const { nickname } = useUserStore();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "processing" | "verify">("form");

  const handleInitiatePayment = async () => {
    if (!email) return;
    
    const ref = await initiatePayment(email, nickname || "Student", phone || undefined);
    
    if (ref) {
      setTransactionRef(ref);
      setStep("processing");
      
      // Wait a bit for user to complete payment
      setTimeout(() => {
        setStep("verify");
      }, 5000);
    }
  };

  const handleVerify = async () => {
    if (!transactionRef) return;
    
    const success = await verifyPayment(transactionRef);
    
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const benefits = [
    "Personalized AI-generated roadmap",
    "Unlimited AI tutor chat sessions",
    "Detailed performance analytics",
    "Weak topics identification",
    "Daily streak tracking",
    "Practice quizzes and past questions",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1A1E] border-[#2A2A2E] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#CCFF00]" />
            Unlock Full Access
          </DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            Complete payment to access your personalized study roadmap
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Price Card */}
            <Card className="bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] border-none p-6 text-center">
              <p className="text-white/80 text-sm mb-2">One-time payment</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold">₦</span>
                <span className="text-5xl font-bold">
                  {PAYMENT_AMOUNT.toLocaleString()}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-2">
                Full access until JAMB exam
              </p>
            </Card>

            {/* Benefits */}
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#CCFF00] flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-[#0F0F11] border-[#2A2A2E]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="bg-[#0F0F11] border-[#2A2A2E]"
                />
              </div>
            </div>

            <Button
              onClick={handleInitiatePayment}
              disabled={!email || loading}
              className="w-full bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Flutterwave
                </>
              )}
            </Button>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="w-20 h-20 border-4 border-[#2A2A2E] border-t-[#CCFF00] rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">Processing Payment...</h3>
            <p className="text-[#9CA3AF]">
              Please complete the payment in the Flutterwave window
            </p>
          </motion.div>
        )}

        {step === "verify" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <h3 className="text-xl font-bold mb-4">Verify Payment</h3>
            <p className="text-[#9CA3AF] mb-6">
              Click below to verify your payment status
            </p>
            <Button
              onClick={handleVerify}
              disabled={loading}
              className="bg-[#6D28D9] hover:bg-[#5B21B6]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Payment"
              )}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
