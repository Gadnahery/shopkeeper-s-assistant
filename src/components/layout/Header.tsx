import { Bell, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  shopName?: string;
  userName?: string;
  userRole?: string;
}

export function Header({ 
  shopName = "Colman Hardware", 
  userName = "Alex Johnson",
  userRole = "Store Manager"
}: HeaderProps) {
  const { isCollapsed } = useSidebar();
  const { language, setLanguage, t } = useLanguage();
  
  const now = new Date();
  const formattedDate = now.toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString(language === 'sw' ? 'sw-TZ' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Shop Info */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{shopName}</h2>
        <p className="text-sm text-muted-foreground">
          {formattedDate} • {formattedTime}
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Globe className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 rounded bg-primary px-1 text-[9px] font-bold uppercase text-primary-foreground">
                {language}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setLanguage("en")}
              className={cn(language === "en" && "bg-accent")}
            >
              🇬🇧 {t("settings.english")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLanguage("sw")}
              className={cn(language === "sw" && "bg-accent")}
            >
              🇹🇿 {t("settings.swahili")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button className="relative rounded-full p-2 hover:bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {userName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
