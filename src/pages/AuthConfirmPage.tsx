import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type ConfirmState = "verifying" | "success" | "error";

const DEFAULT_NEXT_BY_TYPE: Record<string, string> = {
  recovery: "/reset-password",
  email: "/dashboard",
  signup: "/dashboard",
  invite: "/dashboard",
  email_change: "/settings",
};

export default function AuthConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ConfirmState>("verifying");
  const [message, setMessage] = useState("Verifying your link...");

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "email";
  const next = useMemo(() => {
    const requestedNext = searchParams.get("next");
    if (requestedNext?.startsWith("/")) return requestedNext;
    return DEFAULT_NEXT_BY_TYPE[type] ?? "/dashboard";
  }, [searchParams, type]);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!tokenHash) {
        setState("error");
        setMessage("This confirmation link is missing its verification token.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "recovery" | "invite" | "email_change",
      });

      if (cancelled) return;

      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }

      setState("success");
      setMessage("Your email has been confirmed. Redirecting...");
      window.setTimeout(() => {
        navigate(next, { replace: true });
      }, 1200);
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [navigate, next, tokenHash, type]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_30%)] bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/92 p-8 text-center shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {state === "error" ? (
            <ShieldAlert className="h-8 w-8" />
          ) : state === "success" ? (
            <MailCheck className="h-8 w-8" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin" />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          {state === "error"
            ? "Confirmation failed"
            : state === "success"
              ? "Email confirmed"
              : "Confirming your account"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>

        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/login">Go to login</Link>
          </Button>
          {state === "error" ? (
            <Button asChild className="rounded-2xl">
              <Link to="/signup">Try again</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
