import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  Menu,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
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
  const { isMobile } = useAdaptiveLayout();
  const { unreadCount } = useNotifications();
  const { data: lowStock } = useLowStockProducts();
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

    // Default: Overview
    return {
      title: t("nav.overview"),
      breadcrumb: t("nav.overview"),
      showPeriod: true,
      action: {
        label: t("quick.newSale"),
        onClick: () => navigate("/sales"),
      },
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
    </header>
  );
}
