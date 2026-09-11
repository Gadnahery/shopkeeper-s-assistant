import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SalesHistoryView } from "@/components/sales/SalesHistoryView";
import { AddProductModal } from "@/components/sales/AddProductModal";

const mockDeleteSaleMutateAsync = vi.fn();
const mockCreateProductMutateAsync = vi.fn();

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) => key,
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    shopId: "test-shop-id",
    profile: { full_name: "Test Shop Owner", shop_id: "test-shop-id" },
    role: "owner",
    isOwner: true,
  }),
}));

vi.mock("@/hooks/useShopFormatting", () => ({
  useShopFormatting: () => ({
    formatMoney: (val: number) => `TSH ${val.toLocaleString()}`,
    formatDate: (d: any) => "11 Sep 2026",
  }),
}));

vi.mock("@/hooks/useShopSettings", () => ({
  useShopSettings: () => ({
    data: { name: "Test Store", currency: "TSH" },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: [{ id: "cat-1", name: "Groceries" }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useCreateProduct: () => ({
    mutateAsync: mockCreateProductMutateAsync,
    isPending: false,
  }),
}));

const mockSalesData = [
  {
    id: "sale-1",
    invoice_number: "INV-0001",
    created_at: new Date().toISOString(),
    customer_name: "Amina Juma",
    payment_method: "Cash",
    total: 25000,
    subtotal: 25000,
    status: "completed",
    sale_items: [
      { product_id: "p-1", product_name: "Twiga Cement 50kg", quantity: 1, unit_price: 25000 },
    ],
  },
];

vi.mock("@/hooks/useSales", () => ({
  useSales: () => ({
    data: mockSalesData,
    isLoading: false,
  }),
  useDeleteSale: () => ({
    mutateAsync: mockDeleteSaleMutateAsync,
    isPending: false,
  }),
}));

describe("Sales History & POS Quick Add Product Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles clicking Custom Date without crashing with undefined reading 'en'", async () => {
    render(
      <MemoryRouter>
        <SalesHistoryView onAddSale={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Sales History")).toBeInTheDocument();

    // Click "Custom Date" calendar trigger button
    const customDateBtn = screen.getByRole("button", { name: /custom date/i });
    expect(customDateBtn).toBeInTheDocument();

    // Clicking custom date should NOT throw or display error boundary
    fireEvent.click(customDateBtn);

    // Verify view is still mounted and showing prompt or calendar selector
    expect(screen.getByText("Select date range from calendar")).toBeInTheDocument();
  });

  it("opens Delete Sale confirmation dialog and calls deleteSale on confirm", async () => {
    mockDeleteSaleMutateAsync.mockResolvedValueOnce({ success: true, invoice_number: "INV-0001" });

    render(
      <MemoryRouter>
        <SalesHistoryView onAddSale={vi.fn()} />
      </MemoryRouter>
    );

    // Find the Delete Sale button (trash icon)
    const deleteBtn = screen.getByTitle("Delete Sale");
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    // Verify confirmation modal opens with warning about inventory and metrics
    expect(screen.getByText("Delete Sale Record?")).toBeInTheDocument();
    expect(
      screen.getByText(/Sold item quantities will be automatically restored back to inventory stock/)
    ).toBeInTheDocument();

    // Click confirmation button
    const confirmDeleteBtn = screen.getByText("Delete Sale & Restore Stock");
    fireEvent.click(confirmDeleteBtn);

    expect(mockDeleteSaleMutateAsync).toHaveBeenCalledWith("sale-1");
  });

  it("allows quick creation of a product within AddProductModal", async () => {
    mockCreateProductMutateAsync.mockResolvedValueOnce({
      id: "new-p-1",
      name: "Sugar 1kg",
      selling_price: 3000,
      stock: 50,
      item_type: "product",
    });

    const onProductCreated = vi.fn();

    render(
      <AddProductModal
        open={true}
        onOpenChange={vi.fn()}
        onProductCreated={onProductCreated}
      />
    );

    expect(screen.getByText("Quick Add Product / Service")).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e.g. Wheat Flour 2kg/i);
    fireEvent.change(nameInput, { target: { value: "Sugar 1kg" } });

    const priceInputs = screen.getAllByPlaceholderText("0");
    fireEvent.change(priceInputs[0], { target: { value: "3000" } });

    const submitBtn = screen.getByRole("button", { name: /Save Product/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateProductMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sugar 1kg",
          selling_price: 3000,
          item_type: "product",
        })
      );
      expect(onProductCreated).toHaveBeenCalled();
    });
  });
});
