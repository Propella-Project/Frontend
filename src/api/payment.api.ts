import apiClient from "./client";
import type {
  PaymentInitiatePayload,
  PaymentInitiateResponse,
  PaymentVerifyResponse,
} from "@/types/api.types";

// Flutterwave keys are not in client env - use getFlutterwavePublicKey() from flutterwave.service
// (fetches from backend at runtime). This fallback is only for legacy callers.
const FLUTTERWAVE_PUBLIC_KEY = "";

export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number?: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  callback: (response: FlutterwaveResponse) => void;
  onclose: () => void;
}

export interface FlutterwaveResponse {
  status: "successful" | "cancelled" | "failed";
  transaction_id: number;
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  flw_ref: string;
}

// Load Flutterwave script
export const loadFlutterwaveScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.FlutterwaveCheckout) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Open Flutterwave payment modal
export const openFlutterwavePayment = (
  config: Omit<FlutterwaveConfig, "public_key">
): void => {
  if (!window.FlutterwaveCheckout) {
    throw new Error("Flutterwave script not loaded");
  }

  window.FlutterwaveCheckout.open({
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    ...config,
  });
};

// Generate transaction reference
export const generateTransactionRef = (): string => {
  return `PROP_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const paymentApi = {
  // Legacy - for backend payment initiation (if available)
  initiatePayment: async (
    payload: PaymentInitiatePayload
  ): Promise<PaymentInitiateResponse> => {
    const response = await apiClient.post("/payments/initiate/", payload);
    return response.data;
  },

  // Legacy - for backend payment verification (if available)
  verifyPayment: async (transactionRef: string): Promise<PaymentVerifyResponse> => {
    const response = await apiClient.post("/payments/verify/", {
      transaction_ref: transactionRef,
    });
    return response.data;
  },

  // Flutterwave integration
  loadFlutterwaveScript,
  openFlutterwavePayment,
  generateTransactionRef,
};

export default paymentApi;

// Extend Window interface for Flutterwave
declare global {
  interface Window {
    FlutterwaveCheckout: {
      open: (config: FlutterwaveConfig) => void;
    };
  }
}
