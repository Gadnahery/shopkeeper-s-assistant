import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

vi.mock("@/contexts/PWAContext", () => ({
  PWAProvider: ({ children }: { children: ReactNode }) => children,
  usePWAContext: () => ({
    install: vi.fn(),
    isInstalled: false,
    isInstallable: true,
  }),
}));

beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

import LandingPreview from "@/pages/LandingPreview";

function renderPreview() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <LandingPreview />
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe("LandingPreview Visual Redesign Component", () => {
  it("renders the hero headline and value proposition cleanly", () => {
    renderPreview();
    const hasSwahiliHero = screen.queryByText(/Acha Kubahatisha Faida Yako/i);
    const hasEnglishHero = screen.queryByText(/Stop Guessing Your Profit/i);
    expect(hasSwahiliHero || hasEnglishHero).toBeTruthy();
    expect(screen.getAllByText(/Siku 14|14-Day/i).length).toBeGreaterThan(0);
  });

  it("renders the desktop browser mockup with live KPI stats", () => {
    renderPreview();
    expect(screen.getByText(/wisecash.app\/dashboard/i)).toBeDefined();
    expect(screen.getByText(/TZS 1,480,000/i)).toBeDefined();
    expect(screen.getByText(/TZS 420,000/i)).toBeDefined();
    expect(screen.getByText(/TZS 1,130,000/i)).toBeDefined();
  });

  it("switches tabs in the interactive product showcase", async () => {
    renderPreview();
    const inventoryTab = screen.getByRole("button", { name: /Stoki|Inventory/i });
    fireEvent.click(inventoryTab);

    await waitFor(() => {
      expect(screen.getByText(/Orodha ya Stoki|Stock Inventory Ledger/i)).toBeDefined();
    });
  });

  it("renders the single plan pricing card and offline flow", () => {
    renderPreview();
    expect(screen.getByText(/WiseCash Pro/i)).toBeDefined();
    expect(screen.getAllByText(/TZS 25,000/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Endelea Kuuza|Keep Selling/i)).toBeDefined();
  });
});
