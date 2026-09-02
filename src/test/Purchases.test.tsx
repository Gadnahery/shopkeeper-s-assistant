import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Purchases from "@/pages/Purchases";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "sw",
    t: (key: string) => {
      const dict: Record<string, string> = {
        "purchases.title": "Manunuzi na Stoki",
        "purchases.totalPurchases": "Jumla ya Manunuzi",
        "purchases.activeSuppliers": "Wasambazaji Hai",
        "purchases.tabOrders": "Maagizo ya Stoki",
        "purchases.tabSuppliers": "Wasambazaji",
        "purchases.newPurchase": "+ Ununuzi Mpya",
        "purchases.noPurchases": "Hakuna rekodi za manunuzi bado",
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

vi.mock("@/hooks/usePurchases", () => ({
  usePurchases: () => ({
    data: [
      {
        id: "po-1",
        shop_id: "shop-test",
        supplier_id: "sup-1",
        supplier_name: "Twiga Cement Ltd",
        supplier_phone: "0712345678",
        notes: "Delivery batch #1",
        status: "received",
        total_amount: 500000,
        items_count: 2,
        items: [
          {
            id: "item-1",
            product_id: "prod-1",
            product_name: "Cement 50kg",
            quantity: 20,
            buying_price: 25000,
            total: 500000,
          },
        ],
        created_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
  useCreatePurchase: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    data: [{ id: "prod-1", name: "Cement 50kg", code: "CEM-50", stock: 20, buying_price: 25000 }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useSuppliers", () => ({
  useSuppliers: () => ({
    data: [{ id: "sup-1", name: "Twiga Cement Ltd", phone: "0712345678", pending_payment: 0 }],
    isLoading: false,
  }),
  useCreateSupplier: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useShopFormatting", () => ({
  useShopFormatting: () => ({
    currency: "TSH",
    formatMoney: (val: number) => `TSH ${val.toLocaleString()}`,
    formatNumber: (val: number) => val.toLocaleString(),
  }),
}));

describe("Purchases Page Component", () => {
  it("renders KPI cards and purchase order rows properly", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Purchases />
      </MemoryRouter>,
    );

    expect(screen.getByText("Jumla ya Manunuzi")).toBeInTheDocument();
    expect(screen.getAllByText("Twiga Cement Ltd").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TSH 500,000").length).toBeGreaterThan(0);
  });
});
