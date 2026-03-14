import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InitiateRequest = {
  provider: string;
  phone_number: string;
};

type TokenResponse = {
  data?: {
    accessToken?: string;
  };
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("255") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `255${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `255${digits}`;
  }

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
    const authHeader = req.headers.get("Authorization");
    const appName = Deno.env.get("AZAMPAY_APP_NAME");
    const clientId = Deno.env.get("AZAMPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("AZAMPAY_CLIENT_SECRET");
    const callbackToken = Deno.env.get("AZAMPAY_CALLBACK_TOKEN");
    const baseUrl = Deno.env.get("AZAMPAY_BASE_URL");
    const authUrl = Deno.env.get("AZAMPAY_AUTH_URL");
    const callbackSecret = Deno.env.get("AZAMPAY_CALLBACK_SECRET");
    const source = Deno.env.get("AZAMPAY_SOURCE") ?? "Smart Money Subscription";
    const amount = Number(Deno.env.get("SUBSCRIPTION_MONTHLY_PRICE_TZS") ?? "0");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole || !authHeader) {
      return json({ error: "Server misconfigured" }, 500);
    }

    if (!appName || !clientId || !clientSecret || !callbackToken || !baseUrl || !authUrl || !callbackSecret) {
      return json({ error: "AzamPay environment variables are missing" }, 500);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Subscription amount is not configured" }, 500);
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerAuth.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: profile } = await callerClient
      .from("profiles")
      .select("shop_id, full_name, shops(name)")
      .eq("user_id", callerAuth.user.id)
      .maybeSingle();

    if (!profile?.shop_id) {
      return json({ error: "Shop not found" }, 403);
    }

    const { data: roleRow } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerAuth.user.id)
      .eq("shop_id", profile.shop_id)
      .maybeSingle();

    if (!roleRow || !["owner", "manager"].includes(roleRow.role)) {
      return json({ error: "Only owner or manager can renew the subscription" }, 403);
    }

    const body = (await req.json()) as InitiateRequest;
    const provider = String(body.provider || "").trim();
    const phoneNumber = normalizePhoneNumber(String(body.phone_number || ""));

    if (!provider || !phoneNumber) {
      return json({ error: "Provider and valid phone number are required" }, 400);
    }

    const tokenResponse = await fetch(`${authUrl.replace(/\/$/, "")}/AppRegistration/GenerateToken`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-KEY": callbackToken,
      },
      body: JSON.stringify({
        appName,
        clientId,
        clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      return json({ error: "Failed to authenticate with AzamPay", details: text }, 502);
    }

    const tokenBody = (await tokenResponse.json()) as TokenResponse;
    const accessToken = tokenBody.data?.accessToken;

    if (!accessToken) {
      return json({ error: "AzamPay token response missing access token" }, 502);
    }

    const externalId = crypto.randomUUID();
    const callbackUrl = `${supabaseUrl}/functions/v1/azampay-webhook?secret=${encodeURIComponent(callbackSecret)}`;
    const payload = {
      provider,
      source,
      accountNumber: phoneNumber,
      amount,
      externalId,
      currency: "TZS",
      callbackUrl,
      additionalProperties: {
        customerId: profile.shop_id,
        orderId: externalId,
        total: String(amount),
        shopName: profile.shops?.name ?? "Smart Money",
      },
    };

    const { data: paymentRow, error: paymentError } = await adminClient
      .from("subscription_payments")
      .insert({
        shop_id: profile.shop_id,
        initiated_by: callerAuth.user.id,
        provider: "azampay",
        payment_channel: provider,
        phone_number: phoneNumber,
        amount,
        currency: "TZS",
        billing_period_months: 1,
        status: "pending",
        external_id: externalId,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        request_payload: payload,
      })
      .select("id, external_id")
      .single();

    if (paymentError || !paymentRow) {
      return json({ error: paymentError?.message || "Failed to create payment record" }, 400);
    }

    const checkoutResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/azampay/mno/checkout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const checkoutText = await checkoutResponse.text();
    let checkoutBody: unknown = {};

    try {
      checkoutBody = JSON.parse(checkoutText);
    } catch {
      checkoutBody = { raw: checkoutText };
    }

    if (!checkoutResponse.ok) {
      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          message: "Checkout initiation failed",
          response_payload: checkoutBody,
        })
        .eq("id", paymentRow.id);

      return json({ error: "AzamPay checkout request failed", details: checkoutBody }, 502);
    }

    const checkoutResult = checkoutBody as { success?: boolean; message?: string };
    if (checkoutResult.success === false) {
      await adminClient
        .from("subscription_payments")
        .update({
          status: "failed",
          message: checkoutResult.message ?? "Checkout request was rejected",
          response_payload: checkoutBody,
        })
        .eq("id", paymentRow.id);

      return json({ error: checkoutResult.message ?? "Checkout request was rejected" }, 400);
    }

    await adminClient
      .from("subscription_payments")
      .update({
        response_payload: checkoutBody,
        message: "Awaiting customer confirmation on mobile phone",
      })
      .eq("id", paymentRow.id);

    return json({
      ok: true,
      external_id: paymentRow.external_id,
      phone_number: phoneNumber,
      amount,
      status: "pending",
      message: "Payment request sent. The customer should complete it on their phone.",
    });
  } catch (error) {
    return json({ error: (error as Error).message || "Unexpected error" }, 500);
  }
});
