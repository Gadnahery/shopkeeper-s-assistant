/**
 * harakapay-check-status
 *
 * Client-callable Edge Function to check or cancel a pending HarakaPay subscription payment.
 *
 * Actions:
 * - "check": Queries HarakaPay API GET /api/v1/status/{order_id}, updates Supabase, and returns status.
 * - "cancel": Marks the active pending payment as cancelled in Supabase, stopping the waiting UI.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  applySubscriptionPaymentSuccess,
  getConfiguredSubscriptionMonthlyPrice,
} from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const harakaApiKey = Deno.env.get("HARAKAPAY_API_KEY");
    const harakaBaseUrl =
      Deno.env.get("HARAKAPAY_BASE_URL")?.replace(/\/$/, "") ||
      "https://harakapay.net";
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole || !authHeader) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("shop_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.shop_id) {
      return json({ error: "Shop membership not found" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: "check" | "cancel";
      payment_id?: string;
    };
    const action = body.action || "check";

    // Locate the relevant payment: specific payment_id, or latest pending/recent for this shop
    let payment: Record<string, unknown> | null = null;
    if (body.payment_id) {
      const { data } = await adminClient
        .from("subscription_payments")
        .select("*")
        .eq("id", body.payment_id)
        .eq("shop_id", profile.shop_id)
        .maybeSingle();
      payment = data as Record<string, unknown> | null;
    }

    if (!payment) {
      // Look for any pending payment for this shop
      const { data: pending } = await adminClient
        .from("subscription_payments")
        .select("*")
        .eq("shop_id", profile.shop_id)
        .eq("provider", "harakapay")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      payment = pending as Record<string, unknown> | null;
    }

    if (!payment) {
      // Look for latest payment
      const { data: latest } = await adminClient
        .from("subscription_payments")
        .select("*")
        .eq("shop_id", profile.shop_id)
        .eq("provider", "harakapay")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      payment = latest as Record<string, unknown> | null;
    }

    if (!payment) {
      return json({ ok: true, status: "none", message: "No payment found" });
    }

    // ── ACTION: CANCEL ──
    if (action === "cancel") {
      // Safety check: before cancelling, verify if the customer already approved the transaction on their phone
      const orderId = String(
        payment.external_id || payment.provider_reference || payment.transaction_reference || "",
      ).trim();

      if (orderId && harakaApiKey && payment.status === "pending") {
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
          if (statusRes.ok) {
            const verifiedPayload = (await statusRes.json().catch(() => ({}))) as Record<string, unknown>;
            const paymentObj = (verifiedPayload.payment as Record<string, unknown>) ?? verifiedPayload;
            const rawStatus = String(
              paymentObj.status ??
                paymentObj.transaction_status ??
                paymentObj.state ??
                verifiedPayload.status ??
                "",
            )
              .trim()
              .toLowerCase();

            if (["completed", "complete", "success", "successful", "paid"].includes(rawStatus)) {
              // Safety catch: Customer actually completed payment on phone right before pressing Cancel!
              // Activate subscription immediately instead of cancelling!
              const amountConfigured = getConfiguredSubscriptionMonthlyPrice();
              const providerReference = String(
                paymentObj.provider_reference ??
                  paymentObj.transaction_reference ??
                  paymentObj.reference ??
                  orderId,
              );
              await applySubscriptionPaymentSuccess({
                adminClient,
                payment: payment as any,
                amountConfigured,
                callbackPayload: { verified: verifiedPayload },
                message: "Payment confirmed via pre-cancellation check",
                providerReference,
                utilityReference: orderId,
                provider: "harakapay",
              });

              return json({
                ok: true,
                status: "success",
                payment_id: payment.id,
                message: "Malipo yamekamilika na WiseCash Pro imeamilishwa!",
              });
            }
          }
        } catch (checkErr) {
          console.error("Cancel pre-check error:", checkErr);
        }
      }

      if (payment.status === "pending") {
        await adminClient
          .from("subscription_payments")
          .update({
            status: "cancelled",
            message: "Malipo yalighairiwa na mtumiaji",
            completed_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        return json({
          ok: true,
          status: "cancelled",
          message: "Malipo yameghairiwa.",
        });
      }
      return json({ ok: true, status: payment.status, message: payment.message });
    }

    // ── ACTION: CHECK ──
    // If already in a terminal state, return immediately without re-checking HarakaPay
    if (payment.status === "success") {
      return json({ ok: true, status: "success", payment_id: payment.id });
    }
    if (["failed", "cancelled", "rejected", "expired"].includes(String(payment.status))) {
      return json({
        ok: true,
        status: payment.status,
        message: payment.message,
        payment_id: payment.id,
      });
    }

    // Order reference to check with HarakaPay
    const orderId = String(
      payment.external_id || payment.provider_reference || payment.transaction_reference || "",
    ).trim();

    if (!orderId || !harakaApiKey) {
      return json({ ok: true, status: payment.status, payment_id: payment.id });
    }

    // Call HarakaPay GET /api/v1/status/{order_id}
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

      if (!statusRes.ok) {
        return json({ ok: true, status: "pending", payment_id: payment.id });
      }

      const verifiedPayload = (await statusRes.json().catch(() => ({}))) as Record<string, unknown>;
      const paymentObj = (verifiedPayload.payment as Record<string, unknown>) ?? verifiedPayload;

      const rawStatus = String(
        paymentObj.status ??
          paymentObj.transaction_status ??
          paymentObj.state ??
          verifiedPayload.status ??
          "",
      )
        .trim()
        .toLowerCase();

      const feeAmount = Number(
        paymentObj.fee_amount ?? paymentObj.fee ?? paymentObj.transaction_fee ?? NaN,
      );
      const netAmount = Number(
        paymentObj.net_amount ?? paymentObj.netAmount ?? paymentObj.amount_received ?? NaN,
      );
      const providerReference = String(
        paymentObj.provider_reference ??
          paymentObj.transaction_reference ??
          paymentObj.reference ??
          orderId,
      );

      if (["completed", "complete", "success", "successful", "paid"].includes(rawStatus)) {
        const amountConfigured = getConfiguredSubscriptionMonthlyPrice();
        await applySubscriptionPaymentSuccess({
          adminClient,
          payment: payment as any,
          amountConfigured,
          callbackPayload: { verified: verifiedPayload },
          message: "Payment confirmed via active status check",
          providerReference,
          utilityReference: orderId,
          provider: "harakapay",
        });

        if (
          (Number.isFinite(feeAmount) && feeAmount > 0) ||
          (Number.isFinite(netAmount) && netAmount > 0)
        ) {
          await adminClient
            .from("subscription_payments")
            .update({
              ...(Number.isFinite(feeAmount) && feeAmount > 0 ? { fee_amount: feeAmount } : {}),
              ...(Number.isFinite(netAmount) && netAmount > 0 ? { net_amount: netAmount } : {}),
            })
            .eq("id", payment.id);
        }

        return json({ ok: true, status: "success", payment_id: payment.id });
      }

      if (["failed", "failure", "cancelled", "canceled", "expired", "rejected"].includes(rawStatus)) {
        const failMsg = "Malipo yalighairiwa au hayakukamilika.";
        await adminClient
          .from("subscription_payments")
          .update({
            status: "failed",
            provider_reference: providerReference,
            transaction_reference: providerReference,
            message: failMsg,
            callback_payload: { verified: verifiedPayload },
            completed_at: new Date().toISOString(),
            ...(Number.isFinite(feeAmount) && feeAmount > 0 ? { fee_amount: feeAmount } : {}),
            ...(Number.isFinite(netAmount) && netAmount > 0 ? { net_amount: netAmount } : {}),
          })
          .eq("id", payment.id);

        return json({
          ok: true,
          status: "failed",
          message: failMsg,
          payment_id: payment.id,
        });
      }

      // If the USSD prompt has been pending for more than 60 seconds without completing,
      // it has timed out on the telecom network (M-Pesa/Tigo USSD session expires in 60s).
      const createdAtMs = new Date(String(payment.created_at)).getTime();
      const ageMs = Date.now() - createdAtMs;
      if (ageMs > 60_000) {
        const timeoutMsg = "Muda wa kuthibitisha kwenye simu umekwisha au ombi lilighairiwa.";
        await adminClient
          .from("subscription_payments")
          .update({
            status: "failed",
            message: timeoutMsg,
            completed_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        return json({
          ok: true,
          status: "failed",
          message: timeoutMsg,
          payment_id: payment.id,
        });
      }

      return json({ ok: true, status: "pending", payment_id: payment.id });
    } catch (apiErr) {
      console.error("HarakaPay status check error:", apiErr);
      return json({ ok: true, status: "pending", payment_id: payment.id });
    }
  } catch (error) {
    console.error("harakapay-check-status unhandled error:", error);
    return json({ error: "Failed to process status request" }, 500);
  }
});
