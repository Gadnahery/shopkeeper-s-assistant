/**
 * Preload route chunks on hover so navigation feels instant.
 * Maps pathname to the same dynamic import used by App.tsx lazy().
 */
const preloaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/LandingPage"),
  "/login": () => import("@/pages/LoginPage"),
  "/signup": () => import("@/pages/SignupPage"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/billing": () => import("@/pages/Billing"),
  "/sales": () => import("@/pages/Sales"),
  "/inventory": () => import("@/pages/Inventory"),
  "/inventory/add": () => import("@/pages/AddProduct"),
  "/inventory/receive": () => import("@/pages/ReceiveStock"),
  "/categories": () => import("@/pages/Categories"),
  "/orders": () => import("@/pages/Orders"),
  "/todo": () => import("@/pages/Todo"),
  "/customers": () => import("@/pages/Customers"),
  "/suppliers": () => import("@/pages/Suppliers"),
  "/expenses": () => import("@/pages/Expenses"),
  "/hrm": () => import("@/pages/HRM"),
  "/user-management": () => import("@/pages/UserManagement"),
  "/assets": () => import("@/pages/Assets"),
  "/reports": () => import("@/pages/Reports"),
  "/loyalty": () => import("@/pages/Loyalty"),
  "/notifications": () => import("@/pages/Notifications"),
  "/settings": () => import("@/pages/Settings"),
};

export function preloadRoute(path: string): void {
  const loader = preloaders[path];
  if (loader) void loader();
}
