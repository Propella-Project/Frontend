import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type {
  PaymentInitiatePayload,
  PaymentInitiateResponse,
  PaymentVerifyResponse,
} from "@/types/api.types";

export const paymentApi = {
  // Initiate payment (Flutterwave)
  initiatePayment: async (
    payload: PaymentInitiatePayload
  ): Promise<PaymentInitiateResponse> => {
    const response = await apiClient.post(ENDPOINTS.payments.initiate, payload);
    return response.data;
  },

  // Verify payment
  verifyPayment: async (transactionRef: string): Promise<PaymentVerifyResponse> => {
    const response = await apiClient.post(ENDPOINTS.payments.verify, {
      transaction_ref: transactionRef,
    });
    return response.data;
  },
};
