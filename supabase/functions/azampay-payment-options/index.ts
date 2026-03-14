import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TokenResponse = {
  data?: {
    accessToken?: string;
  };
};

type PartnerItem = {
  name?: string;
  provider?: string;
  displayName?: string;
  value?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePartner(partner: PartnerItem) {
  const raw = String(
    partner.provider ??
      partner.value ??
      partner.name ??
      partner.displayName ??
      "",
  ).trim();

  const normalized = raw.toLowerCase();

  if (!raw) {
    return null;
  }

  if (normalized.includes("vodacom") || normalized.includes("mpesa") || normalized === "m-pesa") {
    return { value: "Mpesa", label: "Vodacom M-Pesa" };
  }

  if (normalized.includes("halo")) {
    return { value: "Halopesa", label: "Halotel Halopesa" };
  }

  if (normalized.includes("airtel")) {
    return { value: "Airtel", label: "Airtel Money" };
  }

  if (normalized.includes("tigo") || normalized.includes("yas")) {
    return { value: "Tigo", label: "Yas (TigoPesa)" };
  }

  if (normalized.includes("azam")) {
    return { value: "Azampesa", label: "AzamPesa" };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");
    const appName = Deno.env.get("AZAMPAY_APP_NAME");
    const clientId = Deno.env.get("AZAMPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("AZAMPAY_CLIENT_SECRET");
    const callbackToken = Deno.env.get("AZAMPAY_CALLBACK_TOKEN");
    const baseUrl = Deno.env.get("AZAMPAY_BASE_URL");
    const authUrl = Deno.env.get("AZAMPAY_AUTH_URL");

    if (!supabaseUrl || !supabaseAnonKey || !authHeader) {
      return json({ error: "Server misconfigured" }, 500);
    }

    if (!appName || !clientId || !clientSecret || !callbackToken || !baseUrl || !authUrl) {
      return json({ error: "AzamPay environment variables are missing" }, 500);
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerAuth.user) {
      return json({ error: "Unauthorized" }, 401);
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

    const partnerResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/Partner/GetPaymentPartners`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!partnerResponse.ok) {
      const text = await partnerResponse.text();
      return json({ error: "Failed to load AzamPay payment partners", details: text }, 502);
    }

    const partnerBody = await partnerResponse.json();
    const partnerList = Array.isArray(partnerBody) ? partnerBody : [];
    const options = partnerList
      .map((entry) => normalizePartner(entry as PartnerItem))
      .filter((entry): entry is { value: string; label: string } => Boolean(entry))
      .filter((entry, index, array) => array.findIndex((item) => item.value === entry.value) === index);

    return json({
      providers: options,
      source: Deno.env.get("AZAMPAY_SOURCE") ?? "Smart Money Subscription",
      amount: Number(Deno.env.get("SUBSCRIPTION_MONTHLY_PRICE_TZS") ?? "0"),
      currency: "TZS",
    });
  } catch (error) {
    return json({ error: (error as Error).message || "Unexpected error" }, 500);
  }
});
