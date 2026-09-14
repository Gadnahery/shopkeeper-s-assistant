import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Factory,
  FileText,
  FolderTree,
  Heart,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  UserCog,
  Users,
  UsersRound,
  Banknote,
  TrendingUp,
  Landmark,
  Wrench,
  Trash2,
} from "lucide-react";
import { matchPath } from "react-router-dom";
import { hasCapability } from "@/lib/businessCapabilities";

export type LanguageCode = "en" | "sw";

type LocalizedCopy = Record<LanguageCode, string>;

export type NavGroup =
  | "overview"
  | "operations"
  | "relationships"
  | "money"
  | "people"
  | "insights"
  | "management"
  | "administration";

export type AppNavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  group: NavGroup;
  mobileLabel?: LocalizedCopy;
  capability?: Parameters<typeof hasCapability>[1];
};

export const NAV_GROUP_LABELS: Record<NavGroup, Record<LanguageCode, string>> = {
  overview: { en: "Overview", sw: "Muhtasari" },
  operations: { en: "Operations", sw: "Shughuli za Biashara" },
  relationships: { en: "Relationships", sw: "Mahusiano (CRM & SRM)" },
  money: { en: "Finance & Accounting", sw: "Fedha na Hesabu" },
  people: { en: "Human Resources", sw: "Rasilimali Watu (HRM)" },
  insights: { en: "Reports & Analytics", sw: "Ripoti na Takwimu" },
  management: { en: "Enterprise Assets", sw: "Mali na Usimamizi" },
  administration: { en: "Administration", sw: "Utawala wa Mfumo" },
};

export const OLLY_NAVIGATION_ITEMS: AppNavItem[] = [
  // Overview
  { to: "/dashboard", group: "overview", labelKey: "nav.overview", icon: LayoutDashboard, mobileLabel: { en: "Home", sw: "Nyumbani" } },

  // Operations
  { to: "/sales", group: "operations", labelKey: "nav.sales", icon: Tag, mobileLabel: { en: "Sales", sw: "Mauzo" } },
  { to: "/inventory", group: "operations", labelKey: "nav.inventory", icon: Package, mobileLabel: { en: "Stock", sw: "Stoki" } },
  { to: "/purchases", group: "operations", labelKey: "nav.purchases", icon: ShoppingCart, mobileLabel: { en: "Purchases", sw: "Manunuzi" } },
  { to: "/orders", group: "operations", labelKey: "nav.orders", icon: ClipboardList, mobileLabel: { en: "Orders", sw: "Maagizo" } },
  { to: "/recycle-bin", group: "operations", labelKey: "nav.recycleBin", icon: Trash2, mobileLabel: { en: "Recycle Bin", sw: "Jalada la Taka" } },
  { to: "/production", group: "operations", labelKey: "nav.production", icon: Factory, mobileLabel: { en: "Production", sw: "Uzalishaji" }, capability: "manufacturing" },
  { to: "/appointments", group: "operations", labelKey: "nav.appointments", icon: CalendarDays, mobileLabel: { en: "Calendar", sw: "Kalenda" }, capability: "appointments" },

  // Relationships
  { to: "/customers", group: "relationships", labelKey: "nav.customers", icon: Users, mobileLabel: { en: "Customers", sw: "Wateja" } },
  { to: "/suppliers", group: "relationships", labelKey: "nav.suppliers", icon: Boxes, mobileLabel: { en: "Suppliers", sw: "Wasambazaji" } },

  // Money
  { to: "/expenses", group: "money", labelKey: "nav.finance", icon: DollarSign, mobileLabel: { en: "Finance", sw: "Fedha" } },

  // People
  { to: "/hrm", group: "people", labelKey: "nav.hrm", icon: UsersRound, mobileLabel: { en: "HR", sw: "HR" } },

  // Insights
  { to: "/reports", group: "insights", labelKey: "nav.reports", icon: FileText, mobileLabel: { en: "Reports", sw: "Ripoti" } },

  // Management
  { to: "/categories", group: "management", labelKey: "nav.categories", icon: FolderTree, mobileLabel: { en: "Categories", sw: "Makundi" } },
  { to: "/loyalty", group: "management", labelKey: "nav.loyalty", icon: Heart, mobileLabel: { en: "Loyalty", sw: "Uaminifu" } },
  { to: "/assets", group: "management", labelKey: "nav.assets", icon: Landmark, mobileLabel: { en: "Assets", sw: "Mali" } },
  { to: "/todo", group: "management", labelKey: "nav.todo", icon: ClipboardCheck, mobileLabel: { en: "To-do", sw: "Kazi" } },
  { to: "/notifications", group: "management", labelKey: "nav.notifications", icon: Bell, mobileLabel: { en: "Alerts", sw: "Arifa" } },

  // Administration
  { to: "/user-management", group: "administration", labelKey: "nav.userManagement", icon: UserCog, mobileLabel: { en: "Users", sw: "Watumiaji" } },
  { to: "/settings", group: "administration", labelKey: "nav.settings", icon: Settings, mobileLabel: { en: "Settings", sw: "Mipangilio" } },
];

/** All active ERP groups shown directly in navigation */
export const PRIMARY_GROUPS: NavGroup[] = [
  "overview",
  "operations",
  "relationships",
  "money",
  "people",
  "insights",
  "management",
  "administration",
];

/** Mobile bottom nav — 4 primary destinations + Menu */
export const MOBILE_PRIMARY_NAV: AppNavItem[] = [
  OLLY_NAVIGATION_ITEMS.find((i) => i.to === "/dashboard")!,
  OLLY_NAVIGATION_ITEMS.find((i) => i.to === "/sales")!,
  OLLY_NAVIGATION_ITEMS.find((i) => i.to === "/inventory")!,
  OLLY_NAVIGATION_ITEMS.find((i) => i.to === "/customers")!,
];

const MOBILE_FOCUS_ROUTES = [
  { pattern: "/inventory/add", backTo: "/inventory" },
  { pattern: "/inventory/receive", backTo: "/inventory" },
  { pattern: "/customers/:id", backTo: "/customers" },
  { pattern: "/suppliers/:id", backTo: "/purchases" },
];

export function filterItemsByAccess(
  items: AppNavItem[],
  _allowedPages?: string[],
  capabilities?: unknown,
  _role?: string | null,
) {
  // Filter by shop capabilities (e.g. manufacturing/appointments),
  // while keeping ERP navigation accessible so clicking restricted tabs displays the restriction banner
  return items.filter((item) => !item.capability || hasCapability(capabilities, item.capability));
}

export function groupNavItems(items: AppNavItem[]): Map<NavGroup, AppNavItem[]> {
  const groups = new Map<NavGroup, AppNavItem[]>();
  for (const item of items) {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group)!.push(item);
  }
  return groups;
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
