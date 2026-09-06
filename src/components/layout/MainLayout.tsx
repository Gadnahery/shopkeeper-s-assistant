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
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { MobileBottomNav } from "./MobileBottomNav";
import { getShellMeta } from "./app-navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  const { isMobile, isTablet, isDesktop } = useAdaptiveLayout();
  const shellMeta = getShellMeta(location.pathname);
  const sidebarOffset = isDesktop ? (isCollapsed ? 72 : 230) : isTablet ? 72 : 0;
  const showMobileNav = isMobile && shellMeta.showMobileNav;

  return (
    <div className="min-h-screen max-w-full overflow-x-clip bg-background text-foreground">
      <GlobalProgressBar />
      <OfflineBanner />
      <Sidebar />
      <div
        className={cn(
          "min-w-0 max-w-full overflow-x-clip transition-[margin,width] duration-300",
          showMobileNav && "pb-20",
        )}
        style={{
          marginLeft: sidebarOffset,
          width: sidebarOffset > 0 ? `calc(100% - ${sidebarOffset}px)` : "100%",
        }}
      >
        <Header />
        <main
          className={cn(
            "safe-bottom min-h-[calc(100vh-4.5rem)] min-w-0 max-w-full overflow-x-clip px-3 pt-3 sm:px-4 sm:pt-4 lg:px-5 xl:px-6",
            showMobileNav ? "pb-24" : "pb-4 sm:pb-5",
          )}
        >
          <motion.div
            key={location.pathname}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mx-auto min-h-[200px] w-full min-w-0 max-w-[1480px] overflow-x-clip"
          >
            <ErrorBoundary variant="contained" resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>
      {showMobileNav ? <MobileBottomNav /> : null}
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
