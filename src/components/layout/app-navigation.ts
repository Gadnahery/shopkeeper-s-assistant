import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  Factory,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";
import { matchPath } from "react-router-dom";

export type LanguageCode = "en" | "sw";

type LocalizedCopy = Record<LanguageCode, string>;

export type AppNavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  mobileLabel?: LocalizedCopy;
};

export const OLLY_NAVIGATION_ITEMS: AppNavItem[] = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, mobileLabel: { en: "Overview", sw: "Muhtasari" } },
  { to: "/purchases", labelKey: "nav.purchases", icon: ShoppingCart, mobileLabel: { en: "Purchases", sw: "Manunuzi" } },
  { to: "/production", labelKey: "nav.production", icon: Factory, mobileLabel: { en: "Production", sw: "Uzalishaji" } },
  { to: "/sales", labelKey: "nav.sales", icon: Tag, mobileLabel: { en: "Sales", sw: "Mauzo" } },
  { to: "/inventory", labelKey: "nav.inventory", icon: Package, mobileLabel: { en: "Inventory", sw: "Stoki" } },
  { to: "/customers", labelKey: "nav.customers", icon: Users, mobileLabel: { en: "Customers", sw: "Wateja" } },
  { to: "/expenses", labelKey: "nav.finance", icon: DollarSign, mobileLabel: { en: "Finance", sw: "Fedha" } },
  { to: "/hrm", labelKey: "nav.hrm", icon: UsersRound, mobileLabel: { en: "HR", sw: "HR" } },
  { to: "/reports", labelKey: "nav.reports", icon: FileText, mobileLabel: { en: "Reports", sw: "Ripoti" } },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, mobileLabel: { en: "Settings", sw: "Mipangilio" } },
];

export const MOBILE_PRIMARY_NAV: AppNavItem[] = [
  OLLY_NAVIGATION_ITEMS[0], // Overview
  OLLY_NAVIGATION_ITEMS[3], // Sales
  OLLY_NAVIGATION_ITEMS[4], // Inventory
  OLLY_NAVIGATION_ITEMS[8], // Reports
];

const MOBILE_FOCUS_ROUTES = [
  { pattern: "/inventory/add", backTo: "/inventory" },
  { pattern: "/inventory/receive", backTo: "/inventory" },
  { pattern: "/customers/:id", backTo: "/customers" },
  { pattern: "/suppliers/:id", backTo: "/purchases" },
];

export function filterItemsByAccess(items: AppNavItem[], allowedPages?: string[]) {
  if (!allowedPages || allowedPages.length === 0) return items;
  return items.filter((item) => {
    // If user has access to /dashboard, /expenses, etc. or if it's new pages
    return (
      allowedPages.includes(item.to) ||
      (item.to === "/purchases" && (allowedPages.includes("/inventory") || allowedPages.includes("/suppliers"))) ||
      (item.to === "/production" && allowedPages.includes("/inventory"))
    );
  });
}

export function isRouteActive(pathname: string, item: AppNavItem) {
  if (item.to === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function getShellMeta(pathname: string) {
  const matchedFocusRoute = MOBILE_FOCUS_ROUTES.find((route) =>
    matchPath({ path: route.pattern, end: true }, pathname),
  );

  return {
    showMobileNav: !matchedFocusRoute,
    backTo: matchedFocusRoute?.backTo ?? null,
  };
}
