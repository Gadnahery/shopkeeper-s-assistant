import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  hasValidSupabaseEnv: false,
}));

vi.mock("@/contexts/PWAContext", () => ({
  PWAProvider: ({ children }: { children: ReactNode }) => children,
}));

const { default: App } = await import("../App");

describe("App", () => {
  it("shows setup instructions when Supabase env vars are missing", () => {
    render(<App />);

    expect(screen.getByText("Setup required")).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_SUPABASE_ANON_KEY/)).toBeInTheDocument();
  });
});
