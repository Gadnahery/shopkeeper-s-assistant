import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationContextValue = {
  unreadCount: number;
  isLoading: boolean;
  permission: NotificationPermission | "unsupported";
  supportsNativeNotifications: boolean;
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

type AppNotification = {
  id: string;
  title: string;
  message?: string | null;
  created_at: string;
  read_at?: string | null;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { unreadCount, isLoading, data } = useNotifications();
  const supportsNativeNotifications = typeof window !== "undefined" && "Notification" in window;
  const permission = supportsNativeNotifications ? Notification.permission : "unsupported";
  const seenIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedRef = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!supportsNativeNotifications) {
      return "unsupported" as const;
    }

    return Notification.requestPermission();
  }, [supportsNativeNotifications]);

  useEffect(() => {
    if (!data?.length) {
      return;
    }

    const notifications = data as AppNotification[];

    if (!hasHydratedRef.current) {
      notifications.forEach((entry) => seenIdsRef.current.add(entry.id));
      hasHydratedRef.current = true;
      return;
    }

    if (!supportsNativeNotifications || permission !== "granted") {
      notifications.forEach((entry) => seenIdsRef.current.add(entry.id));
      return;
    }

    const unreadNewItems = notifications.filter((entry) => !entry.read_at && !seenIdsRef.current.has(entry.id));
    unreadNewItems.forEach((entry) => seenIdsRef.current.add(entry.id));

    if (unreadNewItems.length === 0 || document.visibilityState === "visible") {
      return;
    }

    if ("serviceWorker" in navigator) {
      return;
    }

    unreadNewItems.forEach(async (entry) => {
      const options: NotificationOptions = {
        body: entry.message || "",
        tag: `smart-money-${entry.id}`,
        badge: "/badge-96.png",
        icon: "/icon-192.png",
        renotify: false,
        data: { href: "/notifications" },
      };

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(entry.title, options);
          return;
        }
      }

      const notification = new Notification(entry.title, options);
      notification.onclick = () => {
        window.focus();
        window.location.href = "/notifications";
      };
    });
  }, [data, permission, supportsNativeNotifications]);

  const value = useMemo(
    () => ({
      unreadCount,
      isLoading,
      permission,
      supportsNativeNotifications,
      requestPermission,
    }),
    [unreadCount, isLoading, permission, supportsNativeNotifications, requestPermission],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext must be used inside NotificationProvider");
  }
  return ctx;
}
