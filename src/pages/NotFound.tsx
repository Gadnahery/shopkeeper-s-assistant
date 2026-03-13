import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.warn("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_38%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.25))] p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35" />
      <div className="relative w-full max-w-2xl rounded-[2rem] border border-border/70 bg-card/85 p-8 text-center shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {language === "sw" ? "Ukurasa haukupatikana" : "Page not found"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          {language === "sw"
            ? "Kiungo ulichojaribu kufungua huenda kimehamishwa, kufutwa, au hakipo tena."
            : "The page you tried to open may have moved, been deleted, or never existed."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              {language === "sw" ? "Rudi kwenye dashibodi" : "Back to dashboard"}
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {language === "sw" ? "Rudi nyumbani" : "Go home"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
