import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { useTheme } from "@/hooks/useTheme";
import { usePendingOrdersCount } from "@/hooks/useOrders";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  Receipt, BarChart3, Settings, Store,
  ChevronLeft, ChevronRight, X, UserCog, Building2, LogOut, Tags, ClipboardList,
  CheckSquare, UserPlus, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

const OPERATIONS = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/sales", labelKey: "nav.sales", icon: ShoppingCart },
  { to: "/inventory", labelKey: "nav.inventory", icon: Package },
  { to: "/categories", labelKey: "nav.categories", icon: Tags },
  { to: "/orders", labelKey: "nav.orders", icon: ClipboardList },
  { to: "/todo", labelKey: "nav.todo", icon: CheckSquare },
];

const MANAGEMENT = [
  { to: "/customers", labelKey: "nav.customers", icon: Users },
  { to: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
  { to: "/expenses", labelKey: "nav.expenses", icon: Receipt },
  { to: "/hrm", labelKey: "nav.hrm", icon: UserCog },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { to: "/loyalty", labelKey: "nav.loyalty", icon: Gift },
];

const ADMIN = [
  { to: "/user-management", labelKey: "nav.userManagement", icon: UserPlus },
  { to: "/assets", labelKey: "nav.assets", icon: Building2 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

const SECTION_HEADERS = {
  operations: "Operations",
  management: "Management",
  admin: "Admin",
};

const SECTION_HEADERS_SW = {
  operations: "Operesheni",
  management: "Usimamizi",
  admin: "Msimamizi",
};

function NavSection({
  title,
  items,
  t,
  language,
  pendingOrdersCount,
  isCollapsed,
  isLightTheme,
}: {
  title: string;
  items: typeof OPERATIONS;
  t: (k: string) => string;
  language: string;
  pendingOrdersCount: number;
  isCollapsed: boolean;
  isLightTheme: boolean;
}) {
  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties =>
    isActive ? { color: "white" } : isLightTheme ? { color: "#1f2937" } : { color: "#f3f4f6" };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[background-color,color] duration-150 ease-out [&_svg]:text-inherit",
      "hover:bg-[#10B981] hover:text-white dark:hover:bg-[#10B981] dark:hover:shadow-[0_0_8px_rgba(16,185,129,0.3)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      isActive && "bg-[#10B981] text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.4)]",
      isCollapsed && "justify-center px-2"
    );

  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <span
          className="mb-1.5 block px-3 pt-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: isLightTheme ? "#1f2937" : "#f3f4f6" }}
        >
          {title}
        </span>
      )}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navLinkClass}
          style={navLinkStyle}
        >
          {({ isActive }) => {
            const iconColor = isActive ? "#ffffff" : isLightTheme ? "#1f2937" : "#f3f4f6";
            return (
            <span
              className="flex items-center gap-3 w-full min-w-0"
              style={{ color: "inherit" }}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-white" />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150",
                  isActive && "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                )}
                strokeWidth={isActive ? 2 : 1.5}
                style={{ color: iconColor, stroke: iconColor }}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{t(item.labelKey)}</span>
                  {item.to === "/orders" && pendingOrdersCount > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                      {pendingOrdersCount}
                    </Badge>
                  )}
                </>
              )}
            </span>
            );
          }}
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar();
  const { t, language } = useLanguage();
  const { signOut, profile } = useAuth();
  const { theme } = useTheme();
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
  const isMobile = useIsMobile();
  const isLightTheme = theme === "light";
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const shopName = profile?.shops?.name || "Smart Money";
  const sectionTitles = language === "sw" ? SECTION_HEADERS_SW : SECTION_HEADERS;
  const { data: allowedPages } = useMyPageAccess();
  const filterByAccess = (items: typeof OPERATIONS) => {
    if (!allowedPages || allowedPages.length === 0) return items;
    return items.filter((item) => allowedPages.includes(item.to));
  };
  const operationsItems = filterByAccess(OPERATIONS);
  const managementItems = filterByAccess(MANAGEMENT);
  const adminItems = filterByAccess(ADMIN);

  if (isMobile) {
    return (
      <AnimatePresence>
        {!isCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setCollapsed(true)}
            />
            <motion.aside
              data-app-sidebar
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border"
            >
              <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
                    <Store className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold truncate" style={{ color: isLightTheme ? "#2d1f14" : "#F9FAFB" }}>{shopName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} className="h-8 w-8" style={{ color: isLightTheme ? "#1f2937" : "#f3f4f6" }}>
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-4">
                <NavSection
                  title={sectionTitles.operations}
                  items={operationsItems}
                  t={t}
                  language={language}
                  pendingOrdersCount={pendingOrdersCount}
                  isCollapsed={false}
                  isLightTheme={isLightTheme}
                  />
                <NavSection
                  title={sectionTitles.management}
                  items={managementItems}
                  t={t}
                  language={language}
                  pendingOrdersCount={pendingOrdersCount}
                  isCollapsed={false}
                  isLightTheme={isLightTheme}
                />
                <NavSection
                  title={sectionTitles.admin}
                  items={adminItems}
                  t={t}
                  language={language}
                  pendingOrdersCount={pendingOrdersCount}
                  isCollapsed={false}
                  isLightTheme={isLightTheme}
                />
              </nav>
              <div className="border-t border-sidebar-border p-2">
                <Button variant="ghost" className="w-full justify-start gap-3 hover:text-destructive hover:bg-destructive/10" style={{ color: isLightTheme ? "#1f2937" : "#f3f4f6" }} onClick={() => setSignOutConfirmOpen(true)}>
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
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
    <aside
      data-app-sidebar
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
        isCollapsed ? "w-[68px]" : "w-56"
      )}
    >
      <div className="flex h-14 items-center px-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <Store className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-semibold truncate" style={{ color: isLightTheme ? "#2d1f14" : "#F9FAFB" }}
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
        className="absolute -right-3 top-16 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-card shadow-lg hover:bg-sidebar-accent hover:border-primary/30 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" strokeWidth={1.5} /> : <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />}
      </Button>

      <nav className="flex-1 overflow-y-auto p-2 space-y-4 mt-1">
        <NavSection
          title={sectionTitles.operations}
          items={operationsItems}
          t={t}
          language={language}
          pendingOrdersCount={pendingOrdersCount}
          isCollapsed={isCollapsed}
          isLightTheme={isLightTheme}
          />
        <NavSection
          title={sectionTitles.management}
          items={managementItems}
          t={t}
          language={language}
          pendingOrdersCount={pendingOrdersCount}
          isCollapsed={isCollapsed}
          isLightTheme={isLightTheme}
        />
        <NavSection
          title={sectionTitles.admin}
          items={adminItems}
          t={t}
          language={language}
          pendingOrdersCount={pendingOrdersCount}
          isCollapsed={isCollapsed}
          isLightTheme={isLightTheme}
        />
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 hover:text-destructive hover:bg-destructive/10 transition-colors duration-200",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              style={{ color: isLightTheme ? "#1f2937" : "#f3f4f6" }}
              onClick={() => setSignOutConfirmOpen(true)}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
              {!isCollapsed && (language === "sw" ? "Toka" : "Sign Out")}
            </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{language === "sw" ? "Toka" : "Sign Out"}</TooltipContent>}
        </Tooltip>
      </div>

      <AlertDialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Thibitisha kutoka" : "Sign out?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "sw" ? "Una uhakika unataka kutoka kwa akaunti yako?" : "Are you sure you want to sign out?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { signOut(); setSignOutConfirmOpen(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "sw" ? "Toka" : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
