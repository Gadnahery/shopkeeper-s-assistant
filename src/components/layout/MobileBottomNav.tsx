import { Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { MOBILE_PRIMARY_NAV, filterItemsByAccess, isRouteActive } from "./app-navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const location = useLocation();
  const { language, t } = useLanguage();
  const { setCollapsed, isCollapsed } = useSidebar();
  const { data: allowedPages } = useMyPageAccess();

  const items = filterItemsByAccess(MOBILE_PRIMARY_NAV, allowedPages);
  const totalColumns = items.length + 1;

  return (
    <nav className="safe-bottom fixed inset-x-3 bottom-3 z-30 md:hidden">
      <div
        className="mx-auto grid max-w-xl gap-1 rounded-[1.85rem] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)/0.96),hsl(var(--card)/0.88))] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.45rem)] pt-2 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl"
        style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isRouteActive(location.pathname, item);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-[0_16px_34px_-20px_hsl(var(--primary)/0.75)]" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.75} />
              <span className="truncate">
                {item.mobileLabel ? item.mobileLabel[language] : t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
            !isCollapsed ? "bg-primary text-primary-foreground shadow-[0_16px_34px_-20px_hsl(var(--primary)/0.75)]" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={!isCollapsed ? 2 : 1.75} />
          <span className="truncate">{language === "sw" ? "Menyu" : "Menu"}</span>
        </button>
      </div>
    </nav>
  );
}
