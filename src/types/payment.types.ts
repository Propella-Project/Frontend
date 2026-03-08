// Payment and Subscription Types

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

export interface PaymentInitiatePayload {
  amount: number;
  currency?: string;
  email: string;
  phone_number?: string;
  name: string;
  plan_id?: string;
}

export interface PaymentInitiateResponse {
  payment_link: string;
  transaction_ref: string;
}

export interface PaymentVerifyResponse {
  status: "success" | "failed" | "pending";
  transaction_ref: string;
  amount: number;
  payment_date: string;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  duration_days: number;
  features: string[];
}

export interface SubscriptionPayload {
  plan_id: string;
  payment_method: "flutterwave" | "paystack";
  transaction_ref?: string;
}

export interface SubscriptionResponse {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "expired" | "cancelled";
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UserSubscriptionStatus {
  has_active_subscription: boolean;
  subscription: SubscriptionResponse | null;
  days_remaining: number;
}

// Payment Hook Return Types
export interface UsePaymentReturn {
  loading: boolean;
  error: string | null;
  initiatePayment: (plan: SubscriptionPlan, email: string, name: string, phone?: string) => Promise<boolean>;
  verifyAndSubscribe: (transactionRef: string, planId: string) => Promise<boolean>;
}

export interface UseSubscriptionReturn {
  loading: boolean;
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscriptionStatus | null;
  fetchPlans: () => Promise<void>;
  fetchSubscriptionStatus: () => Promise<void>;
  hasActiveSubscription: () => boolean;
}
