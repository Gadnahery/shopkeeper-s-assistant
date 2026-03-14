import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PWAContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  needsManualInstallHint: boolean;
  installHint: string | null;
  updateAvailable: boolean;
  isUpdating: boolean;
  install: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
};

const PWAContext = createContext<PWAContextValue | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsManualInstallHint, setNeedsManualInstallHint] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const languageRef = useRef(language);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isActive = true;

    void import(/* @vite-ignore */ "virtual:pwa-register")
      .then(({ registerSW }) => {
        if (!isActive) {
          return;
        }

        updateSWRef.current = registerSW({
          immediate: true,
          onNeedRefresh() {
            setUpdateAvailable(true);
          },
          onOfflineReady() {
            toast.success(
              languageRef.current === "sw"
                ? "Programu iko tayari kutumika hata bila intaneti."
                : "The app is ready to use offline.",
            );
          },
          onRegisterError(error) {
            console.error("PWA registration failed", error);
          },
        });
      })
      .catch((error: unknown) => {
        console.warn("PWA registration is unavailable in this environment.", error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const isNavigatorStandalone = typeof navigator !== "undefined" && "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|android/.test(userAgent);

    const updateStandalone = () => {
      const standalone = standaloneMedia.matches || isNavigatorStandalone;
      setIsStandalone(standalone);
      setIsInstalled(standalone);
      setNeedsManualInstallHint(isIOS && isSafari && !standalone);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      toast.success(language === "sw" ? "Programu imewekwa kwenye kifaa chako." : "The app has been installed on your device.");
    };

    updateStandalone();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    standaloneMedia.addEventListener("change", updateStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      standaloneMedia.removeEventListener("change", updateStandalone);
    };
  }, [language]);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      if (needsManualInstallHint) {
        toast.message(
          language === "sw"
            ? "Fungua Share menu kisha chagua 'Add to Home Screen'."
            : "Open the Share menu and choose 'Add to Home Screen'.",
        );
      } else if (!isInstalled) {
        toast.message(
          language === "sw"
            ? "Tumia menyu ya browser yako kisha chagua 'Install app' au 'Add to Home Screen'."
            : "Use your browser menu and choose 'Install app' or 'Add to Home Screen'.",
        );
      }
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  }, [deferredPrompt, isInstalled, language, needsManualInstallHint]);

  const applyUpdate = useCallback(async () => {
    if (!updateSWRef.current) {
      return;
    }

    setIsUpdating(true);

    try {
      await updateSWRef.current(true);
    } catch (error) {
      console.error("Failed to apply app update", error);
      setIsUpdating(false);
      toast.error(
        language === "sw"
          ? "Imeshindikana kusasisha programu. Jaribu tena."
          : "Failed to update the app. Please try again.",
      );
    }
  }, [language]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  const value = useMemo(
    () => ({
      canInstall: Boolean(deferredPrompt) && !isInstalled,
      isInstalled,
      isStandalone,
      needsManualInstallHint,
      installHint: needsManualInstallHint
        ? language === "sw"
          ? "Kwa iPhone au iPad, fungua Share menu kisha chagua 'Add to Home Screen'."
          : "On iPhone or iPad, open the Share menu and choose 'Add to Home Screen'."
        : null,
      updateAvailable,
      isUpdating,
      install,
      applyUpdate,
      dismissUpdate,
    }),
    [
      deferredPrompt,
      install,
      isInstalled,
      isStandalone,
      language,
      needsManualInstallHint,
      updateAvailable,
      isUpdating,
      applyUpdate,
      dismissUpdate,
    ],
  );

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWAContext() {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    throw new Error("usePWAContext must be used inside PWAProvider");
  }
  return ctx;
}
