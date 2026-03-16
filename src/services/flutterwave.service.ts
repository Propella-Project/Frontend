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

const FW_ZINDEX_STYLE_ID = "propella-fw-checkout-zindex";

/**
 * Ensure Flutterwave checkout iframe is on top and clickable.
 * Call before opening payment; remove when modal closes (onClose/callback).
 */
export function ensureFlutterwaveOnTop(): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById(FW_ZINDEX_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = FW_ZINDEX_STYLE_ID;
    el.textContent = `iframe[name="checkout"]{z-index:2147483647!important;pointer-events:auto!important;}`;
    document.head.appendChild(el);
  }
}

export function removeFlutterwaveZIndexFix(): void {
  if (typeof document === "undefined") return;
  document.getElementById(FW_ZINDEX_STYLE_ID)?.remove();
}
