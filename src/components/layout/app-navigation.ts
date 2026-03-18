import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardList,
  Gift,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { matchPath } from "react-router-dom";

export type LanguageCode = "en" | "sw";
export type NavSectionKey = "operations" | "management" | "admin";

type LocalizedCopy = Record<LanguageCode, string>;

export type AppNavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  section: NavSectionKey;
  mobileLabel?: LocalizedCopy;
};

const OPERATIONS: AppNavItem[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, section: "operations", mobileLabel: { en: "Home", sw: "Kuu" } },
  { to: "/sales", labelKey: "nav.sales", icon: ShoppingCart, section: "operations", mobileLabel: { en: "Sales", sw: "Mauzo" } },
  { to: "/inventory", labelKey: "nav.inventory", icon: Package, section: "operations", mobileLabel: { en: "Stock", sw: "Stoki" } },
  { to: "/categories", labelKey: "nav.categories", icon: Tags, section: "operations" },
  { to: "/orders", labelKey: "nav.orders", icon: ClipboardList, section: "operations" },
  { to: "/todo", labelKey: "nav.todo", icon: CheckSquare, section: "operations" },
];

const MANAGEMENT: AppNavItem[] = [
  { to: "/customers", labelKey: "nav.customers", icon: Users, section: "management" },
  { to: "/suppliers", labelKey: "nav.suppliers", icon: Truck, section: "management" },
  { to: "/expenses", labelKey: "nav.expenses", icon: Receipt, section: "management" },
  { to: "/hrm", labelKey: "nav.hrm", icon: UserCog, section: "management" },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3, section: "management", mobileLabel: { en: "Reports", sw: "Ripoti" } },
  { to: "/loyalty", labelKey: "nav.loyalty", icon: Gift, section: "management" },
];

const ADMIN: AppNavItem[] = [
  { to: "/user-management", labelKey: "nav.userManagement", icon: UserPlus, section: "admin" },
  { to: "/assets", labelKey: "nav.assets", icon: Building2, section: "admin" },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, section: "admin" },
];

export const NAVIGATION_SECTIONS: Record<NavSectionKey, AppNavItem[]> = {
  operations: OPERATIONS,
  management: MANAGEMENT,
  admin: ADMIN,
};

export const NAV_SECTION_LABELS: Record<NavSectionKey, LocalizedCopy> = {
  operations: { en: "Operations", sw: "Operesheni" },
  management: { en: "Management", sw: "Usimamizi" },
  admin: { en: "Admin", sw: "Msimamizi" },
};

export const MOBILE_PRIMARY_NAV = [
  OPERATIONS[0],
  OPERATIONS[1],
  OPERATIONS[2],
  MANAGEMENT[4],
];

const MOBILE_FOCUS_ROUTES = [
  { pattern: "/inventory/add", backTo: "/inventory" },
  { pattern: "/inventory/receive", backTo: "/inventory" },
  { pattern: "/customers/:id", backTo: "/customers" },
  { pattern: "/suppliers/:id", backTo: "/suppliers" },
];

export function filterItemsByAccess(items: AppNavItem[], allowedPages?: string[]) {
  if (!allowedPages || allowedPages.length === 0) return items;
  return items.filter((item) => allowedPages.includes(item.to));
}

export function isRouteActive(pathname: string, item: AppNavItem) {
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
