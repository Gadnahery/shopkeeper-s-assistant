import { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationContextValue = {
  unreadCount: number;
  isLoading: boolean;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { unreadCount, isLoading } = useNotifications();
  return (
    <NotificationContext.Provider value={{ unreadCount, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used inside NotificationProvider");
  return ctx;
}
