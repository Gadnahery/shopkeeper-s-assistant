import { supabase } from "@/integrations/supabase/client";

type AuditPayload = {
  action: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort audit logging. Never throws to avoid blocking user actions.
 */
export async function logAudit(payload: AuditPayload) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("shop_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.shop_id) return;

    await (supabase as any).from("audit_log").insert({
      shop_id: profile.shop_id,
      user_id: userId,
      action: payload.action,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch {
    // no-op by design
  }
}
