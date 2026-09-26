import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "wisecash_cookie_notice_dismissed";

/**
 * Simple, honest local-storage notice.
 * WiseCash stores functional data only (language, auth session, offline sync queue).
 * If analytics/tracking is added later, this must become a real accept/reject choice.
 */
export function CookieConsentBanner() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  const isSw = language === "sw";

  return (
    <div
      role="region"
      aria-label={isSw ? "Ilani ya hifadhi ya ndani" : "Local storage notice"}
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-lg px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {isSw
            ? "WiseCash hutumia hifadhi ya ndani kukuweka umeingia, kukumbuka lugha, na kuruhusu app ifanye kazi bila mtandao."
            : "WiseCash uses local storage to keep you signed in, remember your language, and let the app work offline."}{" "}
          <Link
            to="/privacy-policy"
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            {isSw ? "Soma zaidi →" : "Learn more →"}
          </Link>
        </p>
        <Button
          size="sm"
          onClick={dismiss}
          className="shrink-0 rounded-xl h-9 px-4 text-xs font-bold"
        >
          {isSw ? "Nimeelewa" : "Got it"}
        </Button>
      </div>
    </div>
  );
}
