import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Inventory from "@/pages/Inventory";
import Sales from "@/pages/Sales";

const mockCreateProductMutateAsync = vi.fn();
const mockUpdateProductMutateAsync = vi.fn();
const mockDeleteProductMutateAsync = vi.fn();
const mockCreateSaleMutateAsync = vi.fn();

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) => {
      const dict: Record<string, string> = {
        "inventory.title": "Inventory & Stock",
        "inventory.addProduct": "Add Item",
        "inventory.name": "Product Name",
        "inventory.code": "Code / SKU",
        "inventory.category": "Category",
        "inventory.buyingPrice": "Buying Price",
        "inventory.sellingPrice": "Selling Price",
        "inventory.stock": "Stock Quantity",
        "inventory.totalStockValue": "Total Stock Value",
        "sales.title": "Point of Sale",
        "sales.cart": "Cart",
        "sales.searchOrScan": "Search or scan...",
        "sales.customer": "Customer",
        "sales.completeSale": "Complete Sale",
        "common.cancel": "Cancel",
      };
      return dict[key] || key;
    },
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    shopId: "test-shop-id",
    profile: { full_name: "Test Shop Owner", shop_id: "test-shop-id" },
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { shop_id: "test-shop-id" },
          }),
        }),
      }),
    }),
  },
}));

const mockProducts = [
  {
    id: "p-1",
    shop_id: "test-shop-id",
    code: "CEM-01",
    barcode: "CEM-01",
    name: "Twiga Cement 50kg",
    buying_price: 20000,
    selling_price: 24000,
    stock: 50,
    low_stock_alert: 5,
    item_type: "product",
    track_inventory: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-2",
    shop_id: "test-shop-id",
    code: "SRV-WASH",
    barcode: "SRV-WASH",
    name: "Car Wash Full Service",
    buying_price: 0,
    selling_price: 15000,
    stock: 0,
    low_stock_alert: 0,
    item_type: "service",
    track_inventory: false,
    duration_minutes: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-3",
    shop_id: "test-shop-id",
    code: "PRD-COKE",
    barcode: "PRD-COKE",
    name: "Coca Cola 500ml",
    buying_price: 1000,
    selling_price: 1500,
    stock: 100,
    low_stock_alert: 10,
    item_type: "product",
    track_inventory: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-4",
    shop_id: "test-shop-id",
    code: "SRV-HAIRCUT",
    barcode: "SRV-HAIRCUT",
    name: "Haircut & Shave",
    buying_price: 0,
    selling_price: 10000,
    stock: 0,
    low_stock_alert: 0,
    item_type: "service",
    track_inventory: false,
    duration_minutes: 30,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-5",
    shop_id: "test-shop-id",
    code: "PRD-SOAP",
    barcode: "PRD-SOAP",
    name: "Omo Laundry Powder 1kg",
    buying_price: 3500,
    selling_price: 4500,
    stock: 25,
    low_stock_alert: 5,
    item_type: "product",
    track_inventory: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-6",
    shop_id: "test-shop-id",
    code: "PRD-OIL",
    barcode: "PRD-OIL",
    name: "Cooking Oil 1L",
    buying_price: 4000,
    selling_price: 5200,
    stock: 30,
    low_stock_alert: 5,
    item_type: "product",
    track_inventory: true,
    created_at: new Date().toISOString(),
  },
];

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    data: mockProducts,
    isLoading: false,
  }),
  useCreateProduct: () => ({
    mutateAsync: mockCreateProductMutateAsync,
    isPending: false,
  }),
  useUpdateProduct: () => ({
    mutateAsync: mockUpdateProductMutateAsync,
    isPending: false,
  }),
  useDeleteProduct: () => ({
    mutateAsync: mockDeleteProductMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: [
      { id: "cat-1", name: "Construction" },
      { id: "cat-2", name: "Auto Services" },
      { id: "cat-3", name: "Groceries" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: () => ({
    data: [{ id: "cust-1", name: "John Doe", phone: "0711223344" }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useSales", () => ({
  useCreateSale: () => ({
    mutateAsync: mockCreateSaleMutateAsync,
    isPending: false,
  }),
  useSales: () => ({
    data: [],
    isLoading: false,
  }),
  useDraftSales: () => ({ data: [], isLoading: false }),
  useSaveDraftSale: () => ({ mutateAsync: vi.fn() }),
  useDeleteDraftSale: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/useOrders", () => ({
  useOrders: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/useShopSettings", () => ({
  useShopSettings: () => ({
    data: { name: "Test Store", currency: "TSH" },
    isLoading: false,
  }),
}));

describe("Inventory & Product Creation Database Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both products and services with badges in Inventory", async () => {
    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    // Check that physical product and service are rendered
    expect(screen.getAllByText("Twiga Cement 50kg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Car Wash Full Service").length).toBeGreaterThan(0);

    // Check service badges
    const serviceBadges = screen.getAllByText(/service/i);
    expect(serviceBadges.length).toBeGreaterThan(0);
  });

  it("creates a physical product and passes non-null code to mutation", async () => {
    mockCreateProductMutateAsync.mockResolvedValueOnce({
      id: "new-prod-1",
      name: "Super Steel Rod 12mm",
      code: "ROD-12",
      buying_price: 15000,
      selling_price: 19000,
      stock: 40,
      item_type: "product",
      track_inventory: true,
    });

    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    // Click "Add Item" button
    const addButtons = screen.getAllByText("Add Item");
    fireEvent.click(addButtons[0]);

    // Fill in product name and prices
    const nameInput = screen.getByPlaceholderText(/e.g. Twiga Cement/i);
    fireEvent.change(nameInput, { target: { value: "Super Steel Rod 12mm" } });

    const codeInput = screen.getByPlaceholderText(/e.g. CEM-01/i);
    fireEvent.change(codeInput, { target: { value: "ROD-12" } });

    const priceInput = screen.getByPlaceholderText("25000");
    fireEvent.change(priceInput, { target: { value: "19000" } });

    // Submit form
    const saveButton = screen.getByText("Save Product");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateProductMutateAsync).toHaveBeenCalledTimes(1);
      const payload = mockCreateProductMutateAsync.mock.calls[0][0];
      // Verify database payload satisfies NOT NULL constraint on code!
      expect(payload.name).toBe("Super Steel Rod 12mm");
      expect(payload.code).toBe("ROD-12");
      expect(payload.barcode).toBe("ROD-12");
      expect(payload.item_type).toBe("product");
      expect(payload.track_inventory).toBe(true);
      expect(payload.selling_price).toBe(19000);
      expect(payload.shop_id).toBe("test-shop-id");
    });
  });

  it("creates a service item without inventory tracking and with SRV code fallback", async () => {
    mockCreateProductMutateAsync.mockResolvedValueOnce({
      id: "new-srv-1",
      name: "VIP Haircut & Beard Trim",
      code: "SRV-VIP",
      buying_price: 0,
      selling_price: 12000,
      stock: 0,
      item_type: "service",
      track_inventory: false,
    });

    render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    );

    // Click Add Item
    const addButtons = screen.getAllByText("Add Item");
    fireEvent.click(addButtons[0]);

    // Toggle to Service
    const serviceToggle = screen.getByRole("button", { name: /service/i });
    fireEvent.click(serviceToggle);

    // Verify service inputs appear
    const serviceNameInput = screen.getByPlaceholderText(/Haircut & Wash/i);
    fireEvent.change(serviceNameInput, { target: { value: "VIP Haircut & Beard Trim" } });

    // Leave code empty to verify auto fallback
    const feeInput = screen.getByPlaceholderText("25000");
    fireEvent.change(feeInput, { target: { value: "12000" } });

    // Click Save Service
    const saveServiceBtn = screen.getByText("Save Service");
    fireEvent.click(saveServiceBtn);

    await waitFor(() => {
      expect(mockCreateProductMutateAsync).toHaveBeenCalledTimes(1);
      const payload = mockCreateProductMutateAsync.mock.calls[0][0];
      // Verify that code is generated (NOT NULL), item_type is 'service', and track_inventory is false
      expect(payload.name).toBe("VIP Haircut & Beard Trim");
      expect(payload.code).toMatch(/^SRV-/);
      expect(payload.item_type).toBe("service");
      expect(payload.track_inventory).toBe(false);
      expect(payload.buying_price).toBe(0);
      expect(payload.selling_price).toBe(12000);
    });
  });
});

