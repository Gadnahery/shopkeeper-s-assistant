/**
 * Design Tokens - Single source of truth for design values
 */

export const tokens = {
  colors: {
    primary: {
      50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 300: "#D1D5DB",
      400: "#9CA3AF", 500: "#6B7280", 600: "#4B5563", 700: "#374151",
      800: "#1F2937", 900: "#1A1D29",
    },
    secondary: { 50: "#FFFDF7", 100: "#FEF7E6", 500: "#D99A4E", 600: "#B87A32" },
    accent: { 50: "#FFFDF7", 100: "#FEF7E6", 500: "#D99A4E", 600: "#B87A32" },
    success: { 50: "#DAF1DF", 100: "#C6ECCF", 500: "#166534", 600: "#14532D" },
    warning: { 50: "#FFEACE", 100: "#FED7AA", 500: "#9A3412", 600: "#7C2D12" },
    error: { 50: "#FFE4E6", 100: "#FECDD3", 500: "#9F1239", 600: "#881337" },
    neutral: { 50: "#F9FAFB", 100: "#EEF0F3", 200: "#E5E7EB", 500: "#6B7280", 900: "#1A1D29" },
  },
  typography: {
    fontFamily: { sans: "Inter, system-ui, sans-serif", mono: "Consolas, Monaco, monospace" },
    fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
    fontWeight: { normal: "400", medium: "500", semibold: "600", bold: "700" },
  },
  spacing: { 0: "0", 1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 6: "1.5rem", 8: "2rem" },
  borderRadius: { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", full: "9999px" },
  transition: { fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)", normal: "300ms cubic-bezier(0.4, 0, 0.2, 1)" },
  zIndex: { dropdown: 1000, modal: 1040, tooltip: 1060 },
} as const;

export function getSpacing(value: keyof typeof tokens.spacing): string {
  return tokens.spacing[value] ?? `${value}rem`;
}
