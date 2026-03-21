import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  Download,
  Globe,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Store,
  Sun,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { usePWAContext } from "@/contexts/PWAContext";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { getShellMeta } from "./app-navigation";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCollapsed } = useSidebar();
  const { language, setLanguage } = useLanguage();
  const { profile, signOut } = useAuth();
  const { isMobile } = useAdaptiveLayout();
  const { theme, toggleTheme } = useTheme();
  const { data: notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { permission, requestPermission, supportsNativeNotifications } = useNotificationContext();
  const { canInstall, install, isInstalled, needsManualInstallHint } = usePWAContext();
  const { formatDate } = useShopFormatting();
  const [searchQuery, setSearchQuery] = useState("");
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const shellMeta = getShellMeta(location.pathname);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/inventory?search=${encodeURIComponent(q)}`);
  };

  const userName = profile?.full_name || "User";
  const avatarUrl = profile?.avatar_url;
  const shopName = profile?.shops?.name || "Smart Money";

  const formattedDate = formatDate(new Date(), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="safe-top sticky top-0 z-30 mb-4 max-w-full border-b border-border/60 bg-background/74 backdrop-blur-2xl">
      <div className={cn("flex min-h-[72px] max-w-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-5 xl:px-6", isMobile && "min-h-[68px]")}>
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (shellMeta.backTo ? navigate(shellMeta.backTo) : setCollapsed(false))}
              className="h-10 w-10 shrink-0 rounded-2xl text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            >
              {shellMeta.backTo ? <ArrowLeft className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
            </Button>
          ) : null}

          <div className="flex min-w-0 items-center gap-3">
            {!isMobile && (
              <div className="hidden h-11 w-11 items-center justify-center rounded-[1.2rem] border border-border/70 bg-card/75 shadow-sm lg:flex">
                <Store className="h-5 w-5 text-primary" strokeWidth={1.6} />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{shopName}</p>
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:inline-flex">
                  Smart Money
                </span>
                <p className="truncate text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
          </div>

          {!isMobile && (
            <>
              <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 md:flex md:max-w-[28rem] xl:max-w-[34rem]">
                <div className="relative w-full">
                  <Search
                    className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/50 dark:text-foreground/60 dark:drop-shadow-[0_0_3px_rgba(59,130,246,0.2)]"
                    strokeWidth={1.5}
                  />
                  <Input
                    placeholder={language === "sw" ? "Tafuta bidhaa..." : "Search products..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-2xl border-border/70 bg-card/75 pl-10 pr-4 text-sm placeholder:text-muted-foreground shadow-sm focus-visible:border-primary/35 focus-visible:ring-1 focus-visible:ring-primary/35"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        <div className="flex max-w-full items-center justify-end gap-1.5 sm:flex-nowrap">
          {isMobile ? (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-2xl border-border/70 bg-card/70 text-foreground/70"
              onClick={() => navigate("/inventory")}
            >
              <Search className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          ) : (
            <>
              {(canInstall || needsManualInstallHint || isInstalled) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-10 gap-2 rounded-2xl border-border/70 bg-card/70 px-3 xl:flex"
                  onClick={() => void install()}
                  disabled={isInstalled}
                >
                  {isInstalled ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  <span>
                    {isInstalled
                      ? language === "sw"
                        ? "Imesakinishwa"
                        : "Installed"
                      : language === "sw"
                        ? "Sakinisha"
                        : "Install"}
                  </span>
                </Button>
              )}

              {supportsNativeNotifications && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-10 rounded-2xl border-border/70 bg-card/70 px-3 text-xs lg:flex"
                  onClick={() => (permission === "granted" ? navigate("/notifications") : void requestPermission())}
                >
                  <span>
                    {permission === "granted"
                      ? language === "sw"
                        ? "Notifications on"
                        : "Alerts on"
                      : language === "sw"
                        ? "Washa notifications"
                        : "Enable alerts"}
                  </span>
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                className="hidden h-10 w-10 rounded-2xl border-border/70 bg-card/70 text-foreground/70 transition-colors hover:bg-accent/80 hover:text-foreground lg:inline-flex"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-10 gap-2 rounded-2xl border-border/70 bg-card/70 px-3 text-foreground/70 transition-colors hover:bg-accent/80 hover:text-foreground lg:inline-flex"
                  >
                    <Globe className="h-4 w-4" strokeWidth={1.5} />
                    <span className="text-xs font-medium">{language === "sw" ? "Kiswahili" : "English"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-border bg-popover">
                  <DropdownMenuItem
                    onClick={() => setLanguage("en")}
                    className={cn("rounded-xl focus:bg-accent focus:text-foreground", language === "en" && "bg-primary/10 text-primary")}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLanguage("sw")}
                    className={cn("rounded-xl focus:bg-accent focus:text-foreground", language === "sw" && "bg-primary/10 text-primary")}
                  >
                    Kiswahili
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-10 w-10 rounded-2xl border-border/70 bg-card/70 text-foreground/70 transition-colors hover:bg-accent/80 hover:text-foreground"
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="flex max-h-96 w-80 flex-col overflow-hidden rounded-[1.3rem] border-border/70 bg-popover/98 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.32)]">
              <div className="flex items-center justify-between border-b px-2 py-2">
                <span className="text-sm font-medium">Notifications</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/notifications")}>
                    {language === "sw" ? "Ona zote" : "View all"}
                  </Button>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()}>
                      {language === "sw" ? "Soma zote" : "Mark all read"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {!notifications?.length ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {language === "sw" ? "Hakuna arifa" : "No notifications"}
                  </div>
                ) : (
                  notifications.map((notification: { id: string; title: string; message?: string | null; read_at?: string | null; created_at: string }) => (
                    <DropdownMenuItem
                      key={notification.id}
                    className={cn("flex cursor-pointer flex-col items-start gap-0.5 rounded-xl p-3", !notification.read_at && "bg-primary/5")}
                      onClick={() => !notification.read_at && markAsRead.mutate(notification.id)}
                    >
                      <span className="text-sm font-medium">{notification.title}</span>
                      {notification.message && <span className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</span>}
                      <span className="text-[10px] text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-w-0 max-w-[220px] items-center gap-2 rounded-[1.15rem] border border-border/70 bg-card/72 p-1.5 pr-2 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.22)] transition-colors duration-200 hover:bg-accent/75 sm:pr-3">
                <Avatar className="h-9 w-9 ring-1 ring-border/70">
                  <AvatarImage src={avatarUrl || undefined} alt={userName} />
                  <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                    {userName.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="truncate text-sm font-medium leading-tight text-foreground">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{formattedDate}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[1.3rem] border-border/70 bg-popover/98 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.32)]">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.shops?.name || "Smart Money"}</p>
              </div>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem className="gap-2 focus:bg-accent focus:text-foreground" onClick={() => navigate("/settings")}>
                <User className="h-4 w-4" strokeWidth={1.5} />
                {language === "sw" ? "Wasifu" : "Profile"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 focus:bg-accent focus:text-foreground" onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4" strokeWidth={1.5} />
                {language === "sw" ? "Mipangilio" : "Settings"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 focus:bg-accent focus:text-foreground" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
                {theme === "dark"
                  ? language === "sw"
                    ? "Mwanga"
                    : "Light mode"
                  : language === "sw"
                    ? "Giza"
                    : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 focus:bg-accent focus:text-foreground"
                onClick={() => setLanguage(language === "sw" ? "en" : "sw")}
              >
                <Globe className="h-4 w-4" strokeWidth={1.5} />
                {language === "sw" ? "English" : "Kiswahili"}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={() => setSignOutConfirmOpen(true)} className="gap-2 focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                {language === "sw" ? "Toka" : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{language === "sw" ? "Thibitisha kutoka" : "Sign out?"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {language === "sw" ? "Una uhakika unataka kutoka kwa akaunti yako?" : "Are you sure you want to sign out?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{language === "sw" ? "Ghairi" : "Cancel"}</AlertDialogCancel>
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
        </div>
      </div>
    </header>
  );
}
