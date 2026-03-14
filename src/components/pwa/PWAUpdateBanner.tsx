import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function PWAUpdateBanner() {
  const { language } = useLanguage();
  const { updateAvailable, isUpdating, applyUpdate, dismissUpdate } = usePWAContext();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex justify-center sm:inset-x-auto sm:right-5 sm:w-full sm:max-w-md">
      <div className="pointer-events-auto w-full rounded-3xl border border-primary/20 bg-background/95 p-4 shadow-[0_24px_70px_-28px_hsl(var(--foreground)/0.4)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-primary/10 p-2 text-primary">
            <RefreshCw className={`h-5 w-5 ${isUpdating ? "animate-spin" : ""}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {language === "sw" ? "Toleo jipya linapatikana" : "A new version is ready"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {language === "sw"
                ? "Bofya kusasisha sasa upate maboresho ya hivi karibuni."
                : "Refresh now to load the latest fixes and improvements."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void applyUpdate()} disabled={isUpdating}>
                <RefreshCw className={isUpdating ? "animate-spin" : ""} />
                {language === "sw" ? "Sasisha sasa" : "Refresh now"}
              </Button>
              <Button variant="outline" onClick={dismissUpdate} disabled={isUpdating}>
                {language === "sw" ? "Baadaye" : "Later"}
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground"
            onClick={dismissUpdate}
            disabled={isUpdating}
            aria-label={language === "sw" ? "Ficha ujumbe wa sasisho" : "Dismiss update message"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
