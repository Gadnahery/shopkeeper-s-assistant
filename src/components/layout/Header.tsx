import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Globe, Menu, Moon, Sun, Search, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
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

export function Header() {
  const navigate = useNavigate();
  const { setCollapsed } = useSidebar();
  const { language, setLanguage } = useLanguage();
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { data: notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/inventory?search=${encodeURIComponent(q)}`);
  };

  const userName = profile?.full_name || "User";
  const avatarUrl = profile?.avatar_url;

  const formattedDate = new Date().toLocaleDateString(language === "sw" ? "sw-TZ" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/90 backdrop-blur-xl px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        )}

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 dark:text-foreground/60 dark:drop-shadow-[0_0_3px_rgba(59,130,246,0.2)] z-10" strokeWidth={1.5} />
            <Input
              placeholder={language === "sw" ? "Tafuta bidhaa..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 bg-muted/40 backdrop-blur-sm border-border rounded-xl text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 transition-all"
            />
          </div>
        </form>

        <div className="md:hidden text-sm text-muted-foreground truncate">{formattedDate}</div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-foreground/70 dark:text-foreground/80 hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 dark:drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.5} />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-foreground/70 dark:text-foreground/80 hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors">
              <Globe className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" strokeWidth={1.5} />
              <span className="absolute -bottom-0.5 -right-0.5 rounded bg-blue-600 dark:bg-blue-500 dark:shadow-[0_0_6px_rgba(59,130,246,0.5)] px-1 text-[8px] font-bold text-white">
                {language.toUpperCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
            <DropdownMenuItem
              onClick={() => setLanguage("en")}
              className={cn("focus:bg-accent focus:text-foreground", language === "en" && "bg-primary/10 text-primary")}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLanguage("sw")}
              className={cn("focus:bg-accent focus:text-foreground", language === "sw" && "bg-primary/10 text-primary")}
            >
              Kiswahili
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-foreground/70 dark:text-foreground/80 hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/70 transition-colors">
              <Bell className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 dark:shadow-[0_0_8px_rgba(59,130,246,0.6)] text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 border-b">
              <span className="font-medium text-sm">{language === "sw" ? "Arifa" : "Notifications"}</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()}>
                  {language === "sw" ? "Soma zote" : "Mark all read"}
                </Button>
              )}
            </div>
            <div className="overflow-y-auto max-h-64">
              {!notifications?.length ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {language === "sw" ? "Hakuna arifa" : "No notifications"}
                </div>
              ) : (
                notifications.map((n: { id: string; title: string; message?: string | null; read_at?: string | null; created_at: string }) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn("flex flex-col items-start gap-0.5 p-3 cursor-pointer", !n.read_at && "bg-primary/5")}
                    onClick={() => !n.read_at && markAsRead.mutate(n.id)}
                  >
                    <span className="font-medium text-sm">{n.title}</span>
                    {n.message && <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>}
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted/50 transition-colors duration-200">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">{userName}</p>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <div className="px-2 py-2">
              <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.shops?.name || "Smart Money"}</p>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="focus:bg-accent focus:text-foreground gap-2" onClick={() => navigate("/settings")}>
              <User className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(59,130,246,0.2)]" strokeWidth={1.5} />
              {language === "sw" ? "Wasifu" : "Profile"}
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-accent focus:text-foreground gap-2" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(59,130,246,0.2)]" strokeWidth={1.5} />
              {language === "sw" ? "Mipangilio" : "Settings"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => setSignOutConfirmOpen(true)}
              className="focus:bg-destructive/10 focus:text-destructive gap-2"
            >
              <LogOut className="h-4 w-4 dark:drop-shadow-[0_0_3px_rgba(239,68,68,0.3)]" strokeWidth={1.5} />
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
                onClick={() => { signOut(); setSignOutConfirmOpen(false); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {language === "sw" ? "Toka" : "Sign Out"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
