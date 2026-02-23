export const APP_ROLES = ["owner", "manager", "cashier", "staff", "hr"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PAYMENT_METHODS = ["Cash", "M-Pesa", "Card", "Bank Transfer", "Credit"] as const;
export const UNIT_TYPES = ["pcs", "kg", "g", "ltr", "ml", "box"] as const;
