import { Download, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function PWAUpdateBanner() {
  const { language } = useLanguage();
  const {
    canInstall,
    install,
    installHint,
    isInstalled,
    updateAvailable,
    isUpdating,
    applyUpdate,
    dismissUpdate,
  } = usePWAContext();
  const [installDismissed, setInstallDismissed] = useState(false);

  const showInstallPrompt = !updateAvailable && !isInstalled && !installDismissed && (canInstall || Boolean(installHint));

  if (!updateAvailable && !showInstallPrompt) {
    return null;
  }

  const isInstallMode = showInstallPrompt;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex justify-center md:inset-x-auto md:right-5 md:top-20 md:bottom-auto md:w-full md:max-w-md">
      <div className="pointer-events-auto w-full rounded-3xl border border-primary/20 bg-background/95 p-4 shadow-[0_24px_70px_-28px_hsl(var(--foreground)/0.4)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-primary/10 p-2 text-primary">
            {isInstallMode ? (
              <Download className="h-5 w-5" />
            ) : (
              <RefreshCw className={`h-5 w-5 ${isUpdating ? "animate-spin" : ""}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {isInstallMode
                ? language === "sw"
                  ? "Sakinisha WiseCash"
                  : "Install WiseCash"
                : language === "sw"
                  ? "Toleo jipya linapatikana"
                  : "A new version is ready"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isInstallMode
                ? installHint ??
                  (language === "sw"
                    ? "Weka app kwenye simu au kompyuta yako kwa ufunguaji wa haraka na matumizi bora zaidi."
                    : "Install the app on your phone or computer for faster launch and a better full-screen experience.")
                : language === "sw"
                  ? "Bofya kusasisha sasa upate maboresho ya hivi karibuni."
                  : "Refresh now to load the latest fixes and improvements."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {isInstallMode ? (
                <>
                  <Button onClick={() => void install()}>
                    <Download className="h-4 w-4" />
                    {language === "sw" ? "Sakinisha app" : "Install app"}
                  </Button>
                  <Button variant="outline" onClick={() => setInstallDismissed(true)}>
                    {language === "sw" ? "Baadaye" : "Later"}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => void applyUpdate()} disabled={isUpdating}>
                    <RefreshCw className={isUpdating ? "animate-spin" : ""} />
                    {language === "sw" ? "Sasisha sasa" : "Refresh now"}
                  </Button>
                  <Button variant="outline" onClick={dismissUpdate} disabled={isUpdating}>
                    {language === "sw" ? "Baadaye" : "Later"}
                  </Button>
                </>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground"
            onClick={isInstallMode ? () => setInstallDismissed(true) : dismissUpdate}
            disabled={!isInstallMode && isUpdating}
            aria-label={
              isInstallMode
                ? language === "sw"
                  ? "Ficha ujumbe wa usakinishaji"
                  : "Dismiss install message"
                : language === "sw"
                  ? "Ficha ujumbe wa sasisho"
                  : "Dismiss update message"
            }
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
