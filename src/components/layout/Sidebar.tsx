import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Languages,
  LogOut,
  Moon,
  Store,
  Sun,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { preloadRoute } from "@/lib/routePreload";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingOrdersCount } from "@/hooks/useOrders";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useTheme } from "@/hooks/useTheme";
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
import {
  NAVIGATION_SECTIONS,
  NAV_SECTION_LABELS,
  type AppNavItem,
  filterItemsByAccess,
} from "./app-navigation";

function NavSection({
  title,
  items,
  t,
  pendingOrdersCount,
  isCompact,
}: {
  title: string;
  items: AppNavItem[];
  t: (k: string) => string;
  pendingOrdersCount: number;
  isCompact: boolean;
}) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-150 ease-out [&_svg]:text-inherit",
      "hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.95)]",
      isCompact && "justify-center px-2",
    );

  return (
    <div className={cn("space-y-1 rounded-[1.35rem] border border-sidebar-border/70 bg-sidebar-accent/28 p-2", isCompact && "border-0 bg-transparent p-0")}>
      {!isCompact && (
        <span className="mb-1.5 block px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55">
          {title}
        </span>
      )}

      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={navLinkClass}
          onMouseEnter={() => preloadRoute(item.to)}
        >
          {({ isActive }) => (
            <span className="flex w-full min-w-0 items-center gap-3">
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-sidebar-primary-foreground" />
              )}

              <item.icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150",
                  isActive && "drop-shadow-[0_0_6px_rgba(13,148,136,0.35)]",
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />

              {!isCompact && (
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
          )}
        </NavLink>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar();
  const { t, language, setLanguage } = useLanguage();
  const { signOut, profile } = useAuth();
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
  const { data: allowedPages } = useMyPageAccess();
  const { isMobile, isTablet, isDesktop } = useAdaptiveLayout();
  const { theme, toggleTheme } = useTheme();
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const shopName = profile?.shops?.name || "Smart Money";
  const collapsedView = isTablet || isCollapsed;
  const sidebarWidth = collapsedView ? 96 : 280;

  const operationsItems = filterItemsByAccess(NAVIGATION_SECTIONS.operations, allowedPages);
  const managementItems = filterItemsByAccess(NAVIGATION_SECTIONS.management, allowedPages);
  const adminItems = filterItemsByAccess(NAVIGATION_SECTIONS.admin, allowedPages);
  const sectionTitles = {
    operations: NAV_SECTION_LABELS.operations[language],
    management: NAV_SECTION_LABELS.management[language],
    admin: NAV_SECTION_LABELS.admin[language],
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {!isCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[rgba(28,23,18,0.42)] backdrop-blur-[3px]"
              onClick={() => setCollapsed(true)}
            />

            <motion.aside
              data-app-sidebar
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-[min(88vw,23.5rem)] flex-col rounded-r-[2rem] border-r border-sidebar-border/80 bg-[linear-gradient(180deg,hsl(var(--sidebar-background)/0.98),hsl(var(--sidebar-background)/0.94))] shadow-[22px_0_80px_-36px_rgba(15,23,42,0.55)] backdrop-blur-xl"
            >
              <div className="border-b border-sidebar-border/80 px-4 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.1rem] bg-primary/15 ring-1 ring-primary/15">
                    <Store className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-sidebar-foreground">{shopName}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(true)}
                    className="h-10 w-10 rounded-full text-sidebar-foreground hover:bg-sidebar-accent/70"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>

              <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
                <NavSection
                  title={sectionTitles.operations}
                  items={operationsItems}
                  t={t}
                  pendingOrdersCount={pendingOrdersCount}
                  isCompact={false}
                />
                <NavSection
                  title={sectionTitles.management}
                  items={managementItems}
                  t={t}
                  pendingOrdersCount={pendingOrdersCount}
                  isCompact={false}
                />
                <NavSection
                  title={sectionTitles.admin}
                  items={adminItems}
                  t={t}
                  pendingOrdersCount={pendingOrdersCount}
                  isCompact={false}
                />
              </nav>

              <div className="space-y-3 border-t border-sidebar-border/80 bg-sidebar-accent/18 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    className="h-11 justify-start gap-2 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 text-sidebar-foreground hover:bg-sidebar-accent/80"
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === "dark"
                      ? language === "sw"
                        ? "Mwanga"
                        : "Light"
                      : language === "sw"
                        ? "Giza"
                        : "Dark"}
                  </Button>

                  <Button
                    variant="ghost"
                    className="h-11 justify-start gap-2 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 text-sidebar-foreground hover:bg-sidebar-accent/80"
                    onClick={() => setLanguage(language === "sw" ? "en" : "sw")}
                  >
                    <Languages className="h-4 w-4" />
                    {language === "sw" ? "English" : "Kiswahili"}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="h-11 w-full justify-start gap-3 rounded-2xl border border-sidebar-border/70 bg-transparent text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setSignOutConfirmOpen(true)}
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  {language === "sw" ? "Toka" : "Sign Out"}
                </Button>
              </div>
            </motion.aside>
          </>
        )}

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
                onClick={() => {
                  signOut();
                  setSignOutConfirmOpen(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {language === "sw" ? "Toka" : "Sign Out"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AnimatePresence>
    );
  }

  return (
    <aside
      data-app-sidebar
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar/92 shadow-[16px_0_60px_-38px_rgba(15,23,42,0.6)] backdrop-blur-2xl transition-[width] duration-200"
      style={{ width: sidebarWidth }}
    >
      <div className="flex h-[76px] items-center border-b border-sidebar-border/80 px-4">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/14 ring-1 ring-white/10">
            <Store className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>

          {!collapsedView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{shopName}</p>
            </motion.div>
          )}
        </div>
      </div>

      {isDesktop && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-[4.8rem] z-50 h-7 w-7 rounded-full border border-sidebar-border bg-card shadow-lg transition-colors hover:border-primary/30 hover:bg-sidebar-accent"
        >
          {collapsedView ? <ChevronRight className="h-3 w-3" strokeWidth={1.5} /> : <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />}
        </Button>
      )}

      <nav className={cn("mt-2 flex-1 overflow-y-auto px-3 py-3", collapsedView ? "space-y-6" : "space-y-5")}>
        <NavSection
          title={sectionTitles.operations}
          items={operationsItems}
          t={t}
          pendingOrdersCount={pendingOrdersCount}
          isCompact={collapsedView}
        />
        <NavSection
          title={sectionTitles.management}
          items={managementItems}
          t={t}
          pendingOrdersCount={pendingOrdersCount}
          isCompact={collapsedView}
        />
        <NavSection
          title={sectionTitles.admin}
          items={adminItems}
          t={t}
          pendingOrdersCount={pendingOrdersCount}
          isCompact={collapsedView}
        />
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 rounded-2xl text-sidebar-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive",
                collapsedView ? "justify-center px-2" : "justify-start",
              )}
              onClick={() => setSignOutConfirmOpen(true)}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
              {!collapsedView && (language === "sw" ? "Toka" : "Sign Out")}
            </Button>
          </TooltipTrigger>
          {collapsedView && <TooltipContent side="right">{language === "sw" ? "Toka" : "Sign Out"}</TooltipContent>}
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
              onClick={() => {
                signOut();
                setSignOutConfirmOpen(false);
              }}
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
