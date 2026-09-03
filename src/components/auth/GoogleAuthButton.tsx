import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Language } from "@/contexts/LanguageContext";

export type GoogleAuthButtonProps = {
  loading?: boolean;
  onClick: () => void;
  className?: string;
  label?: string;
  mode?: "login" | "signup";
  language?: Language;
  disabled?: boolean;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.32-2.05 3.03l3.32 2.58C20.7 17.93 21.75 15.3 21.75 12c0-.62-.06-1.22-.17-1.8H12Z" />
      <path fill="#34A853" d="M12 21.75c2.7 0 4.96-.89 6.62-2.41l-3.32-2.58c-.92.62-2.1.99-3.3.99-2.54 0-4.7-1.71-5.47-4.02l-3.43 2.64C4.74 19.6 8.09 21.75 12 21.75Z" />
      <path fill="#4A90E2" d="M6.53 13.73c-.19-.62-.3-1.28-.3-1.95s.11-1.33.3-1.95L3.1 7.19C2.39 8.61 2 10.26 2 11.78s.39 3.17 1.1 4.59l3.43-2.64Z" />
      <path fill="#FBBC05" d="M12 5.81c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.83 14.69 2 12 2 8.09 2 4.74 4.15 3.1 7.19l3.43 2.64C7.3 7.52 9.46 5.81 12 5.81Z" />
    </svg>
  );
}

export function GoogleAuthButton({
  loading = false,
  onClick,
  className,
  label,
  mode = "login",
  language = "sw",
  disabled = false,
}: GoogleAuthButtonProps) {
  const displayLabel =
    label ||
    (mode === "login"
      ? language === "sw"
        ? "Ingia na Google"
        : "Sign in with Google"
      : language === "sw"
      ? "Jisajili na Google"
      : "Sign up with Google");

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-10 w-full rounded-xl border-border bg-background text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors shadow-xs",
        className,
      )}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
      <span className="ml-2">{displayLabel}</span>
    </Button>
  );
}
