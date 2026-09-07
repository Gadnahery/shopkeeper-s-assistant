import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    // Platform admin guard
    const { data: adminRow } = await adminClient
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!adminRow) return json({ error: "Forbidden: platform admin access required" }, 403);

    const body = await req.json();
    const paymentId = String(body.payment_id ?? "").trim();
    const reason = String(body.reason ?? "").trim();

    if (!paymentId) return json({ error: "payment_id is required" }, 400);
    if (!reason) return json({ error: "Rejection reason is required" }, 400);

    const { data: payment, error: paymentError } = await adminClient
      .from("subscription_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !payment) return json({ error: "Payment not found" }, 404);
    if (payment.status !== "pending") {
      return json({ error: `Payment is already ${payment.status}` }, 409);
    }

    // Mark as rejected
    const { error: updateError } = await adminClient
      .from("subscription_payments")
      .update({
        status: "rejected",
        rejection_reason: reason,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        message: `Rejected: ${reason}`,
      })
      .eq("id", paymentId);

    if (updateError) return json({ error: updateError.message }, 500);

    // Notify shop
    await adminClient.from("notifications").insert({
      shop_id: payment.shop_id,
      title: "Malipo Yamekataliwa ❌",
      message: `Malipo yako ya TZS ${Number(payment.amount).toLocaleString()} yamekataliwa. Sababu: ${reason}. Tuma tena ukithibitisha maelezo sahihi.`,
      type: "payment_rejected",
    });

    return json({ ok: true, message: "Payment rejected" });
  } catch (err) {
    console.error("reject-subscription-payment error:", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
