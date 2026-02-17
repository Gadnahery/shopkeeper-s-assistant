/**
 * Design Tokens - Single source of truth for design values
 */

export const tokens = {
  colors: {
    primary: {
      50: "#F0FDFA", 100: "#CCFBF1", 200: "#99F6E4", 300: "#5EEAD4",
      400: "#2DD4BF", 500: "#14B8A6", 600: "#0D9488", 700: "#0F766E",
      800: "#115E59", 900: "#134E4A",
    },
    secondary: {
      50: "#FFFBEB", 100: "#FEF3C7", 500: "#F59E0B", 600: "#D97706",
    },
    success: { 50: "#F0FDF4", 100: "#DCFCE7", 500: "#10B981", 600: "#059669" },
    warning: { 50: "#FFF7ED", 500: "#F97316", 600: "#EA580C" },
    error: { 50: "#FEF2F2", 500: "#EF4444", 600: "#DC2626" },
    neutral: {
      50: "#FAFAFA", 100: "#F4F4F5", 200: "#E4E4E7", 500: "#71717A", 900: "#18181B",
    },
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
