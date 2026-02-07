import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  Receipt, BarChart3, Settings, DollarSign,
  ChevronLeft, ChevronRight, X, UserCog, Building2, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/sales", labelKey: "nav.sales", icon: ShoppingCart },
  { to: "/inventory", labelKey: "nav.inventory", icon: Package },
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
  const { t } = useLanguage();
  const { signOut, profile } = useAuth();
  const isMobile = useIsMobile();

  const shopName = profile?.shops?.name || "Smart Money";

  // Mobile overlay sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {!isCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/50"
              onClick={() => setCollapsed(true)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-60 border-r border-sidebar-border bg-sidebar"
            >
              <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                    <DollarSign className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-semibold text-foreground">{shopName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                <span className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("nav.main")}
                </span>
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setCollapsed(true)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </nav>
              <div className="absolute bottom-4 left-0 right-0 px-3">
                <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-semibold text-foreground truncate"
            >
              {shopName}
            </motion.span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      <nav className="flex flex-col gap-1 p-3">
        {!isCollapsed && (
          <span className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("nav.main")}
          </span>
        )}
        {navItems.map((item) => (
          <Tooltip key={item.to} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-2"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && t(item.labelKey)}
              </NavLink>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="font-medium">
                {t(item.labelKey)}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      <div className="absolute bottom-4 left-0 right-0 px-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 text-destructive hover:text-destructive",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && "Sign Out"}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">Sign Out</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
