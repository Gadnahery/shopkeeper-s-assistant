import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
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

import LandingPage from "@/pages/LandingPage";

function renderLanding() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <LandingPage />
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe("Redesigned LandingPage Component", () => {
  it("renders the hero headline and value proposition cleanly", () => {
    renderLanding();
    // New hero: "Know your business. Grow with confidence." (EN)
    // or "Jua biashara yako. Kua kwa ujasiri." (SW)
    const hasEnglishHero = screen.queryByText(/Know your business/i);
    const hasSwahiliHero = screen.queryByText(/Jua biashara yako/i);
    expect(hasEnglishHero || hasSwahiliHero).toBeTruthy();
  });

  it("renders the navbar CTA start free link", () => {
    renderLanding();
    // New nav CTA: "Start free" (EN) or "Anza bure" (SW)
    const ctaLinks = screen.getAllByRole("link", { name: /Start free|Anza bure/i });
    expect(ctaLinks.length).toBeGreaterThan(0);
  });

  it("renders the WISECASH brand name in the nav", () => {
    renderLanding();
    const brandElements = screen.getAllByText(/WISECASH/i);
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it("renders the pricing section with correct monthly amount", () => {
    renderLanding();
    // Pricing section shows TZS 25,000/month
    const pricingElements = screen.getAllByText(/25,000/i);
    expect(pricingElements.length).toBeGreaterThan(0);
  });

  it("renders the offline section with keep selling message", () => {
    renderLanding();
    const offlineMsgs = [
      ...screen.queryAllByText(/Keep selling/i),
      ...screen.queryAllByText(/Endelea Kuuza/i),
    ];
    expect(offlineMsgs.length).toBeGreaterThan(0);
  });
});

