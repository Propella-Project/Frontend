import { useEffect, useState } from "react";
import { usePayment } from "@/hooks/usePayment";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentCallbackProps {
  onComplete: () => void;
}

export function PaymentCallback({ onComplete }: PaymentCallbackProps) {
  const { verifySubscription } = usePayment();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      // Get transaction_id from URL
      const urlParams = new URLSearchParams(window.location.search);
      const transactionId = urlParams.get("transaction_id");
      const txRef = urlParams.get("tx_ref");
      const statusParam = urlParams.get("status");

      console.log("[Payment Callback] URL params:", {
        transaction_id: transactionId,
        tx_ref: txRef,
        status: statusParam,
        fullUrl: window.location.href,
      });

      // If cancelled
      if (statusParam === "cancelled") {
        setStatus("error");
        setMessage("Payment was cancelled. Please try again.");
        toast.error("Payment cancelled");
        return;
      }

      // Get stored transaction ID as fallback
      const pendingId = localStorage.getItem("pending_transaction_id");
      const idToVerify = transactionId || txRef || pendingId;

      if (!idToVerify) {
        setStatus("error");
        setMessage("No transaction reference found.");
        toast.error("Payment verification failed");
        return;
      }

      try {
        const success = await verifySubscription(idToVerify);
        
        if (success) {
          setStatus("success");
          setMessage("Payment successful! Your subscription is now active. You now have full access to your personalized study roadmap.");
          toast.success("Payment verified! Roadmap unlocked!");
          
          // Set flag for dashboard to immediately recognize payment
          localStorage.setItem("propella_payment_verified", "true");
          
          // Clear URL params
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setStatus("error");
          setMessage("Payment verification failed. Please contact support.");
          toast.error("Payment verification failed");
        }
      } catch (error) {
        console.error("[Payment Callback] Verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your payment.");
        toast.error("Verification error");
      }
    };

    verifyPayment();
  }, [verifySubscription]);

  return (
    <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-[#6D28D9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin" />
              </div>
              <h2 className="text-xl font-bold mb-2">Verifying Payment</h2>
              <p className="text-[#9CA3AF]">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#10B981]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Payment Successful! 🎉</h2>
              <p className="text-[#9CA3AF] mb-2">{message}</p>
              <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-lg p-3 mb-6">
                <p className="text-[#CCFF00] text-sm font-medium">✅ Full access unlocked</p>
                <p className="text-[#9CA3AF] text-xs mt-1">Your personalized study roadmap is ready</p>
              </div>
              <Button
                onClick={onComplete}
                className="w-full bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-[#EF4444]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-[#EF4444]" />
              </div>
              <h2 className="text-xl font-bold mb-2">Payment Failed</h2>
              <p className="text-[#9CA3AF] mb-6">{message}</p>
              <Button
                onClick={onComplete}
                variant="outline"
                className="w-full border-[#2A2A2E] hover:bg-[#2A2A2E]"
              >
                Back to Dashboard
              </Button>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
