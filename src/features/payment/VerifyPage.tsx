/**
 * Payment verification page at /verify
 *
 * Flutterwave redirects here after payment with query params:
 * - transaction_id: Flutterwave transaction ID
 * - tx_ref: Your transaction reference
 * - status: "successful" | "cancelled" | (absent on failure)
 *
 * We always verify with the backend before showing success; the redirect params
 * only tell us which transaction to verify.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePayment } from "@/hooks/usePayment";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";

type VerifyStatus = "verifying" | "success" | "error";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function VerifyPage() {
  const navigate = useNavigate();
  const { verifySubscription } = usePayment();
  const { setCurrentPage } = useStore();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionId = urlParams.get("transaction_id");
      const txRef = urlParams.get("tx_ref");
      const statusParam = urlParams.get("status");

      if (statusParam === "cancelled") {
        setStatus("error");
        setMessage("Payment was cancelled.");
        setDetail("You can try again when you're ready to complete your subscription.");
        toast.error("Payment cancelled");
        return;
      }

      const pendingId = localStorage.getItem("pending_transaction_id");
      const idToVerify = transactionId || txRef || pendingId;

      if (!idToVerify) {
        setStatus("error");
        setMessage("No transaction reference found.");
        setDetail("If you just completed a payment, please contact support with your receipt.");
        toast.error("Payment verification failed");
        return;
      }

      try {
        const success = await verifySubscription(idToVerify);

        if (success) {
          setStatus("success");
          setMessage("Payment successful! Your subscription is now active.");
          setDetail("You have full access to your personalized study roadmap.");
          toast.success("Payment verified! Roadmap unlocked!");
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setStatus("error");
          setMessage("Payment verification failed.");
          setDetail("Please contact support if you were charged.");
          toast.error("Payment verification failed");
        }
      } catch (error) {
        console.error("[Verify] Verification error:", error);
        setStatus("error");
        setMessage("Something went wrong while verifying your payment.");
        setDetail("Please try again or contact support.");
        toast.error("Verification error");
      }
    };

    verifyPayment();
  }, [verifySubscription]);

  const goToDashboard = () => {
    setCurrentPage("dashboard");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#fff 1px, transparent 1px),
            linear-gradient(90deg, #fff 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        className="w-full max-w-[420px] relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <AnimatePresence mode="wait">
          {status === "verifying" && (
            <motion.div
              key="verifying"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <Card className="bg-[#141418] border-[#25252A] shadow-xl shadow-black/20 overflow-hidden">
                <CardHeader className="pb-2">
                  <motion.div
                    variants={item}
                    className="w-20 h-20 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mx-auto"
                  >
                    <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" />
                  </motion.div>
                  <motion.h1
                    variants={item}
                    className="text-xl font-semibold text-center text-white mt-4"
                  >
                    Verifying payment
                  </motion.h1>
                  <motion.p
                    variants={item}
                    className="text-center text-[#9CA3AF] text-sm"
                  >
                    {message}
                  </motion.p>
                </CardHeader>
                <CardContent className="pt-0">
                  <motion.div
                    variants={item}
                    className="flex gap-2 justify-center"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00]/60 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00]/40 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00]/20 animate-pulse [animation-delay:0.4s]" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-6"
            >
              <Card className="bg-[#141418] border-[#1F2E1A] shadow-xl shadow-black/20 overflow-hidden">
                <CardHeader className="pb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-1.5 mt-4"
                  >
                    <Sparkles className="w-4 h-4 text-[#CCFF00]" />
                    <span className="text-sm font-medium text-[#CCFF00] uppercase tracking-wider">
                      Success
                    </span>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-xl font-semibold text-center text-white"
                  >
                    Payment successful
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-[#9CA3AF] text-sm"
                  >
                    {message}
                  </motion.p>
                  {detail && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="text-center text-[#6B7280] text-xs"
                    >
                      {detail}
                    </motion.p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="rounded-xl bg-[#CCFF00]/5 border border-[#CCFF00]/20 p-4">
                    <p className="text-[#CCFF00] text-sm font-medium text-center">
                      Full access unlocked
                    </p>
                    <p className="text-[#9CA3AF] text-xs text-center mt-1">
                      Your personalized study roadmap is ready
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button
                    onClick={goToDashboard}
                    className="w-full h-11 bg-[#CCFF00] text-[#0A0A0C] hover:bg-[#B3E600] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <Card className="bg-[#141418] border-[#2A1A1A] shadow-xl shadow-black/20 overflow-hidden">
                <CardHeader className="pb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto"
                  >
                    <XCircle className="w-10 h-10 text-[#EF4444]" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm font-medium text-[#F87171] uppercase tracking-wider text-center block mt-4"
                  >
                    Payment issue
                  </motion.span>
                  <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl font-semibold text-center text-white"
                  >
                    Payment failed
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-[#9CA3AF] text-sm"
                  >
                    {message}
                  </motion.p>
                  {detail && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="text-center text-[#6B7280] text-xs"
                    >
                      {detail}
                    </motion.p>
                  )}
                </CardHeader>
                <CardFooter className="pt-6">
                  <Button
                    onClick={goToDashboard}
                    variant="outline"
                    className="w-full h-11 border-[#2A2A2E] bg-transparent hover:bg-[#1F1F23] text-white font-medium rounded-xl"
                  >
                    Back to Dashboard
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="mt-6 text-[#4B5563] text-xs text-center max-w-sm">
        Secure payment powered by Flutterwave. If you need help, contact support.
      </p>
    </div>
  );
}
