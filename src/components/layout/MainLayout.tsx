import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2, WifiOff } from "lucide-react";

function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const { language } = useLanguage();
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/90 text-amber-950 px-4 py-1.5 text-sm font-medium">
      <WifiOff className="h-4 w-4" />
      {language === "sw" ? "Hauna muunganisho. Data itahifadhiwa inapounganishwa tena." : "You're offline. Data will sync when you reconnect."}
    </div>
  );
}

function LayoutContent() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "md:ml-[68px]" : "md:ml-56",
          "ml-0" // mobile: no margin
        )}
      >
        <Header />
        <main className="p-4 md:p-6 lg:p-6 min-h-[calc(100vh-3.5rem)]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={window.location.pathname}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
