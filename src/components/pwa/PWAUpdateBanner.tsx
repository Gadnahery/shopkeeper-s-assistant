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
      <div
        className={`pointer-events-auto w-full rounded-3xl border p-4 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl ${
          isInstallMode
            ? "border-primary/18 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--card)/0.92))]"
            : "border-blue-500/18 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--card)/0.92))]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-2xl p-2 ${isInstallMode ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
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
            <div className="mt-3 rounded-2xl border border-border/70 bg-background/72 px-3 py-2 text-xs text-muted-foreground">
              {isInstallMode
                ? language === "sw"
                  ? "App ikisakinishwa itafunguka haraka na kuonekana vizuri zaidi kwenye simu."
                  : "Installing the app makes launch faster and gives a cleaner full-screen mobile experience."
                : language === "sw"
                  ? "Sasisho hili lina maboresho ya muonekano na utendaji."
                  : "This update includes visual and performance improvements."}
            </div>
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
