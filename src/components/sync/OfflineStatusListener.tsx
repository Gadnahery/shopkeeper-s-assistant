import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSyncQueue } from "@/hooks/useSyncQueue";

/**
 * Non-intrusive offline / sync feedback (toasts only).
 * Mount once inside the authenticated app shell.
 */
export function OfflineStatusListener() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const { isOnline, isSyncing, totalCount, syncNow } = useSyncQueue();
  const wasOnline = useRef(isOnline);
  const wasSyncing = useRef(isSyncing);
  const boot = useRef(true);

  // Online / offline transitions
  useEffect(() => {
    if (boot.current) {
      boot.current = false;
      wasOnline.current = isOnline;
      return;
    }

    if (isOnline && !wasOnline.current) {
      toast.success(isSw ? "Umerudi mtandaoni" : "Back online", {
        description: isSw
          ? "Mabadiliko yatasawazishwa kiotomatiki."
          : "Changes will sync automatically.",
        duration: 3000,
      });
      void syncNow();
    } else if (!isOnline && wasOnline.current) {
      toast.message(isSw ? "Bila mtandao" : "You're offline", {
        description: isSw
          ? "Unaweza kuendelea kuuza. Mauzo yatahifadhiwa kwenye kifaa hiki."
          : "You can keep selling. Sales are saved on this device.",
        duration: 4000,
      });
    }

    wasOnline.current = isOnline;
  }, [isOnline, isSw, syncNow]);

  // Syncing started
  useEffect(() => {
    if (isSyncing && !wasSyncing.current && totalCount > 0) {
      toast.message(isSw ? "Inasawazisha…" : "Syncing…", {
        description:
          totalCount === 1
            ? isSw
              ? "Kipengele 1"
              : "1 item"
            : isSw
              ? `Vipengele ${totalCount}`
              : `${totalCount} items`,
        duration: 2000,
      });
    }
    wasSyncing.current = isSyncing;
  }, [isSyncing, totalCount, isSw]);

  return null;
}
