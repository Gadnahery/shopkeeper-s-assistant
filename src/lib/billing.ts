const truthyValues = new Set(["1", "true", "yes", "on"]);

export const BILLING_ENABLED = truthyValues.has(
  String(import.meta.env.VITE_BILLING_ENABLED ?? "false").trim().toLowerCase(),
);
