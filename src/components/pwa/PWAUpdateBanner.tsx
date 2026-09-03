import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function PWAUpdateBanner() {
  const { language } = useLanguage();
  const {
    updateAvailable,
    isUpdating,
    applyUpdate,
    dismissUpdate,
  } = usePWAContext();

  // Only render when an actual new code update is ready, never annoy with install prompts
  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex justify-center md:inset-x-auto md:right-5 md:top-20 md:bottom-auto md:w-full md:max-w-md">
      <div className="pointer-events-auto w-full rounded-3xl border p-4 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl border-blue-500/18 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--card)/0.92))]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400">
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
              <Button onClick={() => void applyUpdate()} disabled={isUpdating} className="h-8 rounded-xl text-xs">
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isUpdating ? "animate-spin" : ""}`} />
                {language === "sw" ? "Sasisha sasa" : "Refresh now"}
              </Button>
              <Button variant="outline" onClick={dismissUpdate} disabled={isUpdating} className="h-8 rounded-xl text-xs">
                {language === "sw" ? "Baadaye" : "Later"}
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
            onClick={dismissUpdate}
            disabled={isUpdating}
            aria-label={language === "sw" ? "Funga" : "Close"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
