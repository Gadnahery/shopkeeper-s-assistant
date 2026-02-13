import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingOrdersCount } from "@/hooks/useOrders";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  Receipt, BarChart3, Settings, Store,
  ChevronLeft, ChevronRight, X, UserCog, Building2, LogOut, Tags, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/sales", labelKey: "nav.sales", icon: ShoppingCart },
  { to: "/inventory", labelKey: "nav.inventory", icon: Package },
  { to: "/categories", labelKey: "nav.categories", icon: Tags },
  { to: "/orders", labelKey: "nav.orders", icon: ClipboardList },
  { to: "/customers", labelKey: "nav.customers", icon: Users },
  { to: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
  { to: "/expenses", labelKey: "nav.expenses", icon: Receipt },
  { to: "/hrm", labelKey: "nav.hrm", icon: UserCog },
  { to: "/assets", labelKey: "nav.assets", icon: Building2 },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function Sidebar() {
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar();
  const { t, language } = useLanguage();
  const { signOut, profile } = useAuth();
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
  const isMobile = useIsMobile();

  const shopName = profile?.shops?.name || "Smart Money";

  if (isMobile) {
    return (
      <AnimatePresence>
        {!isCollapsed && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/50" onClick={() => setCollapsed(true)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
              <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                    <Store className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-base font-bold text-foreground truncate">{shopName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <span className="mb-2 block px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600 dark:text-muted-foreground">
                  {t("nav.main")}
                </span>
                {navItems.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => setCollapsed(true)}
                    className={({ isActive }) => cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sidebar-nav-link",
                      isActive ? "bg-primary !text-primary-foreground shadow-sm" : "!text-gray-900 hover:bg-sidebar-accent hover:!text-accent-foreground dark:!text-foreground dark:hover:!text-sidebar-accent-foreground"
                    )}>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {t(item.labelKey)}
                    {item.to === "/orders" && pendingOrdersCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">{pendingOrdersCount}</Badge>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="border-t border-sidebar-border p-3">
                <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                  {language === "sw" ? "Toka" : "Sign Out"}
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside className={cn("fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300", isCollapsed ? "w-[68px]" : "w-60")}>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              className="text-base font-bold text-foreground truncate">{shopName}</motion.span>
          )}
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted">
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {!isCollapsed && (
          <span className="mb-2 block px-3 pt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600 dark:text-muted-foreground">
            {t("nav.main")}
          </span>
        )}
        {navItems.map((item) => (
          <Tooltip key={item.to} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sidebar-nav-link",
                  isActive ? "bg-primary !text-primary-foreground shadow-sm" : "!text-gray-900 hover:bg-sidebar-accent hover:!text-accent-foreground dark:!text-foreground dark:hover:!text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    {t(item.labelKey)}
                    {item.to === "/orders" && pendingOrdersCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">{pendingOrdersCount}</Badge>
                    )}
                  </>
                )}
              </NavLink>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right" className="font-medium">{t(item.labelKey)}</TooltipContent>}
          </Tooltip>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" className={cn("w-full gap-3 text-destructive hover:text-destructive", isCollapsed ? "justify-center px-2" : "justify-start")} onClick={signOut}>
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (language === "sw" ? "Toka" : "Sign Out")}
            </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{language === "sw" ? "Toka" : "Sign Out"}</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}
