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

const ALLOWED_CHANNELS = ["Mpesa", "Halopesa"] as const;
const REQUIRED_AMOUNT = 25_000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    // Get caller's shop_id
    const { data: profile } = await adminClient
      .from("profiles")
      .select("shop_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.shop_id) return json({ error: "No shop found for this account" }, 403);
    const shopId = profile.shop_id as string;

    // Parse body
    const body = await req.json();
    const paymentChannel = String(body.payment_channel ?? "").trim();
    const phoneNumber = String(body.phone_number ?? "").trim();
    const amount = Number(body.amount ?? 0);
    const transactionReference = String(body.transaction_reference ?? "").trim();
    const paymentDate = String(body.payment_date ?? new Date().toISOString().slice(0, 10)).trim();
    const proofUrl = body.proof_url ? String(body.proof_url).trim() : null;
    const billingPeriodMonths = Number(body.billing_period_months ?? 1);

    // Validate
    if (!ALLOWED_CHANNELS.includes(paymentChannel as typeof ALLOWED_CHANNELS[number])) {
      return json({ error: `Invalid payment channel. Allowed: ${ALLOWED_CHANNELS.join(", ")}` }, 400);
    }
    if (!phoneNumber) return json({ error: "Phone number is required" }, 400);
    if (amount < REQUIRED_AMOUNT) {
      return json({ error: `Amount must be at least TZS ${REQUIRED_AMOUNT.toLocaleString()}` }, 400);
    }
    if (!transactionReference) return json({ error: "Transaction reference is required" }, 400);

    // Check there's no already-pending payment for this shop
    const { data: existingPending } = await adminClient
      .from("subscription_payments")
      .select("id, status")
      .eq("shop_id", shopId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return json({ error: "You already have a pending payment awaiting verification. Please wait for it to be processed." }, 409);
    }

    // Generate a unique external_id for the manual payment
    const externalId = `manual_${crypto.randomUUID()}`;

    // Insert the payment record
    const { data: payment, error: insertError } = await adminClient
      .from("subscription_payments")
      .insert({
        shop_id: shopId,
        initiated_by: user.id,
        provider: "manual",
        payment_channel: paymentChannel,
        phone_number: phoneNumber,
        amount,
        currency: "TZS",
        billing_period_months: billingPeriodMonths,
        status: "pending",
        external_id: externalId,
        transaction_reference: transactionReference,
        proof_url: proofUrl,
        message: `Manual payment submitted via ${paymentChannel}. Reference: ${transactionReference}`,
        paid_for_period_start: paymentDate,
      })
      .select()
      .single();

    if (insertError || !payment) {
      console.error("Payment insert error:", insertError);
      return json({ error: insertError?.message ?? "Failed to record payment" }, 500);
    }

    // Get shop name for notification message
    const { data: shop } = await adminClient
      .from("shops")
      .select("name")
      .eq("id", shopId)
      .maybeSingle();
    const shopName = shop?.name ?? "Unknown Shop";

    // Notify all platform admins — in-app notification + push
    const { data: admins } = await adminClient
      .from("platform_admins")
      .select("user_id");

    for (const admin of admins ?? []) {
      // In-app notification (get admin's shop_id for notification scoping — use user_id directly)
      await adminClient.from("notifications").insert({
        shop_id: shopId, // Store under the paying shop so admin sees it in their feed too
        title: "New Payment Submitted",
        message: `${shopName} submitted a manual payment of TZS ${amount.toLocaleString()} via ${paymentChannel}. Ref: ${transactionReference}`,
        type: "payment_submitted",
      });

      // Push notification — query admin's push subscriptions by user_id
      const { data: pushSubs } = await adminClient
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", admin.user_id);

      if (pushSubs && pushSubs.length > 0) {
        const vapidPublicKey = Deno.env.get("PUSH_VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("PUSH_VAPID_PRIVATE_KEY");
        const vapidSubject = Deno.env.get("PUSH_SUBJECT") ?? "mailto:admin@wisecash.app";

        if (vapidPublicKey && vapidPrivateKey) {
          const { default: webpush } = await import("npm:web-push@3.6.7");
          webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

          const payload = JSON.stringify({
            title: "💳 New Payment to Verify",
            message: `${shopName} — TZS ${amount.toLocaleString()} via ${paymentChannel}`,
            type: "payment_submitted",
            url: "/platform-admin/payments",
          });

          for (const sub of pushSubs) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload,
              );
              await adminClient
                .from("push_subscriptions")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", sub.id);
            } catch (err) {
              const statusCode = (err as { statusCode?: number }).statusCode;
              if (statusCode === 404 || statusCode === 410) {
                await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          }
        }
      }
    }

    return json({ ok: true, payment_id: payment.id, external_id: externalId });
  } catch (err) {
    console.error("submit-manual-payment error:", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
