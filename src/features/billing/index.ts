/**
 * Billing / subscription feature
 * - UI page: src/pages/Billing.tsx
 * - Mobile money initiation: SubscriptionContext → Edge Function (provider id server-side)
 * - Shared payment overlays: @/features/payments
 */
export { PaymentWaiting, PaymentSuccess, PaymentFailed } from "@/features/payments";
