import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/LoginPage";
import { toast } from "sonner";
import { getShopUsers } from "@/hooks/useShopUsers";
import { supabase } from "@/integrations/supabase/client";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockSignIn = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    user: null,
    session: null,
    loading: false,
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
  }),
}));

describe("Deleted User Login & User List Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("displays 'account does not exist or has been deleted' when signing in with a deleted account", async () => {
    mockSignIn.mockResolvedValueOnce({
      error: new Error("ACCOUNT_DOES_NOT_EXIST"),
    });

    render(
      <MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("owner@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "deleted@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("deleted@example.com", "password123");
    });

    expect(toast.error).toHaveBeenCalledWith("This account does not exist or has been deleted.");
    expect(screen.queryByText("Dashboard")).toBeNull();
  });

  it("filters out deleted users without a role in user_roles and users marked in local tombstones", async () => {
    const shopId = "test-shop-123";

    // Mock profiles: active user, deleted user whose role was removed, and tombstoned user
    const mockProfiles = [
      { id: "p1", user_id: "u1", full_name: "Active Staff", email: "active@test.com", created_at: "2026-01-01" },
      { id: "p2", user_id: "u2", full_name: "Deleted Staff No Role", email: "deleted@test.com", created_at: "2026-01-02" },
      { id: "p3", user_id: "u3", full_name: "Tombstoned Staff", email: "tombstoned@test.com", created_at: "2026-01-03" },
    ];

    // user_roles only has u1 and u3 (u2 was deleted from DB, u3 is tombstoned locally)
    const mockRoles = [
      { user_id: "u1", role: "cashier" },
      { user_id: "u3", role: "cashier" },
    ];

    // Set tombstone for u3
    localStorage.setItem(`wisecash_deleted_users_${shopId}`, JSON.stringify(["u3"]));

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockProfiles, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "user_roles") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockRoles, error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    const activeUsers = await getShopUsers(shopId);

    // Only u1 should be returned! u2 has no user_roles, u3 is in deleted tombstone
    expect(activeUsers).toHaveLength(1);
    expect(activeUsers[0].user_id).toBe("u1");
    expect(activeUsers[0].full_name).toBe("Active Staff");
  });
});
