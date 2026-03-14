import { describe, expect, it } from "vitest";
import { buildCategoryChartData, buildSalesTrendData } from "@/pages/dashboard/chartData";

describe("dashboard chart helpers", () => {
  it("builds a complete sales trend across the selected range", () => {
    const result = buildSalesTrendData(
      [
        { created_at: "2026-03-10T10:00:00Z", total: 1200 },
        { created_at: "2026-03-10T13:00:00Z", total: "800" },
        { created_at: "2026-03-12T09:30:00Z", total: 500 },
      ],
      "2026-03-10",
      "2026-03-12",
    );

    expect(result).toEqual([
      { day: "10 Mar", sales: 2000 },
      { day: "11 Mar", sales: 0 },
      { day: "12 Mar", sales: 500 },
    ]);
  });

  it("sanitizes category chart data and removes empty buckets", () => {
    const result = buildCategoryChartData(
      [
        { name: " Drinks ", value: "8", color: "#111111" },
        { name: "", value: 0, color: "#222222" },
        { name: null, value: 3, color: null },
      ],
      ["#0D9488", "#D97706"],
    );

    expect(result).toEqual([
      { name: "Drinks", value: 8, color: "#111111" },
      { name: "Uncategorized", value: 3, color: "#0D9488" },
    ]);
  });
});
