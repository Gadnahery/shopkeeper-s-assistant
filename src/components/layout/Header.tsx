import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar as CalendarIcon,
  Menu,
  PanelLeft,
  Plus,
  Search,
  ShieldCheck,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CloudOff,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useIsPlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { PendingSyncDialog } from "@/features/sync";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar, setCollapsed } = useSidebar();
  const { t, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isMobile } = useAdaptiveLayout();
  const { unreadCount } = useNotifications();
  const { data: lowStock } = useLowStockProducts();
  const { data: isPlatformAdmin } = useIsPlatformAdmin();
  const { isOnline, totalCount, isSyncing, failedCount, pendingCount } = useSyncQueue();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const hasAlerts = (unreadCount > 0) || ((lowStock?.length ?? 0) > 0);
  const { formatDate } = useShopFormatting();

  const todayFormatted = formatDate(new Date(), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Get Page Meta from current path
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith("/purchases")) {
      return {
        title: t("nav.purchases"),
        breadcrumb: t("nav.purchases"),
        action: null,
      };
    }
    if (path.startsWith("/production")) {
      return {
        title: t("nav.production"),
        breadcrumb: t("nav.production"),
        action: null,
      };
    }
    if (path.startsWith("/sales")) {
      return {
        title: language === "sw" ? "Historia ya Mauzo" : "Sales History",
        breadcrumb: language === "sw" ? "Historia ya Mauzo" : "Sales History",
        action: null,
      };
    }
    if (path.startsWith("/orders")) {
      return {
        title: language === "sw" ? "Maagizo" : "Orders",
        breadcrumb: language === "sw" ? "Maagizo" : "Orders",
        action: null,
      };
    }
    if (path.startsWith("/inventory")) {
      return {
        title: t("nav.inventory"),
        breadcrumb: t("nav.inventory"),
        action: null,
      };
    }
    if (path.startsWith("/customers")) {
      return {
        title: t("nav.customers"),
        breadcrumb: t("nav.customers"),
        action: null,
      };
    }
    if (path.startsWith("/billing")) {
      return {
        title: language === "sw" ? "Usajili na Malipo" : "Billing & Subscription",
        breadcrumb: language === "sw" ? "Usajili na Malipo" : "Billing & Subscription",
        action: null,
      };
    }
    if (path.startsWith("/expenses")) {
      return {
        title: t("nav.finance"),
        breadcrumb: t("nav.finance"),
        action: null,
      };
    }
    if (path.startsWith("/user-management")) {
      return {
        title: language === "sw" ? "Usimamizi wa Watumiaji" : "User Management",
        breadcrumb: language === "sw" ? "Usimamizi wa Watumiaji" : "User Management",
        action: null,
      };
    }
    if (path.startsWith("/hrm")) {
      return {
        title: t("nav.hrm"),
        breadcrumb: t("nav.hrm"),
        action: null,
      };
    }
    if (path.startsWith("/reports")) {
      return {
        title: t("nav.reports"),
        breadcrumb: t("nav.reports"),
        action: null,
      };
    }
    if (path.startsWith("/settings")) {
      return {
        title: t("nav.settings"),
        breadcrumb: t("nav.settings"),
        action: null,
      };
    }

    if (path.startsWith("/suppliers")) {
      return {
        title: language === "sw" ? "Wasambazaji" : "Suppliers",
        breadcrumb: language === "sw" ? "Wasambazaji" : "Suppliers",
        action: null,
      };
    }
    if (path.startsWith("/recycle-bin")) {
      return {
        title: language === "sw" ? "Jalada la Taka" : "Recycle Bin",
        breadcrumb: language === "sw" ? "Jalada la Taka" : "Recycle Bin",
        action: null,
      };
    }
    if (path.startsWith("/assets")) {
      return {
        title: language === "sw" ? "Usimamizi wa Mali" : "Assets Management",
        breadcrumb: language === "sw" ? "Usimamizi wa Mali" : "Assets Management",
        action: null,
      };
    }
    if (path.startsWith("/categories")) {
      return {
        title: language === "sw" ? "Kategoria za Bidhaa" : "Product Categories",
        breadcrumb: language === "sw" ? "Kategoria za Bidhaa" : "Product Categories",
        action: null,
      };
    }
    if (path.startsWith("/loyalty")) {
      return {
        title: language === "sw" ? "Uaminifu wa Wateja" : "Customer Loyalty",
        breadcrumb: language === "sw" ? "Uaminifu wa Wateja" : "Customer Loyalty",
        action: null,
      };
    }
    if (path.startsWith("/notifications")) {
      return {
        title: language === "sw" ? "Arifa & Taarifa za Duka" : "Notifications & Store Alerts",
        breadcrumb: language === "sw" ? "Arifa & Taarifa za Duka" : "Notifications & Store Alerts",
        action: null,
      };
    }
    if (path.startsWith("/todo")) {
      return {
        title: language === "sw" ? "Orodha ya Kazi" : "To-Do List",
        breadcrumb: language === "sw" ? "Orodha ya Kazi" : "To-Do List",
        action: null,
      };
    }
    if (path.startsWith("/appointments")) {
      return {
        title: language === "sw" ? "Miadi & Ratiba" : "Appointments & Schedule",
        breadcrumb: language === "sw" ? "Miadi & Ratiba" : "Appointments & Schedule",
        action: null,
      };
    }
    if (path.startsWith("/receive-stock")) {
      return {
        title: language === "sw" ? "Pokea Stoki" : "Receive Stock",
        breadcrumb: language === "sw" ? "Pokea Stoki" : "Receive Stock",
        action: null,
      };
    }
    if (path.startsWith("/inventory/add") || path.startsWith("/products/add")) {
      return {
        title: language === "sw" ? "Ongeza Bidhaa Mpya" : "Add New Product",
        breadcrumb: language === "sw" ? "Ongeza Bidhaa Mpya" : "Add New Product",
        action: null,
      };
    }

    // Default: Overview
    return {
      title: t("nav.overview"),
      breadcrumb: t("nav.overview"),
      action: null,
    };
  };

  const pageInfo = getPageInfo();

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search-palette"));
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8 relative">
      {/* ========================================================================= */}
      {/* 1. LEFT SECTION: Sidebar/Menu Toggle + Page Title (Desktop & Mobile)     */}
      {/* ========================================================================= */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 shrink-0 mr-3">
        {/* Desktop Sidebar Toggle Button [ ◫ ] (Image 3) */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex h-9 w-9 shrink-0 rounded-xl border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground transition-all"
          title={language === "sw" ? "Funga/Fungua menyu" : "Toggle Sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        {/* Mobile Menu Trigger Button [ ☰ ] (Image 2) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="flex md:hidden h-9 w-9 shrink-0 rounded-xl text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title: Visible and truncated so it never overlaps the search bar */}
        <h1 className="truncate text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground max-w-[150px] sm:max-w-[180px] lg:max-w-[240px] xl:max-w-[320px]">
          {pageInfo.title}
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP CENTER: Static Search Bar (Image 3)                            */}
      {/* Absolute 50% positioning ensures it NEVER moves across page transitions!  */}
      {/* ========================================================================= */}
      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center pointer-events-auto z-10">
        <button
          type="button"
          onClick={handleOpenSearch}
          className="group relative flex h-9 w-60 lg:w-80 xl:w-96 items-center justify-between rounded-xl border border-border/80 bg-card px-3 text-left text-xs font-normal text-muted-foreground shadow-xs transition-all hover:border-border hover:bg-muted/40 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 active:scale-[0.99]"
          title={language === "sw" ? "Fungua utafutaji (⌘K)" : "Open search (⌘K)"}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors shrink-0" />
            <span className="truncate text-muted-foreground/80 group-hover:text-foreground">
              {language === "sw" ? 'Jaribu "Point of Sale"' : 'Try "Point of Sale"'}
            </span>
          </div>
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded-md border border-border bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE RIGHT: Fixed Search [ 🔍 ] + Theme [ ☼ ] + Bell [ 🔔 ] (Image 2)*/}
      {/* Pinned to the right edge with shrink-0: NEVER moves across page navigations! */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center gap-1.5 shrink-0 ml-auto">
        {/* Mobile Search Button (Image 2 style) */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpenSearch}
          className="h-9 w-9 rounded-xl border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground transition-all active:scale-[0.98]"
          title={language === "sw" ? "Tafuta" : "Search"}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme Toggle Button (Mobile) */}
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => toggleTheme(e)}
          className="h-9 w-9 rounded-xl border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground transition-all"
          title={theme === "dark" ? (language === "sw" ? "Badili kwenda Mandhari ya Mwanga" : "Switch to Light Mode") : (language === "sw" ? "Badili kwenda Mandhari ya Giza" : "Switch to Dark Mode")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-500 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700 dark:text-slate-300 hover:-rotate-12 transition-transform" />
          )}
        </Button>

        {/* Notification Bell (Mobile) */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/notifications")}
          className="relative h-9 w-9 rounded-xl border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
          title={t("nav.notifications")}
        >
          <Bell className="h-4 w-4" />
          {hasAlerts && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 4. DESKTOP RIGHT: Date Pill, Actions, Admin, Sync, Theme, Bell             */}
      {/* Timeline dropdown selector removed to keep navbar and search bar free!    */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center gap-2 sm:gap-2.5 ml-auto shrink-0">
        {/* Date Pill (Desktop) */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs shrink-0">
          <CalendarIcon className="h-3.5 w-3.5 text-accent" />
          <span>{todayFormatted}</span>
        </div>

        {/* Primary Contextual Action Button */}
        {pageInfo.action && (
          <Button
            onClick={pageInfo.action.onClick}
            className="h-9 gap-1.5 rounded-xl bg-neutral-950 px-3 sm:px-4 text-xs font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 transition-all active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-accent" />
            <span className="truncate max-w-[120px] sm:max-w-none">{pageInfo.action.label.replace(/^\+\s*/, "")}</span>
          </Button>
        )}

        {/* Platform Admin Button (Visible only to platform admins) */}
        {isPlatformAdmin && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/platform-admin")}
            className={cn(
              "h-9 w-9 rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary shadow-xs transition-colors",
              location.pathname.startsWith("/platform-admin") && "bg-primary text-primary-foreground border-primary"
            )}
            title="Platform Admin"
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
        )}

        {/* Offline / Pending Sync Indicator Button */}
        {(!isOnline || totalCount > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSyncDialogOpen(true)}
            className={cn(
              "h-9 gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs font-semibold shadow-xs transition-colors",
              failedCount > 0
                ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : isSyncing
                ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                : !isOnline
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            )}
            title={language === "sw" ? "Hali ya mtandao" : "Network status"}
          >
            {failedCount > 0 ? (
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            ) : isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
            ) : !isOnline ? (
              <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-primary shrink-0" />
            )}

            <span className="truncate max-w-[110px] sm:max-w-none">
              {failedCount > 0
                ? `${failedCount} ${language === "sw" ? "hazikufaulu" : "failed"}`
                : isSyncing
                ? (language === "sw" ? "Inasawazisha…" : "Syncing…")
                : totalCount > 0
                ? `${totalCount} ${language === "sw" ? "zinasubiri" : "pending"}`
                : language === "sw"
                ? "Bila mtandao"
                : "Offline"}
            </span>
          </Button>
        )}

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => toggleTheme(e)}
          className="h-9 w-9 rounded-xl border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground transition-all"
          title={theme === "dark" ? (language === "sw" ? "Badili kwenda Mandhari ya Mwanga" : "Switch to Light Mode") : (language === "sw" ? "Badili kwenda Mandhari ya Giza" : "Switch to Dark Mode")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-500 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700 dark:text-slate-300 hover:-rotate-12 transition-transform" />
          )}
        </Button>

        {/* Notification Bell */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/notifications")}
          className="relative h-9 w-9 rounded-xl border-border bg-card text-muted-foreground shadow-xs hover:bg-muted hover:text-foreground"
          title={t("nav.notifications")}
        >
          <Bell className="h-4 w-4" />
          {hasAlerts && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </Button>
      </div>

      <PendingSyncDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen} />
    </header>
  );
}
