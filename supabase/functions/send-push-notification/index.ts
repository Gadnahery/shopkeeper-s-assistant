import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PushRequest = {
  shop_id: string;
  title: string;
  message?: string;
  type?: string;
  url?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("PUSH_VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("PUSH_VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("PUSH_SUBJECT") ?? "mailto:admin@example.com";
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole || !vapidPublicKey || !vapidPrivateKey || !authHeader) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRole);

    const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerAuth.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as PushRequest;
    const shopId = String(body.shop_id || "").trim();
    const title = String(body.title || "").trim();
    const message = String(body.message || "").trim();
    const type = String(body.type || "info").trim();
    const url = String(body.url || "/notifications").trim();

    if (!shopId || !title) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("shop_id")
      .eq("user_id", callerAuth.user.id)
      .maybeSingle();

    if (!callerProfile?.shop_id || callerProfile.shop_id !== shopId) {
      return new Response(JSON.stringify({ error: "Invalid shop access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { data: notification, error: notificationError } = await adminClient
      .from("notifications")
      .insert({
        shop_id: shopId,
        title,
        message: message || null,
        type,
      })
      .select("id, title, message, type, created_at")
      .single();

    if (notificationError || !notification) {
      return new Response(JSON.stringify({ error: notificationError?.message || "Failed to create notification" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions, error: subscriptionsError } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("shop_id", shopId);

    if (subscriptionsError) {
      return new Response(JSON.stringify({ error: subscriptionsError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      url,
      created_at: notification.created_at,
    });

    let sent = 0;
    let removed = 0;

    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );

        sent += 1;
        await adminClient
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", subscription.id);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          removed += 1;
          await adminClient.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }

    return new Response(JSON.stringify({ notification_id: notification.id, sent, removed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
