/**
 * harakapay-webhook
 *
 * Public endpoint called by HarakaPay (no signature on their documented webhook).
 * CRITICAL: Do NOT trust the incoming payload status.
 * Always re-verify via GET /api/v1/status/{order_id} using the API key.
 *
 * Always return HTTP 200 to HarakaPay so they record delivery.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  applySubscriptionPaymentSuccess,
  getConfiguredSubscriptionMonthlyPrice,
} from "../_shared/subscription.ts";

function ok(msg = "ok") {
  return new Response(msg, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

serve(async (req) => {
  try {
    // Always 200 for non-POST so HarakaPay doesn't retry on health checks
    if (req.method !== "POST") {
      return ok("method ok");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const harakaApiKey = Deno.env.get("HARAKAPAY_API_KEY");
    const harakaBaseUrl =
      Deno.env.get("HARAKAPAY_BASE_URL")?.replace(/\/$/, "") ||
      "https://api.harakapay.net";
    const amountConfigured = getConfiguredSubscriptionMonthlyPrice();

    if (!supabaseUrl || !supabaseServiceRole || !harakaApiKey) {
      console.error("harakapay-webhook misconfigured");
      return ok("misconfigured"); // still 200
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Extract order_id from common field names
    const orderId = String(
      body.order_id ??
        body.orderId ??
        body.id ??
        body.reference ??
        body.transaction_reference ??
        body.merchant_reference ??
        "",
    ).trim();

    if (!orderId) {
      console.error("harakapay-webhook: missing order_id", body);
      return ok("missing order_id");
    }

    // ── Independent status verification (do not trust webhook body) ──
    let verifiedStatus = "unknown";
    let verifiedPayload: Record<string, unknown> = {};
    let feeAmount: number | null = null;
    let netAmount: number | null = null;
    let providerReference = orderId;

    try {
      const statusRes = await fetch(
        `${harakaBaseUrl}/api/v1/status/${encodeURIComponent(orderId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": harakaApiKey,
          },
        },
      );
      const statusText = await statusRes.text();
      try {
        verifiedPayload = JSON.parse(statusText) as Record<string, unknown>;
      } catch {
        verifiedPayload = { raw: statusText };
      }

      if (statusRes.ok) {
        const rawStatus = String(
          verifiedPayload.status ??
            verifiedPayload.transaction_status ??
            verifiedPayload.state ??
            "",
        )
          .trim()
          .toLowerCase();

        if (
          ["completed", "complete", "success", "successful", "paid"].includes(
            rawStatus,
          )
        ) {
          verifiedStatus = "completed";
        } else if (
          ["failed", "failure", "cancelled", "canceled", "expired", "rejected"].includes(
            rawStatus,
          )
        ) {
          verifiedStatus = "failed";
        } else {
          verifiedStatus = rawStatus || "pending";
        }

        feeAmount = Number(
          verifiedPayload.fee_amount ??
            verifiedPayload.fee ??
            verifiedPayload.transaction_fee ??
            NaN,
        );
        netAmount = Number(
          verifiedPayload.net_amount ??
            verifiedPayload.netAmount ??
            verifiedPayload.amount_received ??
            NaN,
        );
        providerReference = String(
          verifiedPayload.provider_reference ??
            verifiedPayload.transaction_reference ??
            verifiedPayload.reference ??
            orderId,
        );
      } else {
        console.error(
          "harakapay status check failed",
          statusRes.status,
          statusText,
        );
        // Fall back to webhook body only for logging; do not activate
        verifiedStatus = "unverified";
      }
    } catch (statusErr) {
      console.error("harakapay status check error:", statusErr);
      verifiedStatus = "unverified";
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    // Find payment by order_id / external_id / transaction_reference / id
    let payment: Record<string, unknown> | null = null;

    const lookups = [
      { column: "external_id", value: orderId },
      { column: "transaction_reference", value: orderId },
      { column: "provider_reference", value: orderId },
      { column: "id", value: orderId },
    ];

    for (const { column, value } of lookups) {
      const { data } = await adminClient
        .from("subscription_payments")
        .select("*")
        .eq(column, value)
        .eq("provider", "harakapay")
        .maybeSingle();
      if (data) {
        payment = data as Record<string, unknown>;
        break;
      }
    }

    // Also try merchant_reference if present in webhook
    if (!payment && body.merchant_reference) {
      const { data } = await adminClient
        .from("subscription_payments")
        .select("*")
        .eq("id", String(body.merchant_reference))
        .eq("provider", "harakapay")
        .maybeSingle();
      if (data) payment = data as Record<string, unknown>;
    }

    if (!payment) {
      console.error("harakapay-webhook: payment not found for", orderId);
      return ok("payment not found");
    }

    if (payment.status === "success") {
      return ok("already processed");
    }

    // Store fee/net when available
    const feeUpdate: Record<string, unknown> = {
      callback_payload: { webhook: body, verified: verifiedPayload },
    };
    if (Number.isFinite(feeAmount) && (feeAmount as number) > 0) {
      feeUpdate.fee_amount = feeAmount;
    }
    if (Number.isFinite(netAmount) && (netAmount as number) > 0) {
      feeUpdate.net_amount = netAmount;
    }

    if (verifiedStatus === "failed") {
      await adminClient
        .from("subscription_payments")
        .update({
          ...feeUpdate,
          status: "failed",
          provider_reference: providerReference,
          transaction_reference: providerReference,
          message: "Payment did not complete",
          completed_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      await adminClient.from("notifications").insert({
        shop_id: payment.shop_id,
        title: "Malipo hayakufaulu",
        message:
          "Malipo yako hayakuenda. Tafadhali jaribu tena au tumia njia ya malipo ya mikono.",
        type: "subscription-payment-failed",
      });

      return ok("marked failed");
    }

    if (verifiedStatus !== "completed") {
      // Still pending / unverified — do not activate
      await adminClient
        .from("subscription_payments")
        .update(feeUpdate)
        .eq("id", payment.id);
      return ok(`status=${verifiedStatus}`);
    }

    // ── Verified completed → activate (reuse shared logic) ──
    try {
      await applySubscriptionPaymentSuccess({
        adminClient,
        payment: payment as any,
        amountConfigured,
        callbackPayload: { webhook: body, verified: verifiedPayload },
        message: "Payment confirmed",
        providerReference,
        utilityReference: orderId,
        provider: "harakapay",
      });

      // Ensure fee/net are persisted on the success update
      if (
        (Number.isFinite(feeAmount) && (feeAmount as number) > 0) ||
        (Number.isFinite(netAmount) && (netAmount as number) > 0)
      ) {
        await adminClient
          .from("subscription_payments")
          .update({
            ...(Number.isFinite(feeAmount) && (feeAmount as number) > 0
              ? { fee_amount: feeAmount }
              : {}),
            ...(Number.isFinite(netAmount) && (netAmount as number) > 0
              ? { net_amount: netAmount }
              : {}),
          })
          .eq("id", payment.id);
      }

      // Swahili-friendly notification (shared function already inserts one;
      // add a clearer local message)
      await adminClient.from("notifications").insert({
        shop_id: payment.shop_id,
        title: "Malipo Yamekubaliwa ✅",
        message: `Malipo yako ya TZS ${Number(payment.amount).toLocaleString()} yamekubaliwa. WiseCash Pro imeamilishwa.`,
        type: "payment_approved",
      });
    } catch (applyErr) {
      console.error("harakapay apply success error:", applyErr);
      // Still 200 so HarakaPay does not keep retrying
    }

    return ok("payment applied");
  } catch (error) {
    console.error("harakapay-webhook error:", error);
    return ok("error logged");
  }
});
