import { Link, useLocation } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyPageAccess } from "@/hooks/useUserPageAccess";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY_NAV, filterItemsByAccess, isRouteActive } from "./app-navigation";

/**
 * Mobile tab bar:
 * Home · Sales · [raised + New Sale] · Stock · Customers
 * "More" is available via the header menu / sidebar.
 */
export function MobileBottomNav() {
  const location = useLocation();
  const { language, t } = useLanguage();
  const { setCollapsed } = useSidebar();
  const { data: allowedPages } = useMyPageAccess();
  const { profile } = useAuth();

  const items = filterItemsByAccess(
    MOBILE_PRIMARY_NAV,
    allowedPages,
    profile?.shops?.capabilities,
  ).slice(0, 4);

  // Ensure order: home, sales, inventory, customers when present
  const byPath = Object.fromEntries(items.map((i) => [i.to, i]));
  const ordered = [
    byPath["/dashboard"],
    byPath["/sales"],
    byPath["/inventory"],
    byPath["/customers"],
  ].filter(Boolean) as typeof items;

  const left = ordered.slice(0, 2);
  const right = ordered.slice(2, 4);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      {/* Raised + button — fully visible above the bar */}
      <div
        className="pointer-events-auto absolute left-1/2 z-50 -translate-x-1/2"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
      >
        <Link
          to="/sales"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1A1D29] text-white shadow-[0_10px_30px_-6px_rgba(26,29,41,0.55)] ring-[5px] ring-background transition-transform active:scale-95"
          aria-label={language === "sw" ? "Mauzo mapya" : "New sale"}
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="pointer-events-auto border-t border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[64px] max-w-lg items-stretch">
          <div className="flex flex-1 items-stretch justify-around">
            {left.map((item) => {
              const active = isRouteActive(location.pathname, item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium active:scale-[0.97]",
                    active ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="max-w-full truncate">
                    {item.mobileLabel ? item.mobileLabel[language] : t(item.labelKey)}
                  </span>
                  {active && <span className="absolute bottom-1 h-1 w-3 rounded-full bg-accent" />}
                </NavLink>
              );
            })}
          </div>

          {/* Center gap for FAB */}
          <div className="w-16 shrink-0" aria-hidden />

          <div className="flex flex-1 items-stretch justify-around">
            {right.map((item) => {
              const active = isRouteActive(location.pathname, item);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium active:scale-[0.97]",
                    active ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                  <span className="max-w-full truncate">
                    {item.mobileLabel ? item.mobileLabel[language] : t(item.labelKey)}
                  </span>
                  {active && <span className="absolute bottom-1 h-1 w-3 rounded-full bg-accent" />}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted-foreground active:scale-[0.97]"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
              <span className="truncate">{language === "sw" ? "Zaidi" : "More"}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
