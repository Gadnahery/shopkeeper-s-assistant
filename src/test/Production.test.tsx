import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Production from "@/pages/Production";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "sw",
    t: (key: string) => {
      const dict: Record<string, string> = {
        "production.title": "Uzalishaji na Utengenezaji",
        "production.activeRuns": "Awamu Zinazoendelea",
        "production.completedToday": "Zilizokamilika Leo",
        "production.totalOutput": "Jumla Iliyozalishwa",
        "production.materialCost": "Gharama ya Malighafi",
        "production.batchNumber": "Namba ya Awamu",
        "production.outputProduct": "Bidhaa ya Mwisho",
        "production.rawMaterials": "Malighafi Zilizotumika",
        "production.statusPlanned": "Imepangwa",
        "production.statusInProgress": "Inaendelea",
        "production.statusCompleted": "Imekamilika",
        "production.statusCancelled": "Imeghairiwa",
        "production.newRun": "+ Awamu Mpya ya Uzalishaji",
        "production.startRun": "Anza",
        "production.completeRun": "Kamilisha",
        "common.cancel": "Ghairi",
      };
      return dict[key] || key;
    },
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-test" },
    shopId: "shop-test",
    profile: { full_name: "Test User" },
  }),
}));

vi.mock("@/hooks/useProduction", () => ({
  useProductionBatches: () => ({
    data: [
      {
        id: "batch-1",
        shop_id: "shop-test",
        batch_number: "BAT-001042",
        output_product_id: "prod-out",
        output_product_name: "Finished Chair",
        output_product_code: "CHR-01",
        quantity_to_produce: 10,
        quantity_produced: 0,
        input_materials: [
          {
            product_id: "prod-in-1",
            product_name: "Timber Wood",
            product_code: "TMB-01",
            quantity: 5,
            unit_cost: 15000,
            total_cost: 75000,
          },
        ],
        total_cost: 75000,
        status: "planned",
        notes: "Shift A run",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
  useCreateProductionBatch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCompleteProductionBatch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateBatchStatus: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    data: [
      { id: "prod-out", name: "Finished Chair", code: "CHR-01", stock: 5, buying_price: 10000 },
      { id: "prod-in-1", name: "Timber Wood", code: "TMB-01", stock: 50, buying_price: 15000 },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useShopFormatting", () => ({
  useShopFormatting: () => ({
    currency: "TSH",
    formatMoney: (val: number) => `TSH ${val.toLocaleString()}`,
    formatNumber: (val: number) => val.toLocaleString(),
  }),
}));

describe("Production Page Component", () => {
  it("renders production KPI cards and batch list correctly", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Production />
      </MemoryRouter>,
    );

    expect(screen.getByText("Awamu Zinazoendelea")).toBeInTheDocument();
    expect(screen.getAllByText("BAT-001042").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Finished Chair").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TSH 75,000").length).toBeGreaterThan(0);
  });
});
