import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  applySubscriptionPaymentSuccess,
  getConfiguredSubscriptionMonthlyPrice,
} from "../_shared/subscription.ts";

type WebhookBody = {
  utilityref?: string;
  reference?: string;
  transactionstatus?: string;
  amount?: number | string;
  message?: string;
};

function response(data: string, status = 200) {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return response("Method not allowed", 405);
    }

    const secret = new URL(req.url).searchParams.get("secret");
    const expectedSecret = Deno.env.get("AZAMPAY_CALLBACK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const amountConfigured = getConfiguredSubscriptionMonthlyPrice();

    if (!expectedSecret || secret !== expectedSecret) {
      return response("Unauthorized", 401);
    }

    if (!supabaseUrl || !supabaseServiceRole) {
      return response("Server misconfigured", 500);
    }

    const body = (await req.json()) as WebhookBody;
    const externalId = String(body.utilityref || "").trim();
    const providerReference = String(body.reference || "").trim();
    const transactionStatus = String(body.transactionstatus || "").trim().toLowerCase();
    const message = String(body.message || "").trim();
    const amount = Number(body.amount ?? 0);

    if (!externalId || !providerReference || !transactionStatus || !amount) {
      return response("Missing required fields", 400);
    }

    if (!["success", "failed"].includes(transactionStatus)) {
      return response("Invalid transaction status", 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    const { data: payment, error: paymentError } = await adminClient
      .from("subscription_payments")
      .select("*")
      .eq("external_id", externalId)
      .maybeSingle();

    if (paymentError || !payment) {
      return response("Payment not found", 404);
    }

    if (payment.status === "success") {
      return response("Already processed", 200);
    }

    if (transactionStatus === "failed") {
      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          provider_reference: providerReference,
          transaction_reference: providerReference,
          message: message || "Payment was not completed",
          callback_payload: body,
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      await adminClient.from("notifications").insert({
        shop_id: payment.shop_id,
        title: "Subscription payment failed",
        message: message || "We could not confirm the subscription payment. Please try again.",
        type: "subscription-payment-failed",
      });

      return response("Payment marked as failed", 200);
    }

    if (amountConfigured > 0 && amount < amountConfigured) {
      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          provider_reference: providerReference,
          transaction_reference: providerReference,
          message: "Paid amount is lower than the required monthly subscription amount",
          callback_payload: body,
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      return response("Amount too low", 400);
    }

    await applySubscriptionPaymentSuccess({
      adminClient,
      payment,
      amountConfigured,
      callbackPayload: body,
      message: message || "Subscription payment confirmed",
      providerReference,
      utilityReference: externalId,
    });

    return response("Payment applied", 200);
  } catch (error) {
    return response((error as Error).message || "Unexpected error", 500);
  }
});
