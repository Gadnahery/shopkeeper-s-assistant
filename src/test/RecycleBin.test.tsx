import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecycleBin from "@/pages/RecycleBin";
import { OLLY_NAVIGATION_ITEMS } from "@/components/layout/app-navigation";

const mockRestoreMutateAsync = vi.fn();
const mockDeletePermanentlyMutateAsync = vi.fn();
const mockEmptyBinMutateAsync = vi.fn();

const mockItems = [
  {
    id: "bin-1",
    shop_id: "shop-123",
    entity_type: "sales",
    entity_id: "sale-uuid-1",
    item_name: "INV-2026-0001",
    item_details: { total: 18700, payment_method: "Cash", items_count: 2 },
    original_data: { sale: { id: "sale-uuid-1" }, sale_items: [] },
    deleted_by: "user-1",
    deleted_by_name: "Mary Mlay",
    deleted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days left
  },
  {
    id: "bin-2",
    shop_id: "shop-123",
    entity_type: "products",
    entity_id: "prod-uuid-1",
    item_name: "Panadol Extra",
    item_details: { selling_price: 3500, stock: 15, category: "Medicine" },
    original_data: { id: "prod-uuid-1", name: "Panadol Extra" },
    deleted_by: "user-1",
    deleted_by_name: "Mary Mlay",
    deleted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days left
  },
];

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    role: "owner",
    shopId: "shop-123",
  }),
}));

vi.mock("@/hooks/useShopFormatting", () => ({
  useShopFormatting: () => ({
    formatMoney: (val: number) => `TZS ${val.toLocaleString()}`,
    formatNumber: (val: number) => `${val}`,
    formatDate: (val: any) => `${val}`,
    currency: "TZS",
    locale: "en-TZ",
  }),
}));

vi.mock("@/hooks/useRecycleBin", () => ({
  useRecycleBinItems: vi.fn(() => ({
    data: mockItems,
    isLoading: false,
    isRefetching: false,
  })),
  useRestoreRecycleBinItem: () => ({
    mutateAsync: mockRestoreMutateAsync,
    isPending: false,
  }),
  usePermanentDeleteRecycleBinItem: () => ({
    mutateAsync: mockDeletePermanentlyMutateAsync,
    isPending: false,
  }),
  useEmptyRecycleBin: () => ({
    mutateAsync: mockEmptyBinMutateAsync,
    isPending: false,
  }),
}));

describe("Recycle Bin Module Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers /recycle-bin under the operations navigation group", () => {
    const recycleBinNavItem = OLLY_NAVIGATION_ITEMS.find((item) => item.to === "/recycle-bin");
    expect(recycleBinNavItem).toBeDefined();
    expect(recycleBinNavItem?.group).toBe("operations");
    expect(recycleBinNavItem?.labelKey).toBe("nav.recycleBin");
  });

  it("renders the Recycle Bin page with 7-day retention policy and deleted items", () => {
    render(
      <MemoryRouter>
        <RecycleBin />
      </MemoryRouter>
    );

    expect(screen.getByText("Recycle Bin")).toBeInTheDocument();
    expect(screen.getByText(/7-day retention policy/i)).toBeInTheDocument();
    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Panadol Extra")).toBeInTheDocument();
  });

  it("opens confirmation dialog and restores item upon confirmation", async () => {
    mockRestoreMutateAsync.mockResolvedValueOnce({ success: true, item_name: "INV-2026-0001" });

    render(
      <MemoryRouter>
        <RecycleBin />
      </MemoryRouter>
    );

    const restoreButtons = screen.getAllByRole("button", { name: /restore/i });
    expect(restoreButtons.length).toBeGreaterThan(0);
    fireEvent.click(restoreButtons[0]);

    // Check dialog opens
    expect(screen.getByText("Restore This Record?")).toBeInTheDocument();

    // Confirm restoration
    const confirmBtn = screen.getByRole("button", { name: "Restore Now" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRestoreMutateAsync).toHaveBeenCalledWith("bin-1");
    });
  });

  it("opens confirmation dialog and permanently deletes item upon confirmation", async () => {
    mockDeletePermanentlyMutateAsync.mockResolvedValueOnce({ success: true, bin_id: "bin-2" });

    render(
      <MemoryRouter>
        <RecycleBin />
      </MemoryRouter>
    );

    // Click trash button on second item
    const deleteButtons = screen.getAllByRole("button", { name: /delete permanently/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[1]);

    // Check dialog opens
    expect(screen.getByText("Permanently Delete Record?")).toBeInTheDocument();

    const confirmPermanentBtn = screen.getByRole("button", { name: "Delete Permanently" });
    fireEvent.click(confirmPermanentBtn);

    await waitFor(() => {
      expect(mockDeletePermanentlyMutateAsync).toHaveBeenCalledWith("bin-2");
    });
  });
});
