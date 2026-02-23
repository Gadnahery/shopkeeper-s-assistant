import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateUserRequest = {
  email: string;
  password: string;
  full_name: string;
  shop_id: string;
  role: "owner" | "manager" | "cashier" | "staff" | "hr";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole || !authHeader) {
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

    const body = (await req.json()) as CreateUserRequest;
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();
    const shopId = String(body.shop_id || "").trim();
    const role = String(body.role || "staff");

    if (!email || !password || !fullName || !shopId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedRoles = new Set(["owner", "manager", "cashier", "staff", "hr"]);
    const normalizedRole = allowedRoles.has(role) ? role : "staff";

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("shop_id")
      .eq("user_id", callerAuth.user.id)
      .maybeSingle();

    const { data: callerRole } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerAuth.user.id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (!callerProfile?.shop_id || callerProfile.shop_id !== shopId) {
      return new Response(JSON.stringify({ error: "Invalid shop access" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!callerRole || !["owner", "manager"].includes(callerRole.role)) {
      return new Response(JSON.stringify({ error: "Only owner or manager can create users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        invited_to_shop_id: shopId,
        invited_role: normalizedRole,
      },
    });

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Failed to create user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await adminClient.from("audit_log").insert({
      shop_id: shopId,
      user_id: callerAuth.user.id,
      action: "user_created",
      entity_type: "profiles",
      entity_id: created.user.id,
      metadata: { email, role: normalizedRole },
    });

    return new Response(JSON.stringify({ user_id: created.user.id }), {
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
