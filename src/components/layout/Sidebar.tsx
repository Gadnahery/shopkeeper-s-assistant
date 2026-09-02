import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Plus,
  Store,
  Sun,
  X,
  Languages,
  User,
  ShoppingBag,
  DollarSign,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { preloadRoute } from "@/lib/routePreload";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  OLLY_NAVIGATION_ITEMS,
  type AppNavItem,
  filterItemsByAccess,
  isRouteActive,
} from "./app-navigation";
import { BrandLogo, BrandGlyph } from "@/components/brand/BrandLogo";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar();
  const { t, language, setLanguage } = useLanguage();
  const { signOut, profile, userRole } = useAuth();
  const { data: allowedPages } = useMyPageAccess();
  const { isMobile, isTablet, isDesktop } = useAdaptiveLayout();
  const { theme, toggleTheme } = useTheme();
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const shopName = profile?.shops?.name || "WiseCash";
  const userName = profile?.full_name || "Admin";
  const avatarUrl = profile?.avatar_url;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const collapsedView = isTablet || isCollapsed;
  const sidebarWidth = collapsedView ? 72 : 230;

  const navItems = filterItemsByAccess(OLLY_NAVIGATION_ITEMS, allowedPages);

  // Mobile Drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {!isCollapsed && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCollapsed(true)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card shadow-2xl"
            >
              {/* Drawer Top */}
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(true)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Nav List */}
              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {navItems.map((item) => {
                  const active = isRouteActive(location.pathname, item);
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setCollapsed(true)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-muted font-semibold text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </NavLink>
                  );
                })}

                {/* Quick Actions (Mobile) */}
                <div className="pt-4 mt-4 border-t border-border">
                  <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {language === "sw" ? "Vitendo vya Haraka" : "Quick Actions"}
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCollapsed(true); navigate("/purchases?new=true"); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 text-accent" />
                      <span>{t("quick.newPurchase")}</span>
                    </button>
                    <button
                      onClick={() => { setCollapsed(true); navigate("/sales"); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-accent" />
                      <span>{t("quick.newSale")}</span>
                    </button>
                    <button
                      onClick={() => { setCollapsed(true); navigate("/expenses?new=true"); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <DollarSign className="h-3.5 w-3.5 text-accent" />
                      <span>{t("quick.newExpense")}</span>
                    </button>
                  </div>
                </div>
              </nav>

              {/* Bottom Profile / Quick Toggle */}
              <div className="border-t border-border p-3">
                <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{userName}</p>
                      <p className="truncate text-[10px] text-muted-foreground capitalize">{userRole || "Admin"}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSignOutConfirmOpen(true)}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
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
                onClick={() => { signOut(); setSignOutConfirmOpen(false); }}
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

  // Desktop / Tablet Sidebar
  return (
    <aside
      data-app-sidebar
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out"
      style={{ width: sidebarWidth }}
    >
      {/* Top Header / Brand */}
      <div className={cn("flex h-[72px] items-center border-b border-border", collapsedView ? "justify-center px-2" : "justify-between px-4")}>
        <div
          onClick={isDesktop ? toggleSidebar : undefined}
          className="flex min-w-0 cursor-pointer items-center gap-2.5"
          title={collapsedView ? "Expand Sidebar" : undefined}
        >
          {collapsedView ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-xs">
              <BrandGlyph className="h-4 w-4" />
            </div>
          ) : (
            <BrandLogo size="md" />
          )}
        </div>

        {isDesktop && !collapsedView && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 10 Primary Nav Items */}
      <nav className={cn("flex-1 space-y-1 overflow-y-auto p-2.5", collapsedView && "px-2")}>
        {navItems.map((item) => {
          const active = isRouteActive(location.pathname, item);
          const Icon = item.icon;
          const label = t(item.labelKey);

          if (collapsedView) {
            return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    onMouseEnter={() => preloadRoute(item.to)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl mx-auto text-sm transition-all duration-150",
                      active
                        ? "bg-muted text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => preloadRoute(item.to)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-muted font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} strokeWidth={active ? 2.25 : 1.75} />
              <span className="truncate">{label}</span>
            </NavLink>
          );
        })}

        {/* Quick Actions (Expanded Desktop) */}
        {!collapsedView && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {language === "sw" ? "Vitendo vya Haraka" : "Quick Actions"}
            </p>
            <div className="space-y-1">
              <button
                onClick={() => navigate("/purchases?new=true")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>{t("quick.newPurchase")}</span>
              </button>
              <button
                onClick={() => navigate("/sales")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>{t("quick.newSale")}</span>
              </button>
              <button
                onClick={() => navigate("/expenses?new=true")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>{t("quick.newExpense")}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Profile Block */}
      <div className={cn("border-t border-border p-2.5", collapsedView ? "flex justify-center" : "")}>
        {collapsedView ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSignOutConfirmOpen(true)}
                className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {language === "sw" ? "Toka" : "Sign Out"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between gap-2 rounded-xl p-2 text-left hover:bg-muted/70 transition-colors">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground leading-tight">{userName}</p>
                    <p className="truncate text-[10px] text-muted-foreground capitalize">{userRole || "Admin"}</p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl border-border bg-popover shadow-lg">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 text-xs">
                <User className="h-3.5 w-3.5" />
                {language === "sw" ? "Mipangilio ya Akaunti" : "Account Settings"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} className="gap-2 text-xs">
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {theme === "dark" ? (language === "sw" ? "Mandhari ya Mwanga" : "Light Mode") : (language === "sw" ? "Mandhari ya Giza" : "Dark Mode")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage(language === "sw" ? "en" : "sw")} className="gap-2 text-xs">
                <Languages className="h-3.5 w-3.5" />
                {language === "sw" ? "Switch to English" : "Badili kwenda Kiswahili"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSignOutConfirmOpen(true)}
                className="gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                {language === "sw" ? "Toka" : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
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
