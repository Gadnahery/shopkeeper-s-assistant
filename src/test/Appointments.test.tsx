import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Appointments from "@/pages/Appointments";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string) => key,
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-123" },
    shopId: "shop-123",
    profile: { full_name: "Test Owner" },
  }),
}));

vi.mock("@/hooks/useAppointments", () => ({
  useAppointments: () => ({
    data: [
      {
        id: "appt-1",
        shop_id: "shop-123",
        customer_id: "cust-1",
        service_id: "prod-service-1",
        customer_name: "Alice Johnson",
        service_name: "Hair styling & Wash",
        staff_name: "Baraka",
        appointment_at: new Date().toISOString(),
        duration_minutes: 45,
        status: "scheduled",
        notes: "Requested gentle wash",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "appt-2",
        shop_id: "shop-123",
        customer_id: null,
        service_id: null,
        customer_name: "John - Walk-in",
        service_name: "Emergency screen repair",
        staff_name: "Tech Mike",
        appointment_at: new Date().toISOString(),
        duration_minutes: 30,
        status: "completed",
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
  useCreateAppointment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateAppointment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteAppointment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: () => ({
    data: [{ id: "cust-1", name: "Alice Johnson", phone: "0711000000" }],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useProducts", () => ({
  useProducts: () => ({
    data: [
      {
        id: "prod-service-1",
        name: "Hair styling & Wash",
        item_type: "service",
        buying_price: 0,
        selling_price: 20000,
      },
    ],
    isLoading: false,
  }),
}));

describe("Appointments Page Component", () => {
  it("renders KPI cards and appointment entries properly", () => {
    render(
      <MemoryRouter>
        <Appointments />
      </MemoryRouter>
    );

    // KPI Cards check
    expect(screen.getByText("Total Booked")).toBeInTheDocument();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Upcoming").length).toBeGreaterThan(0);
    expect(screen.getByText("Catalog Services")).toBeInTheDocument();

    // Appointments check
    expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hair styling & Wash").length).toBeGreaterThan(0);
    expect(screen.getAllByText("John - Walk-in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Emergency screen repair").length).toBeGreaterThan(0);

    // Day navigation & Book appointment buttons
    expect(screen.getByRole("button", { name: /Book appointment/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
  });
});
