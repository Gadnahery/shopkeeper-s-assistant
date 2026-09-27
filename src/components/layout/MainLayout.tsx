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
import { FreeTrialWelcomeDialog } from "@/components/subscription/FreeTrialWelcomeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PendingSyncDialog } from "@/features/sync";
import { OfflineStatusListener } from "@/features/sync";
import { useSyncQueue } from "@/hooks/useSyncQueue";

function OfflineBanner() {
  const { isOnline, totalCount, isSyncing, failedCount } = useSyncQueue();
  const { language } = useLanguage();
  const isSw = language === "sw";
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  if (isOnline && totalCount === 0) return null;

  const message = !isOnline
    ? totalCount > 0
      ? isSw
        ? `Bila mtandao · ${totalCount} zimehifadhiwa kwenye kifaa`
        : `Offline · ${totalCount} saved on this device`
      : isSw
        ? "Bila mtandao · unaweza kuendelea kuuza"
        : "Offline · you can keep selling"
    : failedCount > 0
      ? isSw
        ? `${failedCount} hazikufaulu kusawazisha`
        : `${failedCount} failed to sync`
      : isSyncing
        ? isSw
          ? "Inasawazisha…"
          : "Syncing…"
        : isSw
          ? `${totalCount} zinasubiri kusawazishwa`
          : `${totalCount} waiting to sync`;

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-2 border-b px-4 py-1.5 text-xs font-medium sm:text-sm",
          !isOnline
            ? "border-amber-500/20 bg-amber-500/15 text-amber-900 dark:text-amber-200"
            : failedCount > 0
            ? "border-destructive/20 bg-destructive/10 text-destructive"
            : "border-border bg-muted/80 text-foreground",
        )}
      >
        {!isOnline ? (
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Loader2 className={cn("h-3.5 w-3.5 shrink-0", isSyncing && "animate-spin")} />
        )}
        <span>{message}</span>
        {totalCount > 0 && (
          <button
            type="button"
            onClick={() => setSyncDialogOpen(true)}
            className="ml-1 font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {isSw ? "Angalia" : "View"}
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
      <OfflineStatusListener />
      <GlobalProgressBar />
      <OfflineBanner />
      <Sidebar />
      <div
        className={cn(
          "min-w-0 max-w-full overflow-x-clip transition-[margin,width] duration-300",
          showMobileNav && "pb-28",
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
            showMobileNav ? "pb-28" : "pb-4 sm:pb-5",
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
        <FreeTrialWelcomeDialog />
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
