import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const authState = vi.hoisted(() => ({
  user: null as null | { id: string },
  session: null as null | { access_token: string },
  loading: false,
  role: null as null | "owner" | "manager" | "cashier" | "staff" | "hr",
  profile: undefined as any,
  shopId: undefined as any,
  signOut: vi.fn(),
}));

const accessState = vi.hoisted(() => ({
  data: ["/dashboard", "/settings"],
  isLoading: false,
}));

const subscriptionState = vi.hoisted(() => ({
  isBillingLocked: false,
  isLoading: false,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useUserPageAccess", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useUserPageAccess")>();
  return {
    ...actual,
    useMyPageAccess: () => accessState,
  };
});

vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscription: () => subscriptionState,
}));

function renderProtectedRoute(route = "/dashboard", allowedRoles?: Array<"owner" | "manager" | "cashier" | "staff" | "hr">) {
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard content</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Settings content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState.user = null;
    authState.session = null;
    authState.loading = false;
    authState.role = null;
    authState.profile = undefined;
    authState.shopId = undefined;
    accessState.data = ["/dashboard", "/settings"];
    accessState.isLoading = false;
    subscriptionState.isBillingLocked = false;
    subscriptionState.isLoading = false;
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute();

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders the protected content for authenticated users with access", () => {
    authState.user = { id: "user-1" };
    authState.session = { access_token: "token-1" };

    renderProtectedRoute();

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("shows restriction view when user does not have the required role", () => {
    authState.user = { id: "user-2" };
    authState.session = { access_token: "token-2" };
    authState.role = "cashier";

    renderProtectedRoute("/settings", ["owner", "manager"]);

    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
  });

  it("shows restriction view when page is not in user's allowed paths", () => {
    authState.user = { id: "user-2" };
    authState.session = { access_token: "token-2" };
    authState.role = "cashier";
    accessState.data = ["/dashboard"];

    renderProtectedRoute("/settings");

    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
  });

  it("shows restriction view when user has no permissions (empty allowed paths)", () => {
    authState.user = { id: "user-4" };
    authState.session = { access_token: "token-4" };
    authState.role = "staff";
    accessState.data = [];

    renderProtectedRoute("/dashboard");

    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
  });

  it("shows deactivated account view when user was removed from the shop", () => {
    authState.user = { id: "user-5" };
    authState.session = { access_token: "token-5" };
    authState.role = null;
    authState.profile = null;
    authState.shopId = null;

    renderProtectedRoute("/dashboard");

    expect(screen.getByText("Account Does Not Exist or Has Been Deleted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to login/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /return to dashboard/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /go back/i })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("allows authenticated users through even when billing is marked locked", () => {
    authState.user = { id: "user-3" };
    authState.session = { access_token: "token-3" };
    subscriptionState.isBillingLocked = true;

    renderProtectedRoute();

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
