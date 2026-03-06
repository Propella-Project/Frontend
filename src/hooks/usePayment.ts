import { useState, useCallback } from "react";
import { paymentApi } from "@/api/payment.api";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import type {
  PaymentInitiatePayload,
  ApiError,
  PaymentVerifyResponse,
} from "@/types/api.types";
import { toast } from "sonner";
import { PAYMENT_AMOUNT } from "@/utils/constants";

interface UsePaymentReturn {
  loading: boolean;
  error: ApiError | null;
  initiatePayment: (email: string, name: string, phone?: string) => Promise<string | null>;
  verifyPayment: (transactionRef: string) => Promise<boolean>;
}

/**
 * Hook to manage payments via Flutterwave
 */
export function usePayment(): UsePaymentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { setUser } = useUserStore();
  const { setPaymentStatus } = useAppStore();

  const initiatePayment = useCallback(
    async (
      email: string,
      name: string,
      phone?: string
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);

      try {
        const payload: PaymentInitiatePayload = {
          amount: PAYMENT_AMOUNT,
          currency: "NGN",
          email,
          name,
          phone_number: phone,
        };

        const response = await paymentApi.initiatePayment(payload);
        
        // Open payment link in new window or redirect
        window.open(response.payment_link, "_blank");
        
        return response.transaction_ref;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to initiate payment",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to initiate payment");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyPayment = useCallback(
    async (transactionRef: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response: PaymentVerifyResponse = await paymentApi.verifyPayment(
          transactionRef
        );

        if (response.status === "success") {
          setPaymentStatus("paid");
          setUser({ payment_status: "paid" });
          toast.success("Payment successful! Welcome to PROPELLA!");
          return true;
        } else {
          setPaymentStatus("failed");
          toast.error("Payment verification failed");
          return false;
        }
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to verify payment",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to verify payment");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setPaymentStatus, setUser]
  );

  return {
    loading,
    error,
    initiatePayment,
    verifyPayment,
  };
}

/**
 * Hook to check if user has paid
 */
export function usePaymentStatus() {
  const { payment_status } = useUserStore();
  const { paymentStatus } = useAppStore();

  // Use the most restrictive status
  const effectiveStatus =
    payment_status === "paid" && paymentStatus === "paid" ? "paid" : "pending";

  return {
    isPaid: effectiveStatus === "paid",
    status: effectiveStatus,
  };
}
