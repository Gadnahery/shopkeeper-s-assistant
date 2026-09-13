import { Menu, ShieldCheck } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { useIsPlatformAdmin } from "@/hooks/usePlatformAdmin";
import { MOBILE_PRIMARY_NAV, filterItemsByAccess, isRouteActive } from "./app-navigation";
import { cn } from "@/lib/utils";
import { QuickActionSheet } from "./QuickActionSheet";

export function MobileBottomNav() {
  const location = useLocation();
  const { language, t } = useLanguage();
  const { setCollapsed, isCollapsed } = useSidebar();
  const { data: allowedPages } = useMyPageAccess();
  const { data: isPlatformAdmin } = useIsPlatformAdmin();

  const { profile } = useAuth();
  const items = filterItemsByAccess(MOBILE_PRIMARY_NAV, allowedPages, profile?.shops?.capabilities);
  const totalColumns = items.length + 1 + (isPlatformAdmin ? 1 : 0);

  return (
    <>
      <QuickActionSheet />
      <nav className="safe-bottom fixed inset-x-3 bottom-3 z-30 md:hidden">
        <div
          className="mx-auto grid max-w-xl gap-1 rounded-2xl border border-border/80 bg-card/95 px-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] pt-1.5 shadow-2xl backdrop-blur-xl"
          style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = isRouteActive(location.pathname, item);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-[11px] font-medium transition-all",
                  active
                    ? "bg-primary/10 font-bold text-primary shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.75} />
                <span className="truncate max-w-full">
                  {item.mobileLabel ? item.mobileLabel[language] : t(item.labelKey)}
                </span>
                {active && (
                  <span className="absolute bottom-0.5 h-1 w-3 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}

          {isPlatformAdmin && (
            <NavLink
              to="/platform-admin"
              className={cn(
                "relative flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-[11px] font-medium transition-all",
                location.pathname.startsWith("/platform-admin")
                  ? "bg-primary/15 font-bold text-primary shadow-xs"
                  : "text-primary hover:bg-primary/10",
              )}
            >
              <ShieldCheck
                className="h-[18px] w-[18px]"
                strokeWidth={location.pathname.startsWith("/platform-admin") ? 2.2 : 1.75}
              />
              <span className="truncate">Admin</span>
              {location.pathname.startsWith("/platform-admin") && (
                <span className="absolute bottom-0.5 h-1 w-3 rounded-full bg-primary" />
              )}
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className={cn(
              "flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-[11px] font-medium transition-all",
              !isCollapsed
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={!isCollapsed ? 2.2 : 1.75} />
            <span className="truncate">{language === "sw" ? "Menyu" : "Menu"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
