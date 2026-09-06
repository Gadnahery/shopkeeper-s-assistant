import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  Factory,
  FileText,
  CalendarDays,
  ClipboardList,
  Bell,
  Boxes,
  ClipboardCheck,
  FolderTree,
  Heart,
  UserCog,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";
import { matchPath } from "react-router-dom";
import { hasCapability } from "@/lib/businessCapabilities";

export type LanguageCode = "en" | "sw";

type LocalizedCopy = Record<LanguageCode, string>;

export type AppNavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  mobileLabel?: LocalizedCopy;
  capability?: Parameters<typeof hasCapability>[1];
};

export const OLLY_NAVIGATION_ITEMS: AppNavItem[] = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, mobileLabel: { en: "Overview", sw: "Muhtasari" } },
  { to: "/purchases", labelKey: "nav.purchases", icon: ShoppingCart, mobileLabel: { en: "Purchases", sw: "Manunuzi" } },
  { to: "/production", labelKey: "nav.production", icon: Factory, mobileLabel: { en: "Production", sw: "Uzalishaji" } },
  { to: "/sales", labelKey: "nav.sales", icon: Tag, mobileLabel: { en: "Sales", sw: "Mauzo" } },
  { to: "/inventory", labelKey: "nav.inventory", icon: Package, mobileLabel: { en: "Inventory", sw: "Stoki" } },
  { to: "/customers", labelKey: "nav.customers", icon: Users, mobileLabel: { en: "Customers", sw: "Wateja" } },
  { to: "/appointments", labelKey: "nav.appointments", icon: CalendarDays, mobileLabel: { en: "Appointments", sw: "Miadi" }, capability: "appointments" },
  { to: "/expenses", labelKey: "nav.finance", icon: DollarSign, mobileLabel: { en: "Finance", sw: "Fedha" }, capability: "expenses" },
  { to: "/hrm", labelKey: "nav.hrm", icon: UsersRound, mobileLabel: { en: "HR", sw: "HR" } },
  { to: "/orders", labelKey: "nav.orders", icon: ClipboardList, mobileLabel: { en: "Orders", sw: "Maagizo" } },
  { to: "/suppliers", labelKey: "nav.suppliers", icon: Boxes, mobileLabel: { en: "Suppliers", sw: "Wasambazaji" } },
  { to: "/categories", labelKey: "nav.categories", icon: FolderTree, mobileLabel: { en: "Categories", sw: "Makundi" } },
  { to: "/todo", labelKey: "nav.todo", icon: ClipboardCheck, mobileLabel: { en: "To-do", sw: "Kazi" } },
  { to: "/loyalty", labelKey: "nav.loyalty", icon: Heart, mobileLabel: { en: "Loyalty", sw: "Uaminifu" } },
  { to: "/assets", labelKey: "nav.assets", icon: Boxes, mobileLabel: { en: "Assets", sw: "Mali" } },
  { to: "/notifications", labelKey: "nav.notifications", icon: Bell, mobileLabel: { en: "Notifications", sw: "Arifa" } },
  { to: "/user-management", labelKey: "nav.userManagement", icon: UserCog, mobileLabel: { en: "Users", sw: "Watumiaji" } },
  { to: "/reports", labelKey: "nav.reports", icon: FileText, mobileLabel: { en: "Reports", sw: "Ripoti" } },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, mobileLabel: { en: "Settings", sw: "Mipangilio" } },
];

export const MOBILE_PRIMARY_NAV: AppNavItem[] = [
  OLLY_NAVIGATION_ITEMS[0], // Overview
  OLLY_NAVIGATION_ITEMS[3], // Sales
  OLLY_NAVIGATION_ITEMS[4], // Inventory
  OLLY_NAVIGATION_ITEMS[5], // Customers
];

const MOBILE_FOCUS_ROUTES = [
  { pattern: "/inventory/add", backTo: "/inventory" },
  { pattern: "/inventory/receive", backTo: "/inventory" },
  { pattern: "/customers/:id", backTo: "/customers" },
  { pattern: "/suppliers/:id", backTo: "/purchases" },
];

export function filterItemsByAccess(items: AppNavItem[], allowedPages?: string[], capabilities?: unknown) {
  const capabilityFiltered = items.filter((item) => !item.capability || hasCapability(capabilities, item.capability));
  if (!allowedPages || allowedPages.length === 0) return capabilityFiltered;
  return capabilityFiltered.filter((item) => {
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
