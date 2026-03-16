/**
 * Flutterwave callback at /payments/verify
 * Reads reference from query, POSTs to /api/accounts/verify-subscription/ with { reference }.
 * Success: { message: "Subscription activated" } → redirect to dashboard.
 * Error: { error: "Payment verification failed" } → show error.
 * Verification status is not stored locally; access is determined by calling the subscription-status API.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "@/api/client";
import { ENDPOINTS } from "@/config/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";

type VerifyStatus = "verifying" | "success" | "error";

export function PaymentsVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCurrentPage } = useStore();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference =
        searchParams.get("reference") ||
        searchParams.get("tx_ref") ||
        searchParams.get("transaction_id");

      if (!reference) {
        setStatus("error");
        setMessage("No payment reference found.");
        setDetail("If you just completed a payment, please contact support with your receipt.");
        toast.error("Payment verification failed");
        return;
      }

      try {
        const { data } = await apiClient.post<{ message?: string; error?: string }>(
          ENDPOINTS.subscriptions.verify,
          { reference }
        );

        if (data?.message === "Subscription activated") {
          setStatus("success");
          setMessage("Payment successful! Your subscription is now active.");
          setDetail("You have full access to Roadmap, Practice, and Tutor.");
          toast.success("Subscription activated");
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          const errMsg = data?.error ?? "Payment verification failed.";
          setStatus("error");
          setMessage(errMsg);
          setDetail("Please contact support if you were charged.");
          toast.error(errMsg);
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        const errMsg =
          axiosError?.response?.data?.error ?? "Payment verification failed.";
        setStatus("error");
        setMessage(errMsg);
        setDetail("Please try again or contact support.");
        toast.error(errMsg);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const goToDashboard = () => {
    setCurrentPage("dashboard");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col items-center justify-center p-4 sm:p-6">
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
            <Card className="bg-[#141418] border-[#25252A] shadow-xl">
              <CardHeader className="pb-2">
                <div className="w-20 h-20 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mx-auto">
                  <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" />
                </div>
                <h1 className="text-xl font-semibold text-center text-white mt-4">
                  Verifying payment
                </h1>
                <p className="text-center text-[#9CA3AF] text-sm">{message}</p>
              </CardHeader>
            </Card>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="bg-[#141418] border-[#1F2E1A] shadow-xl">
                <CardHeader className="pb-2">
                  <div className="w-20 h-20 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
                  </div>
                  <h1 className="text-xl font-semibold text-center text-white mt-4">
                    Subscription activated
                  </h1>
                  <p className="text-center text-[#9CA3AF] text-sm">{message}</p>
                  {detail && (
                    <p className="text-center text-[#6B7280] text-xs">{detail}</p>
                  )}
                </CardHeader>
                <CardFooter className="pt-6">
                  <Button
                    onClick={goToDashboard}
                    className="w-full h-11 bg-[#CCFF00] text-[#0A0A0C] hover:bg-[#B3E600] font-semibold rounded-xl flex items-center justify-center gap-2"
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="bg-[#141418] border-[#2A1A1A] shadow-xl">
                <CardHeader className="pb-2">
                  <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10 text-[#EF4444]" />
                  </div>
                  <span className="text-sm font-medium text-[#F87171] uppercase tracking-wider text-center block mt-4">
                    Payment issue
                  </span>
                  <h1 className="text-xl font-semibold text-center text-white mt-2">
                    {message}
                  </h1>
                  {detail && (
                    <p className="text-center text-[#6B7280] text-xs">{detail}</p>
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
