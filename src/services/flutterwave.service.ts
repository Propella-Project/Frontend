/**
 * Helpers for Flutterwave payment (flutterwave-react-v3).
 * Public key comes from VITE_FLUTTERWAVE_PUBLIC_KEY in env.
 */
import { ENV } from "@/config/env";

export function getFlutterwavePublicKey(): string {
  const key = ENV.FLUTTERWAVE_PUBLIC_KEY;
  if (!key) {
    throw new Error(
      "Flutterwave public key is missing. Set VITE_FLUTTERWAVE_PUBLIC_KEY in your .env file."
    );
  }
  return key;
}

export function generateTransactionRef(): string {
  return `PROP_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export function isFlutterwaveConfigured(): boolean {
  return Boolean(ENV.FLUTTERWAVE_PUBLIC_KEY);
}
