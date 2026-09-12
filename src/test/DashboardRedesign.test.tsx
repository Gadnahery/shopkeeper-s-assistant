import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardKpis } from "@/components/dashboard/DashboardKpis";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { TopSellingProducts } from "@/components/dashboard/TopSellingProducts";
import { RecentSalesList } from "@/components/dashboard/RecentSalesList";

const mockFormatMoney = (n: number) => `TZS ${n.toLocaleString()}`;

describe("WiseCash Dashboard Redesign Verification", () => {
  it("renders DashboardGreeting with user name, business context and period tabs", () => {
    render(
      <MemoryRouter>
        <DashboardGreeting
          userName="Mary Stanislaus"
          shopName="Yakwetushop Gas"
          language="en"
          period="today"
          onPeriodChange={vi.fn()}
          customRange={{}}
          onCustomRangeChange={vi.fn()}
        />
      </MemoryRouter>
    );

    // Should include user's first name
    expect(screen.getByText(/Mary/i)).toBeInTheDocument();
    // Should include shop context
    expect(screen.getByText(/Yakwetushop Gas/i)).toBeInTheDocument();
    // Should have New Sale button
    expect(screen.getByText(/New Sale/i)).toBeInTheDocument();
    // Should have Today tab
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders exactly 3 primary KPI cards for Sales, Profit, and Cash Received", () => {
    render(
      <MemoryRouter>
        <DashboardKpis
          period="today"
          language="en"
          formatMoney={mockFormatMoney}
          totalSales={18700}
          orderCount={3}
          netProfit={6200}
          grossProfit={8000}
          cogs={10700}
          revenue={18700}
          totalExpenses={1800}
          cashReceived={15000}
          hasPhysicalItemsSoldWithoutCost={false}
          salesGrowthPercent={12}
        />
      </MemoryRouter>
    );

    // Card 1: Sales Today
    expect(screen.getByText("Sales Today")).toBeInTheDocument();
    expect(screen.getByText("TZS 18,700")).toBeInTheDocument();
    expect(screen.getByText(/3 orders/i)).toBeInTheDocument();

    // Card 2: Profit Today
    expect(screen.getByText("Profit Today")).toBeInTheDocument();
    expect(screen.getByText("TZS 6,200")).toBeInTheDocument();

    // Card 3: Cash Received
    expect(screen.getByText("Cash Received Today")).toBeInTheDocument();
    expect(screen.getByText("TZS 15,000")).toBeInTheDocument();
    expect(screen.getByText(/3,700 outstanding on credit/i)).toBeInTheDocument();
  });

  it("handles missing cost data gracefully in Profit KPI", () => {
    render(
      <MemoryRouter>
        <DashboardKpis
          period="today"
          language="en"
          formatMoney={mockFormatMoney}
          totalSales={18700}
          orderCount={1}
          netProfit={18700}
          grossProfit={18700}
          cogs={0}
          revenue={18700}
          totalExpenses={0}
          cashReceived={18700}
          hasPhysicalItemsSoldWithoutCost={true}
        />
      </MemoryRouter>
    );

    // Should indicate estimated / missing cost data rather than false exact profit
    expect(screen.getByText(/Cost data missing/i)).toBeInTheDocument();
  });

  it("renders Needs Attention actionable exceptions when issues exist", () => {
    render(
      <MemoryRouter>
        <NeedsAttention
          language="en"
          formatMoney={mockFormatMoney}
          outOfStockCount={2}
          lowStockCount={4}
          customerDebtTotal={250000}
          debtorsCount={3}
          pendingOrdersCount={1}
          pendingPurchasesCount={1}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    expect(screen.getByText(/2 products are out of stock/i)).toBeInTheDocument();
    expect(screen.getByText(/TZS 250,000 outstanding from customers/i)).toBeInTheDocument();
    expect(screen.getByText(/1 customer order is pending/i)).toBeInTheDocument();
    expect(screen.getByText(/1 purchase order is pending/i)).toBeInTheDocument();
  });

  it("renders clean positive empty state when no issues require attention", () => {
    render(
      <MemoryRouter>
        <NeedsAttention
          language="en"
          formatMoney={mockFormatMoney}
          outOfStockCount={0}
          lowStockCount={0}
          customerDebtTotal={0}
          debtorsCount={0}
          pendingOrdersCount={0}
          pendingPurchasesCount={0}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Everything looks good")).toBeInTheDocument();
    expect(screen.getByText(/No urgent stock shortages/i)).toBeInTheDocument();
  });

  it("ranks top selling products correctly with quantity and revenue", () => {
    const mockPeriodSales = [
      {
        id: "s-1",
        status: "completed",
        sale_items: [
          { product_id: "p-1", product_name: "Taifa Gas 15kg", quantity: 3, total: 159000 },
          { product_id: "p-2", product_name: "Oryx Gas 6kg", quantity: 5, total: 117500 },
        ],
      },
      {
        id: "s-2",
        status: "completed",
        sale_items: [
          { product_id: "p-2", product_name: "Oryx Gas 6kg", quantity: 2, total: 47000 },
        ],
      },
    ];

    render(
      <MemoryRouter>
        <TopSellingProducts
          periodSales={mockPeriodSales}
          language="en"
          formatMoney={mockFormatMoney}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Top Selling Products")).toBeInTheDocument();
    // Oryx Gas has 7 total sold, Taifa Gas has 3 sold
    expect(screen.getByText("Oryx Gas 6kg")).toBeInTheDocument();
    expect(screen.getByText(/7 sold/i)).toBeInTheDocument();
    expect(screen.getByText("Taifa Gas 15kg")).toBeInTheDocument();
    expect(screen.getByText(/3 sold/i)).toBeInTheDocument();
  });

  it("renders Recent Sales stream with transaction details", () => {
    const mockSales = [
      {
        id: "sale-101",
        invoice_number: "INV-001042",
        customer_name: "Mary Mlay",
        payment_method: "Cash",
        total: 18700,
        status: "completed",
        created_at: new Date().toISOString(),
      },
      {
        id: "sale-102",
        invoice_number: "INV-001041",
        customer_name: "John Doe",
        payment_method: "Credit",
        total: 25000,
        status: "completed",
        created_at: new Date().toISOString(),
      },
    ];

    render(
      <MemoryRouter>
        <RecentSalesList
          sales={mockSales}
          language="en"
          formatMoney={mockFormatMoney}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Recent Sales")).toBeInTheDocument();
    expect(screen.getByText("INV-001042")).toBeInTheDocument();
    expect(screen.getByText("Mary Mlay")).toBeInTheDocument();
    expect(screen.getByText("+TZS 18,700")).toBeInTheDocument();
    expect(screen.getByText("INV-001041")).toBeInTheDocument();
    expect(screen.getByText("+TZS 25,000")).toBeInTheDocument();
  });

  it("renders compact NeedsAttention beside KPI cards in zero-scroll desktop layout", () => {
    render(
      <MemoryRouter>
        <NeedsAttention
          language="en"
          formatMoney={mockFormatMoney}
          outOfStockCount={3}
          lowStockCount={2}
          customerDebtTotal={150000}
          debtorsCount={2}
          pendingOrdersCount={0}
          pendingPurchasesCount={0}
          compact={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    expect(screen.getByText(/3 products are out of stock/i)).toBeInTheDocument();
    expect(screen.getByText("View inventory")).toBeInTheDocument();
  });

  it("renders compact NeedsAttention healthy state when no exceptions exist", () => {
    render(
      <MemoryRouter>
        <NeedsAttention
          language="en"
          formatMoney={mockFormatMoney}
          outOfStockCount={0}
          lowStockCount={0}
          customerDebtTotal={0}
          debtorsCount={0}
          pendingOrdersCount={0}
          pendingPurchasesCount={0}
          compact={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Attention")).toBeInTheDocument();
    expect(screen.getByText("All systems healthy")).toBeInTheDocument();
    expect(screen.getByText("✓ 0 pending exceptions")).toBeInTheDocument();
  });
});
