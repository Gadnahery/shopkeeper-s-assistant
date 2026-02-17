import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-border bg-gradient-to-br from-slate-100 via-teal-50/30 to-blue-50/40 py-12 dark:from-neutral-900 dark:via-teal-950/20 dark:to-blue-950/20">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-500/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl dark:bg-blue-500/10" />
      <div className="container relative mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Smart Money</span>
          </Link>
          <div className="flex gap-8">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              {language === "sw" ? "Ingia" : "Login"}
            </Link>
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground">
              {language === "sw" ? "Jisajili" : "Signup"}
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2026 Smart Money. {language === "sw" ? "Haki zote zimehifadhiwa." : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
