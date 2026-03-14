import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../pages/NotFound";
import { LanguageProvider } from "../contexts/LanguageContext";

function renderWithProviders() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <NotFound />
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe("NotFound", () => {
  it("shows 404 message", () => {
    renderWithProviders();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Page not found|Ukurasa haukupatikana/)).toBeInTheDocument();
  });

  it("has link back to dashboard", () => {
    renderWithProviders();
    const link = screen.getByRole("link", { name: /Back to Dashboard|Rudi kwenye Dashibodi/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });
});
