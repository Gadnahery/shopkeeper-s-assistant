import { supabase } from "@/integrations/supabase/client";
import { getAppUrl } from "@/lib/siteUrl";

type SupportedLanguage = "en" | "sw";

const RESET_COOLDOWN_MS = 60_000;
const RESET_KEY_PREFIX = "wisecash:password-reset:";

function cooldownKey(email: string) {
  return `${RESET_KEY_PREFIX}${email.trim().toLowerCase()}`;
}

export function getPasswordResetCooldown(email: string) {
  if (typeof window === "undefined") return 0;

  const saved = window.localStorage.getItem(cooldownKey(email));
  if (!saved) return 0;

  const elapsed = Date.now() - Number(saved);
  return Math.max(0, RESET_COOLDOWN_MS - elapsed);
}

function cooldownMessage(language: SupportedLanguage, msLeft: number) {
  const secondsLeft = Math.max(1, Math.ceil(msLeft / 1000));
  return language === "sw"
    ? `Subiri takribani sekunde ${secondsLeft} kabla ya kutuma tena kiungo cha kubadilisha nenosiri.`
    : `Please wait about ${secondsLeft} seconds before sending another password reset link.`;
}

function rateLimitMessage(language: SupportedLanguage) {
  return language === "sw"
    ? "Barua pepe za kubadilisha nenosiri zimefikia kikomo cha muda kwa sasa. Tafadhali subiri kidogo kisha ujaribu tena."
    : "Password reset emails are temporarily rate-limited right now. Please wait a bit and try again.";
}

export async function requestPasswordReset(email: string, language: SupportedLanguage) {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error(language === "sw" ? "Ingiza barua pepe" : "Enter your email");
  }

  const cooldown = getPasswordResetCooldown(trimmedEmail);
  if (cooldown > 0) {
    throw new Error(cooldownMessage(language, cooldown));
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo: `${getAppUrl()}/reset-password`,
  });

  if (error) {
    if (/rate limit/i.test(error.message)) {
      throw new Error(rateLimitMessage(language));
    }
    throw error;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(cooldownKey(trimmedEmail), String(Date.now()));
  }

  return language === "sw"
    ? "Angalia barua pepe yako kwa kiungo cha kubadilisha nenosiri."
    : "Check your email for a link to reset your password.";
}
