import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GlobalProgressBar } from "@/components/GlobalProgressBar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2, WifiOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const location = useLocation();

  return (
    <div className="min-h-screen max-w-full overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_top_right,hsl(var(--accent-foreground)/0.08),transparent_28%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.08),transparent_28%)]" />
      <GlobalProgressBar />
      <OfflineBanner />
      <Sidebar />
      <div
        className={cn(
          "w-full min-w-0 max-w-full overflow-x-clip transition-[margin] duration-300",
          isCollapsed ? "md:ml-[78px]" : "md:ml-[250px]",
          "ml-0"
        )}
      >
        <Header />
        <main className="safe-bottom min-h-[calc(100vh-4.5rem)] min-w-0 max-w-full overflow-x-clip px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4 lg:px-5 xl:px-6">
          <motion.div
            key={location.pathname}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mx-auto min-h-[200px] w-full min-w-0 max-w-[1480px] overflow-x-clip"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export function MainLayout() {
  const { user, loading, sessionExpired } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <>
        <LayoutContent />
        <AlertDialog open={sessionExpired}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Session expired</AlertDialogTitle>
              <AlertDialogDescription>
                Your session expired. Please log in again to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => (window.location.href = "/login")}>
                Go to login
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </SidebarProvider>
  );
}
