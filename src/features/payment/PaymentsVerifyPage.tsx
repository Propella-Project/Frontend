/**
 * Flutterwave callback at /payments/verify
 * Reads tx_ref from query; POSTs to {VITE_API_BASE_URL}/accounts/verify-subscription/ with { tx_ref }.
 * Plain DOM + Tailwind only (no framer-motion) so production never shows a blank shell.
 */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient, { getToken } from "@/api/client";
import { ENDPOINTS } from "@/config/endpoints";
import { ENV } from "@/config/env";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store";

type VerifyStatus = "verifying" | "success" | "error";

/** Flutterwave may send different casing or omit status; backend verify is source of truth. */
function isExplicitPaymentFailure(raw: string | null): boolean {
  if (!raw || !raw.trim()) return false;
  const s = raw.trim().toLowerCase();
  return ["failed", "cancelled", "canceled", "abandoned", "timeout"].includes(s);
}

export function PaymentsVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCurrentPage } = useStore();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [message, setMessage] = useState("Verifying your payment…");
  const [detail, setDetail] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const verifyPayment = async () => {
      const statusParam = searchParams.get("status");
      const transaction_id = searchParams.get("transaction_id");

      // Only block on explicit failure/cancel — do not require status === "successful"
      // (Flutterwave may use different casing or omit status; charge success is confirmed by backend.)
      if (isExplicitPaymentFailure(statusParam)) {
        setStatus("error");
        setMessage("Payment was not completed.");
        setDetail("If you were charged, please contact support with your tx_ref.");
        toast.error("Payment not completed");
        return;
      }

      if (!transaction_id || !transaction_id.trim()) {
        setStatus("error");
        setMessage("No transaction ID found.");
        setDetail("If you just completed a payment, please contact support with your receipt.");
        toast.error("Payment verification failed");
        return;
      }

      const token = getToken();
      if (!token) {
        setStatus("error");
        setMessage("Session expired or not logged in.");
        setDetail("Log in again, then open this page from your payment receipt link or contact support with your tx_ref.");
        toast.error("Please log in to verify payment");
        return;
      }

      try {
        const verifyUrl = `${ENV.API_BASE_URL}${ENDPOINTS.subscriptions.verify}`;
        const { data } = await apiClient.post<{ message?: string; error?: string }>(
          verifyUrl,
          { transaction_id: transaction_id },
        { headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}` } }
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

    void verifyPayment();
  }, [searchParams]);

  const goToDashboard = () => {
    try {
      setCurrentPage("dashboard");
    } catch {
      /* store may be unavailable in edge cases; still navigate */
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ minHeight: "100dvh" }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#fff 1px, transparent 1px),
            linear-gradient(90deg, #fff 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />

      <div className="w-full max-w-[420px] relative z-10 opacity-100">
        {status === "verifying" && (
          <Card className="bg-[#141418] border-[#25252A] shadow-xl">
            <CardHeader className="pb-2 pt-8">
              <div className="w-20 h-20 rounded-2xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" aria-hidden />
              </div>
              <h1 className="text-xl font-semibold text-center text-white mt-4">
                Verifying your payment
              </h1>
              <p className="text-center text-[#9CA3AF] text-sm mt-1">
                Please wait while we confirm your subscription…
              </p>
            </CardHeader>
          </Card>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="bg-[#141418] border-[#1F2E1A] shadow-xl">
              <CardHeader className="pb-2">
                <div className="w-20 h-20 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-[#22C55E]" aria-hidden />
                </div>
                <h1 className="text-xl font-semibold text-center text-white mt-4">
                  Subscription activated
                </h1>
                <p className="text-center text-[#9CA3AF] text-sm">{message}</p>
                {detail && <p className="text-center text-[#6B7280] text-xs">{detail}</p>}
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
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="bg-[#141418] border-[#2A1A1A] shadow-xl">
              <CardHeader className="pb-2">
                <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-[#EF4444]" aria-hidden />
                </div>
                <span className="text-sm font-medium text-[#F87171] uppercase tracking-wider text-center block mt-4">
                  Payment issue
                </span>
                <h1 className="text-xl font-semibold text-center text-white mt-2">{message}</h1>
                {detail && <p className="text-center text-[#6B7280] text-xs">{detail}</p>}
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
          </div>
        )}
      </div>

      <p className="mt-6 text-[#4B5563] text-xs text-center max-w-sm">
        Secure payment powered by Flutterwave. If you need help, contact support.
      </p>
    </div>
  );
}
