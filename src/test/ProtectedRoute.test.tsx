import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const authState = vi.hoisted(() => ({
  user: null as null | { id: string },
  session: null as null | { access_token: string },
  loading: false,
  role: null as null | "owner" | "manager" | "cashier" | "staff" | "hr",
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

vi.mock("@/hooks/useUserPageAccess", () => ({
  useMyPageAccess: () => accessState,
}));

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

  it("redirects users without the required role back to the dashboard", () => {
    authState.user = { id: "user-2" };
    authState.session = { access_token: "token-2" };
    authState.role = "cashier";

    renderProtectedRoute("/settings", ["owner", "manager"]);

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("allows authenticated users through even when billing is marked locked", () => {
    authState.user = { id: "user-3" };
    authState.session = { access_token: "token-3" };
    subscriptionState.isBillingLocked = true;

    renderProtectedRoute();

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
