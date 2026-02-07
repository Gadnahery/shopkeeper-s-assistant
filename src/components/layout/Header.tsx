import { Bell, Globe, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const { toggleSidebar, setCollapsed } = useSidebar();
  const { language, setLanguage, t } = useLanguage();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const userName = profile?.full_name || "User";
  const shopName = profile?.shops?.name || "Smart Money";
  const avatarUrl = profile?.avatar_url;

  const now = new Date();
  const formattedDate = now.toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)} className="h-9 w-9 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-sm font-semibold text-foreground md:text-base">{shopName}</h2>
          <p className="hidden text-xs text-muted-foreground md:block">{formattedDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Globe className="h-4 w-4" />
              <span className="absolute -bottom-0.5 -right-0.5 rounded bg-primary px-1 text-[8px] font-bold uppercase text-primary-foreground">
                {language}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage("en")} className={cn(language === "en" && "bg-accent")}>
              🇬🇧 {t("settings.english")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("sw")} className={cn(language === "sw" && "bg-accent")}>
              🇹🇿 {t("settings.swahili")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="relative rounded-full p-2 hover:bg-muted">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-foreground">{userName}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
