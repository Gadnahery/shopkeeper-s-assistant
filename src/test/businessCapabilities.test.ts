import { describe, expect, it } from "vitest";
import { resolveCapabilities } from "@/lib/businessCapabilities";

describe("business capabilities", () => {
  it("fills missing flags from universal defaults", () => {
    const capabilities = resolveCapabilities({ services: true, inventory: false });

    expect(capabilities.services).toBe(true);
    expect(capabilities.inventory).toBe(false);
    expect(capabilities.sales).toBe(true);
    expect(capabilities.appointments).toBe(false);
  });

  it("ignores invalid capability values", () => {
    const capabilities = resolveCapabilities({ services: "yes", sales: null });

    expect(capabilities.services).toBe(false);
    expect(capabilities.sales).toBe(true);
  });
});
