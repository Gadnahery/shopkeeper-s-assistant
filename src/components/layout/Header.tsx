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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const { setCollapsed } = useSidebar();
  const { language, setLanguage, t } = useLanguage();
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();

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

        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" strokeWidth={1.5} />
            <Input
              placeholder={language === "sw" ? "Tafuta..." : "Search..."}
              className="h-10 pl-10 pr-4 bg-muted/40 backdrop-blur-sm border-border rounded-xl text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 transition-all"
            />
          </div>
        </div>

        <div className="md:hidden text-sm text-muted-foreground truncate">{formattedDate}</div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <Globe className="h-4 w-4" strokeWidth={1.5} />
              <span className="absolute -bottom-0.5 -right-0.5 rounded bg-primary px-1 text-[8px] font-bold text-primary-foreground">
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

        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50">
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

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
            <DropdownMenuItem className="focus:bg-accent focus:text-foreground gap-2">
              <User className="h-4 w-4" strokeWidth={1.5} />
              {language === "sw" ? "Wasifu" : "Profile"}
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-accent focus:text-foreground gap-2" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" strokeWidth={1.5} />
              {language === "sw" ? "Mipangilio" : "Settings"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="focus:bg-destructive/10 focus:text-destructive gap-2"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              {language === "sw" ? "Toka" : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
