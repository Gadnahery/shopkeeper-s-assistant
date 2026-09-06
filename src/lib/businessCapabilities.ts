export type BusinessType =
  | "retail"
  | "wholesale"
  | "service"
  | "hybrid"
  | "manufacturing"
  | "pharmacy"
  | "other";

export type CapabilityKey =
  | "products"
  | "services"
  | "inventory"
  | "purchases"
  | "sales"
  | "customers"
  | "suppliers"
  | "expenses"
  | "employees"
  | "appointments"
  | "manufacturing"
  | "batches"
  | "expiry_tracking"
  | "serial_numbers"
  | "loyalty"
  | "credit"
  | "orders"
  | "assets"
  | "reports"
  | "payments";

export type BusinessCapabilities = Partial<Record<CapabilityKey, boolean>>;

export const DEFAULT_CAPABILITIES: Record<CapabilityKey, boolean> = {
  products: true,
  services: false,
  inventory: true,
  purchases: true,
  sales: true,
  customers: true,
  suppliers: true,
  expenses: true,
  employees: false,
  appointments: false,
  manufacturing: false,
  batches: false,
  expiry_tracking: false,
  serial_numbers: false,
  loyalty: false,
  credit: true,
  orders: true,
  assets: false,
  reports: true,
  payments: true,
};

export function resolveCapabilities(value: unknown): Record<CapabilityKey, boolean> {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_CAPABILITIES).map(([key, fallback]) => [
      key,
      typeof (source as Record<string, unknown>)[key] === "boolean"
        ? (source as Record<string, boolean>)[key]
        : fallback,
    ]),
  ) as Record<CapabilityKey, boolean>;
}

export function hasCapability(value: unknown, capability: CapabilityKey) {
  return resolveCapabilities(value)[capability];
}

export function getCapabilitiesForBusinessType(type: BusinessType): Record<CapabilityKey, boolean> {
  const base = { ...DEFAULT_CAPABILITIES };
  switch (type) {
    case "service":
      return {
        ...base,
        products: false,
        services: true,
        inventory: false,
        purchases: false,
        appointments: true,
      };
    case "hybrid":
      return {
        ...base,
        products: true,
        services: true,
        inventory: true,
        appointments: true,
      };
    case "manufacturing":
      return {
        ...base,
        manufacturing: true,
        batches: true,
        inventory: true,
        purchases: true,
      };
    case "pharmacy":
      return {
        ...base,
        expiry_tracking: true,
        batches: true,
        inventory: true,
      };
    case "wholesale":
      return {
        ...base,
        credit: true,
        orders: true,
      };
    default:
      return base;
  }
}
