import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applySubscriptionPaymentSuccess, getConfiguredSubscriptionMonthlyPrice } from "../_shared/subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Verify caller and check platform admin status
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    // Platform admin guard — server-side check
    const { data: adminRow } = await adminClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) return json({ error: "Forbidden: platform admin access required" }, 403);

    const body = await req.json();
    const paymentId = String(body.payment_id ?? "").trim();

    if (!paymentId) return json({ error: "payment_id is required" }, 400);

    // Load the payment
    const { data: payment, error: paymentError } = await adminClient
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) return json({ error: "Payment not found" }, 404);
    if (payment.status !== "pending") {
      return json({ error: `Payment is already ${payment.status}` }, 409);
    }
    if (payment.provider !== "manual") {
      return json({ error: "Only manual payments can be approved via this endpoint" }, 400);
    }

    const amountConfigured = getConfiguredSubscriptionMonthlyPrice();

    // Apply the payment — reuses exact same logic as azampay-webhook
    await applySubscriptionPaymentSuccess({
      adminClient,
      payment,
      amountConfigured,
      message: "Payment manually verified and approved",
      providerReference: payment.transaction_reference ?? payment.id,
      utilityReference: payment.external_id,
    });

    // Set verified_by / verified_at on the payment row
    await adminClient
      .from("subscription_payments")
      .update({ verified_by: user.id, verified_at: new Date().toISOString() })
      .eq("id", paymentId);

    // Notify shop's billing managers/owners
    const { data: shopUsers } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("shop_id", payment.shop_id)
      .in("role", ["owner", "manager"]);

    const shopName = "your shop";
    await adminClient.from("notifications").insert({
      shop_id: payment.shop_id,
      title: "Malipo Yamekubaliwa ✅",
      message: `Malipo yako ya TZS ${Number(payment.amount).toLocaleString()} yamekubaliwa. WiseCash Pro imeamilishwa kwa mwezi mmoja.`,
      type: "payment_approved",
    });

    return json({ ok: true, message: "Payment approved and subscription activated" });
  } catch (err) {
    console.error("approve-subscription-payment error:", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
