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


function extractProviderError(status: number, body: Record<string, unknown>, rawText: string): {
  error: string;
  error_sw: string;
  error_code: string;
} {
  const fromBody = String(
    body.message ??
      body.error ??
      body.error_message ??
      body.detail ??
      body.details ??
      (typeof body.raw === "string" ? body.raw : "") ??
      "",
  ).trim();

  // Map common HTTP statuses to clear operator-facing text
  if (status === 401 || status === 403) {
    return {
      error_code: "provider_auth",
      error: fromBody || "Payment provider rejected the API key. Check HARAKAPAY_API_KEY in Supabase secrets.",
      error_sw: fromBody || "Kitufe cha API hakikubaliwi. Angalia siri za HARAKAPAY_API_KEY.",
    };
  }
  if (status === 400 || status === 422) {
    return {
      error_code: "provider_validation",
      error: fromBody || "Payment provider rejected the request (invalid phone or amount).",
      error_sw: fromBody || "Ombi limekataliwa (namba au kiasi si sahihi).",
    };
  }
  if (status === 429) {
    return {
      error_code: "provider_rate_limit",
      error: fromBody || "Too many payment requests. Please wait a moment and try again.",
      error_sw: fromBody || "Maombi mengi sana. Subiri kidogo kisha jaribu tena.",
    };
  }
  if (status === 440) {
    return {
      error_code: "provider_session",
      error:
        fromBody ||
        "Payment provider returned session error (HTTP 440). API key may be inactive or the account needs activation by HarakaPay support.",
      error_sw:
        fromBody ||
        "Huduma ya malipo imerudisha hitilafu ya kikao (440). Kitufe cha API kinaweza kuwa hakijawashwa.",
    };
  }
  if (status >= 500) {
    return {
      error_code: "provider_unavailable",
      error: fromBody || `Payment provider is temporarily unavailable (HTTP ${status}). Try again later.`,
      error_sw: fromBody || `Huduma ya malipo haipatikani sasa (HTTP ${status}). Jaribu baadaye.`,
    };
  }
  if (status === 0 || !status) {
    return {
      error_code: "provider_network",
      error: "Could not reach the payment provider. Check HARAKAPAY_BASE_URL and network.",
      error_sw: "Imeshindikana kuwasiliana na huduma ya malipo. Angalia mtandao.",
    };
  }
  return {
    error_code: `provider_http_${status}`,
    error: fromBody || `Payment initiation failed (HTTP ${status}).`,
    error_sw: fromBody || `Kuanzisha malipo kumeshindikana (HTTP ${status}).`,
  };
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
      "https://harakapay.net";
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

    // Official API returns HTTP 200 with { success: false, error: "..." } on business errors
    const providerSuccess = collectBody.success === true;
    if (collectResponse.ok && !providerSuccess) {
      const errText = String(collectBody.error ?? collectBody.message ?? "Payment was not started").trim();
      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          message: errText.slice(0, 500),
          callback_payload: {
            http_status: collectResponse.status,
            error_code: "provider_rejected",
            body: collectBody,
          },
          completed_at: new Date().toISOString(),
        })
        .eq("id", paymentRow.id);

      return json(
        {
          error: errText,
          error_sw: errText,
          error_code: "provider_rejected",
          http_status: collectResponse.status,
          payment_id: paymentRow.id,
        },
        400,
      );
    }

    if (!collectResponse.ok) {
      const mapped = extractProviderError(
        collectResponse.status,
        collectBody,
        collectText,
      );
      const logMessage = `[${mapped.error_code}] HTTP ${collectResponse.status}: ${mapped.error}`;

      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          message: logMessage.slice(0, 500),
          callback_payload: {
            http_status: collectResponse.status,
            error_code: mapped.error_code,
            body: collectBody,
            raw: collectText.slice(0, 2000),
          },
          completed_at: new Date().toISOString(),
        })
        .eq("id", paymentRow.id);

      // Surface clear error to client (no secrets)
      return json(
        {
          error: mapped.error,
          error_sw: mapped.error_sw,
          error_code: mapped.error_code,
          http_status: collectResponse.status,
          payment_id: paymentRow.id,
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
      collectBody.fee ?? collectBody.fee_amount ?? collectBody.transaction_fee ?? 0,
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
    const msg = (err as Error).message ?? "Unexpected error";
    return json(
      {
        error: msg,
        error_sw: msg,
        error_code: "internal_error",
      },
      500,
    );
  }
});
