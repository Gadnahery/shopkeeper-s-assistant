import { Link, useLocation } from "react-router-dom";
import { Menu, Plus, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { useIsPlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY_NAV, filterItemsByAccess, isRouteActive } from "./app-navigation";

/**
 * iOS-style mobile tab bar:
 * Home · Sales · [center New Sale FAB] · Inventory · Customers · More
 */
export function MobileBottomNav() {
  const location = useLocation();
  const { language, t } = useLanguage();
  const { setCollapsed, isCollapsed } = useSidebar();
  const { data: allowedPages } = useMyPageAccess();
  const { data: isPlatformAdmin } = useIsPlatformAdmin();
  const { profile } = useAuth();

  const items = filterItemsByAccess(
    MOBILE_PRIMARY_NAV,
    allowedPages,
    profile?.shops?.capabilities,
  );

  const left = items.slice(0, 2);
  const right = items.slice(2, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <div className="relative mx-auto flex h-[62px] max-w-lg items-end justify-between px-0.5 pb-1 pt-1">
        <div className="flex flex-1 items-center justify-around">
          {left.map((item) => {
            const active = isRouteActive(location.pathname, item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-transform active:scale-[0.97]",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="max-w-full truncate">
                  {item.mobileLabel ? item.mobileLabel[language] : t(item.labelKey)}
                </span>
                {active && (
                  <span className="absolute bottom-0.5 h-1 w-3 rounded-full bg-accent" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Center FAB — primary action: New sale */}
        <div className="relative z-10 flex w-16 shrink-0 justify-center">
          <Link
            to="/sales"
            className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1D29] text-white shadow-[0_8px_24px_-6px_rgba(26,29,41,0.5)] transition-transform active:scale-95"
            aria-label={language === "sw" ? "Mauzo mapya" : "New sale"}
          >
            <Plus className="h-6 w-6" strokeWidth={2.25} />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-around">
          {right.map((item) => {
            const active = isRouteActive(location.pathname, item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-transform active:scale-[0.97]",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className="max-w-full truncate">
                  {item.mobileLabel ? item.mobileLabel[language] : t(item.labelKey)}
                </span>
                {active && (
                  <span className="absolute bottom-0.5 h-1 w-3 rounded-full bg-accent" />
                )}
              </NavLink>
            );
          })}

          {isPlatformAdmin ? (
            <NavLink
              to="/platform-admin"
              className={cn(
                "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium",
                location.pathname.startsWith("/platform-admin")
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
              <span className="truncate">Admin</span>
            </NavLink>
          ) : null}

          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className={cn(
              "relative flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-transform active:scale-[0.97]",
              !isCollapsed ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
            <span className="truncate">{language === "sw" ? "Zaidi" : "More"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
