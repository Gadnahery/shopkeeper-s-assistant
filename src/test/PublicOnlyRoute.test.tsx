import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicOnlyRoute } from "@/components/PublicOnlyRoute";

const authState = vi.hoisted(() => ({
  user: null as null | { id: string },
  session: null as null | { access_token: string },
  loading: false,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

function renderPublicRoute() {
  return render(
    <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <div>Public Login Content</div>
            </PublicOnlyRoute>
          }
        />
        <Route path="/dashboard" element={<div>Dashboard Destination</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PublicOnlyRoute", () => {
  beforeEach(() => {
    authState.user = null;
    authState.session = null;
    authState.loading = false;
  });

  it("shows loader and does not render public content while auth is loading", () => {
    authState.loading = true;
    renderPublicRoute();

    expect(screen.queryByText("Public Login Content")).toBeNull();
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("redirects authenticated user to dashboard immediately without showing public content", () => {
    authState.user = { id: "user-123" };
    authState.session = { access_token: "token-abc" };
    renderPublicRoute();

    expect(screen.queryByText("Public Login Content")).toBeNull();
    expect(screen.getByText("Dashboard Destination")).toBeTruthy();
  });

  it("renders public children when user is not authenticated and auth has resolved", () => {
    authState.user = null;
    authState.session = null;
    authState.loading = false;
    renderPublicRoute();

    expect(screen.getByText("Public Login Content")).toBeTruthy();
    expect(screen.queryByText("Dashboard Destination")).toBeNull();
  });
});
