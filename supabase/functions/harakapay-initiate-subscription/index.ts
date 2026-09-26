/**
 * harakapay-initiate-subscription
 *
 * Client calls this (never HarakaPay directly).
 * API key lives only as Edge Function secret: HARAKAPAY_API_KEY
 *
 * Flow:
 * 1. Verify session + shop membership
 * 2. Insert subscription_payments row (provider: harakapay, status: pending)
 * 3. POST HarakaPay /api/v1/collect with webhook_url
 * 4. Store order_id + fee/net from response
 * 5. Return minimal "check your phone" payload to client
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getConfiguredSubscriptionMonthlyPrice } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type InitiateBody = {
  phone_number?: string;
  payment_channel?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `255${digits.slice(1)}`;
  if (digits.length === 9) return `255${digits}`;
  return "";
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
      "https://api.harakapay.net";
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole || !authHeader) {
      return json({ error: "Server misconfigured" }, 500);
    }
    if (!harakaApiKey) {
      return json(
        { error: "Automated mobile payment is not configured." },
        500,
      );
    }

    const amount = getConfiguredSubscriptionMonthlyPrice();
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Subscription amount is not configured" }, 500);
    }

    // Authenticated caller
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    // Resolve shop membership (same pattern as azampay-initiate)
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("shop_id, shops(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.shop_id) {
      return json({ error: "Shop membership not found" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as InitiateBody;
    const phoneNumber = normalizePhoneNumber(String(body.phone_number ?? ""));
    const paymentChannel = String(body.payment_channel ?? "mobile_money").trim() ||
      "mobile_money";

    if (!phoneNumber) {
      return json(
        { error: "A valid Tanzanian phone number is required (e.g. 07XXXXXXXX)" },
        400,
      );
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/harakapay-webhook`;

    // Create pending payment row first
    const { data: paymentRow, error: paymentError } = await adminClient
      .from("subscription_payments")
      .insert({
        shop_id: profile.shop_id,
        initiated_by: user.id,
        provider: "harakapay",
        payment_channel: paymentChannel,
        phone_number: phoneNumber,
        amount,
        gross_amount: amount,
        currency: "TZS",
        billing_period_months: 1,
        status: "pending",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        request_payload: {
          phone: phoneNumber,
          amount,
          description: "WiseCash Monthly Subscription",
          webhook_url: webhookUrl,
        },
      })
      .select("*")
      .single();

    if (paymentError || !paymentRow) {
      return json(
        { error: paymentError?.message || "Failed to create payment record" },
        400,
      );
    }

    // Call HarakaPay collect API (server-side only)
    const collectPayload = {
      phone: phoneNumber,
      amount,
      description: "WiseCash Monthly Subscription",
      webhook_url: webhookUrl,
      // Optional merchant reference for reconciliation
      merchant_reference: paymentRow.id,
    };

    const collectResponse = await fetch(`${harakaBaseUrl}/api/v1/collect`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": harakaApiKey,
      },
      body: JSON.stringify(collectPayload),
    });

    const collectText = await collectResponse.text();
    let collectBody: Record<string, unknown> = {};
    try {
      collectBody = JSON.parse(collectText) as Record<string, unknown>;
    } catch {
      collectBody = { raw: collectText };
    }

    if (!collectResponse.ok) {
      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          message: `Payment initiation failed: ${collectResponse.status}`,
          callback_payload: collectBody,
          completed_at: new Date().toISOString(),
        })
        .eq("id", paymentRow.id);

      return json(
        {
          error: "Failed to initiate payment",
          details: collectBody,
        },
        502,
      );
    }

    // Extract order_id / fee / net from response (shape may vary slightly)
    const orderId = String(
      collectBody.order_id ??
        collectBody.orderId ??
        collectBody.id ??
        collectBody.reference ??
        "",
    ).trim();

    const feeAmount = Number(
      collectBody.fee_amount ?? collectBody.fee ?? collectBody.transaction_fee ?? 0,
    );
    const netAmount = Number(
      collectBody.net_amount ??
        collectBody.netAmount ??
        collectBody.amount_received ??
        (amount - (Number.isFinite(feeAmount) ? feeAmount : 0)),
    );

    const updatePayload: Record<string, unknown> = {
      transaction_reference: orderId || paymentRow.id,
      provider_reference: orderId || null,
      external_id: orderId || paymentRow.id,
      response_payload: collectBody,
    };
    if (Number.isFinite(feeAmount) && feeAmount > 0) {
      updatePayload.fee_amount = feeAmount;
    }
    if (Number.isFinite(netAmount) && netAmount > 0) {
      updatePayload.net_amount = netAmount;
    }

    await adminClient
      .from("subscription_payments")
      .update(updatePayload)
      .eq("id", paymentRow.id);

    // Minimal client response — never return raw HarakaPay payload
    return json({
      ok: true,
      payment_id: paymentRow.id,
      order_id: orderId || paymentRow.id,
      amount,
      message:
        "Check your phone and enter your PIN to confirm the payment. Status will update automatically.",
      message_sw:
        "Angalia simu yako na weka PIN yako kuthibitisha malipo. Hali itasasishwa kiotomatiki.",
    });
  } catch (err) {
    console.error("harakapay-initiate-subscription error:", err);
    return json(
      { error: (err as Error).message ?? "Unexpected error" },
      500,
    );
  }
});
