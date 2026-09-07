import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function is called daily by a Supabase cron schedule.
// Schedule: 0 6 * * * (every day at 06:00 UTC / 09:00 EAT)
//
// Register the cron in the Supabase Dashboard → Edge Functions → Cron Jobs, or:
// supabase functions schedule subscription-daily-cron --cron "0 6 * * *"

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Allow both scheduled invocations (GET) and manual triggers (POST/GET)
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceRole) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRole);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    let expiredCount = 0;
    let remindersInserted = 0;

    // ── 1. Expire subscriptions that have passed current_period_ends_at ─────────
    const { data: toExpire } = await adminClient
      .from("shop_subscriptions")
      .select("shop_id, current_period_ends_at")
      .eq("status", "active")
      .lt("current_period_ends_at", now.toISOString());

    for (const sub of toExpire ?? []) {
      await adminClient
        .from("shop_subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("shop_id", sub.shop_id);

      // Check dedup: only insert if no expired notification sent today
      const { count } = await adminClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", sub.shop_id)
        .eq("type", "subscription_expired")
        .gte("created_at", `${todayStr}T00:00:00Z`);

      if (!count || count === 0) {
        await adminClient.from("notifications").insert({
          shop_id: sub.shop_id,
          title: "Usajili Umekwisha 🔴",
          message:
            "Usajili wako wa WiseCash umekwisha. Funga upya sasa ili kuendelea kutumia mfumo bila kikwazo.",
          type: "subscription_expired",
        });
        expiredCount++;
      }
    }

    // ── 2. Send expiry reminders for days 7 through 1 ───────────────────────────
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: expiring } = await adminClient
      .from("shop_subscriptions")
      .select("shop_id, current_period_ends_at")
      .eq("status", "active")
      .gt("current_period_ends_at", now.toISOString())
      .lte("current_period_ends_at", sevenDaysFromNow.toISOString());

    for (const sub of expiring ?? []) {
      const endDate = new Date(sub.current_period_ends_at);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const reminderType = `subscription_expiring_${daysLeft}`;

      // Dedup: only one reminder per day-count per period
      const { count } = await adminClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", sub.shop_id)
        .eq("type", reminderType)
        .gte("created_at", `${todayStr}T00:00:00Z`);

      if (!count || count === 0) {
        const dayWord = daysLeft === 1 ? "siku 1" : `siku ${daysLeft}`;
        await adminClient.from("notifications").insert({
          shop_id: sub.shop_id,
          title: `Usajili Unakwisha — ${dayWord} zilizobaki ⚠️`,
          message: `Usajili wako wa WiseCash unakwisha baada ya ${dayWord}. Funga upya kabla ya kuisha ili kuepuka usumbufu.`,
          type: reminderType,
        });
        remindersInserted++;
      }
    }

    return json({
      ok: true,
      date: todayStr,
      expired_shops: expiredCount,
      reminders_sent: remindersInserted,
    });
  } catch (err) {
    console.error("subscription-daily-cron error:", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
