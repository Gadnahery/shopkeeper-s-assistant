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
import { SubscriptionGraceBanner } from "@/components/subscription/SubscriptionGraceBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PendingSyncDialog } from "@/components/sync/PendingSyncDialog";
import { useSyncQueue } from "@/hooks/useSyncQueue";

function OfflineBanner() {
  const { isOnline, totalCount, pendingCount, failedCount } = useSyncQueue();
  const { language } = useLanguage();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  if (isOnline && totalCount === 0) return null;

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors",
          !isOnline
            ? "bg-amber-500/90 text-amber-950"
            : failedCount > 0
            ? "bg-rose-500/90 text-white"
            : "bg-blue-600/90 text-white"
        )}
      >
        {!isOnline ? (
          <WifiOff className="h-4 w-4 shrink-0" />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        )}
        <span>
          {!isOnline ? (
            totalCount > 0 ? (
              language === "sw"
                ? `Hauna muunganisho. Mauzo ${totalCount} yamehifadhiwa bila mtandao na yatasawazishwa kiotomatiki.`
                : `You're offline. ${totalCount} sale(s) saved locally and will sync automatically.`
            ) : (
              language === "sw"
                ? "Hauna muunganisho. Mauzo ya POS yatahifadhiwa bila mtandao."
                : "You're offline. POS sales will be saved locally."
            )
          ) : (
            language === "sw"
              ? `Mauzo ${totalCount} yanatunzwa na kusawazishwa na seva sasa...`
              : `${totalCount} offline sale(s) syncing with server...`
          )}
        </span>
        {totalCount > 0 && (
          <button
            type="button"
            onClick={() => setSyncDialogOpen(true)}
            className="underline underline-offset-2 ml-1 font-bold hover:opacity-80 transition-opacity"
          >
            {language === "sw" ? "Tazama Foleni" : "View Queue"}
          </button>
        )}
      </div>

      <PendingSyncDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} />
    </>
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
        <SubscriptionGraceBanner />
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