describe("Sales POS 5-Row Inward Scroll & Checkout Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays 5-row table view with inward scroll and allows adding products and services to cart", async () => {
    render(
      <MemoryRouter>
        <Sales />
      </MemoryRouter>
    );

    // Verify view toggle is present
    expect(screen.getByText("Rows (5)")).toBeInTheDocument();
    expect(screen.getByText("Grid")).toBeInTheDocument();

    // Verify both items are in the catalog
    expect(screen.getByText("Twiga Cement 50kg")).toBeInTheDocument();
    expect(screen.getByText("Car Wash Full Service")).toBeInTheDocument();

    // Click add button on Twiga Cement
    const addButtons = screen.getAllByRole("button");
    // Find add buttons in table rows
    const cementRow = screen.getByText("Twiga Cement 50kg").closest("tr");
    expect(cementRow).toBeTruthy();
    fireEvent.click(cementRow!);

    // Also add the Car Wash service
    const serviceRow = screen.getByText("Car Wash Full Service").closest("tr");
    expect(serviceRow).toBeTruthy();
    fireEvent.click(serviceRow!);

    // Check cart items
    expect(screen.getByText(/Cart \(2\)/)).toBeInTheDocument();

    // Verify subtotal/total calculation: 24,000 + 15,000 = 39,000
    expect(screen.getAllByText(/39,000/).length).toBeGreaterThan(0);
  });

  it("filters sales catalog by type (Products vs Services)", async () => {
    render(
      <MemoryRouter>
        <Sales />
      </MemoryRouter>
    );

    // Click Services filter pill
    const servicesPill = screen.getByRole("button", { name: /^services$/i });
    fireEvent.click(servicesPill);

    // Only services should be visible
    expect(screen.getByText("Car Wash Full Service")).toBeInTheDocument();
    expect(screen.getByText("Haircut & Shave")).toBeInTheDocument();
    expect(screen.queryByText("Twiga Cement 50kg")).not.toBeInTheDocument();
  });
});
