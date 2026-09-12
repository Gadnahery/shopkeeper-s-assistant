import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  Menu,
  Plus,
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
import { PendingSyncDialog } from "@/components/sync/PendingSyncDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCollapsed } = useSidebar();
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");

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
        showPeriod: true,
        action: {
          label: t("purchases.newPurchase"),
          onClick: () => {
            window.dispatchEvent(new CustomEvent("open-new-purchase"));
            if (location.pathname !== "/purchases") navigate("/purchases?new=true");
          },
        },
      };
    }
    if (path.startsWith("/production")) {
      return {
        title: t("nav.production"),
        breadcrumb: t("nav.production"),
        showPeriod: true,
        action: {
          label: t("production.newRun"),
          onClick: () => {
            window.dispatchEvent(new CustomEvent("open-new-production"));
            if (location.pathname !== "/production") navigate("/production?new=true");
          },
        },
      };
    }
    if (path.startsWith("/sales")) {
      return {
        title: t("nav.sales"),
        breadcrumb: t("nav.sales"),
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/orders")) {
      return {
        title: language === "sw" ? "Maagizo" : "Orders",
        breadcrumb: language === "sw" ? "Maagizo" : "Orders",
        showPeriod: true,
        action: {
          label: language === "sw" ? "+ Ongeza Agizo" : "+ Add Order",
          onClick: () => {
            window.dispatchEvent(new CustomEvent("open-new-order"));
            if (location.pathname !== "/orders") navigate("/orders?new=true");
          },
        },
      };
    }
    if (path.startsWith("/inventory")) {
      return {
        title: t("nav.inventory"),
        breadcrumb: t("nav.inventory"),
        showPeriod: false,
        action: {
          label: `+ ${t("inventory.addProduct")}`,
          onClick: () => {
            if (location.pathname === "/inventory") {
              navigate("/inventory?new=true");
            } else {
              navigate("/inventory?new=true");
            }
          },
        },
      };
    }
    if (path.startsWith("/customers")) {
      return {
        title: t("nav.customers"),
        breadcrumb: t("nav.customers"),
        showPeriod: false,
        action: {
          label: `+ ${t("customers.addCustomer")}`,
          onClick: () => navigate("/customers?new=true"),
        },
      };
    }
    if (path.startsWith("/expenses") || path.startsWith("/billing")) {
      return {
        title: t("nav.finance"),
        breadcrumb: t("nav.finance"),
        showPeriod: true,
        action: {
          label: `+ ${t("expenses.addNewExpense")}`,
          onClick: () => navigate("/expenses?new=true"),
        },
      };
    }
    if (path.startsWith("/hrm") || path.startsWith("/user-management")) {
      return {
        title: t("nav.hrm"),
        breadcrumb: t("nav.hrm"),
        showPeriod: false,
        action: {
          label: language === "sw" ? "+ Ongeza Mfanyakazi" : "+ Add Employee",
          onClick: () => navigate("/hrm?new=true"),
        },
      };
    }
    if (path.startsWith("/reports")) {
      return {
        title: t("nav.reports"),
        breadcrumb: t("nav.reports"),
        showPeriod: true,
        action: null,
      };
    }
    if (path.startsWith("/settings")) {
      return {
        title: t("nav.settings"),
        breadcrumb: t("nav.settings"),
        showPeriod: false,
        action: null,
      };
    }

    if (path.startsWith("/suppliers")) {
      return {
        title: language === "sw" ? "Wasambazaji" : "Suppliers",
        breadcrumb: language === "sw" ? "Wasambazaji" : "Suppliers",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/recycle-bin")) {
      return {
        title: language === "sw" ? "Jalala" : "Recycle Bin",
        breadcrumb: language === "sw" ? "Jalala" : "Recycle Bin",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/assets")) {
      return {
        title: language === "sw" ? "Rasilimali" : "Assets",
        breadcrumb: language === "sw" ? "Rasilimali" : "Assets",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/categories")) {
      return {
        title: language === "sw" ? "Makundi" : "Categories",
        breadcrumb: language === "sw" ? "Makundi" : "Categories",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/loyalty")) {
      return {
        title: language === "sw" ? "Uaminifu" : "Loyalty",
        breadcrumb: language === "sw" ? "Uaminifu" : "Loyalty",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/notifications")) {
      return {
        title: language === "sw" ? "Taarifa" : "Notifications",
        breadcrumb: language === "sw" ? "Taarifa" : "Notifications",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/todo")) {
      return {
        title: language === "sw" ? "Mambo ya Kufanya" : "Todo",
        breadcrumb: language === "sw" ? "Mambo ya Kufanya" : "Todo",
        showPeriod: false,
        action: null,
      };
    }
    if (path.startsWith("/appointments")) {
      return {
        title: language === "sw" ? "Miadi" : "Appointments",
        breadcrumb: language === "sw" ? "Miadi" : "Appointments",
        showPeriod: false,
        action: null,
      };
    }

    // Default: Overview
    return {
      title: t("nav.overview"),
      breadcrumb: t("nav.overview"),
      showPeriod: false,
      action: null,
    };
  };

  const pageInfo = getPageInfo();

  const periodLabels: Record<string, string> = {
    today: t("header.today"),
    week: t("header.thisWeek"),
    month: t("header.thisMonth"),
    year: t("header.thisYear"),
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] w-full items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile trigger, Title & Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-9 w-9 shrink-0 rounded-xl text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl leading-none">
            {pageInfo.title}
          </h1>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {t("header.home")} &gt; {pageInfo.breadcrumb}
          </p>
        </div>
      </div>

      {/* Right: Date pill, Period selector, Contextual Action, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Pill (Desktop) */}
        <div className="hidden items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs md:flex">
          <CalendarIcon className="h-3.5 w-3.5 text-accent" />
          <span>{todayFormatted}</span>
        </div>

        {/* Period Dropdown (where relevant) */}
        {pageInfo.showPeriod && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-border bg-card px-3 text-xs font-medium text-foreground shadow-xs hover:bg-muted"
              >
                <span>{periodLabels[selectedPeriod] || t("header.today")}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl border-border bg-popover shadow-md">
              <DropdownMenuItem onClick={() => setSelectedPeriod("today")} className="text-xs">
                {t("header.today")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("week")} className="text-xs">
                {t("header.thisWeek")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("month")} className="text-xs">
                {t("header.thisMonth")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("year")} className="text-xs">
                {t("header.thisYear")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
            title={language === "sw" ? "Msururu wa Usawazishaji" : "Pending Sync Queue"}
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

            <span className="truncate max-w-[100px] sm:max-w-none">
              {failedCount > 0
                ? `${failedCount} ${language === "sw" ? "Imeshindwa" : "Failed"}`
                : isSyncing
                ? `${totalCount} ${language === "sw" ? "Inasawazisha..." : "Syncing..."}`
                : totalCount > 0
                ? `${totalCount} ${language === "sw" ? "Zinasubiri" : "Pending"}`
                : language === "sw"
                ? "Bila Mtandao"
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
