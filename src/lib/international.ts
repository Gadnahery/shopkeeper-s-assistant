import { formatCurrency } from "@/lib/formatters";

export const SHOP_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AED", label: "AED - UAE Dirham" },
] as const;

export const SHOP_LOCALE_OPTIONS = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "sw-TZ", label: "Kiswahili (Tanzania)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "ar-AE", label: "Arabic (UAE)" },
] as const;

export const SHOP_COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "TZ", label: "Tanzania" },
  { value: "KE", label: "Kenya" },
  { value: "UG", label: "Uganda" },
  { value: "NG", label: "Nigeria" },
  { value: "ZA", label: "South Africa" },
  { value: "IN", label: "India" },
  { value: "AE", label: "United Arab Emirates" },
] as const;

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LOCALE = "en-US";
const DEFAULT_COUNTRY = "US";

type Language = "en" | "sw";

export function resolveShopCurrency(currency?: string | null) {
  const normalized = currency?.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized ?? "") ? normalized! : DEFAULT_CURRENCY;
}

export function resolveShopLocale(locale?: string | null, language: Language = "en") {
  if (locale?.trim()) {
    return locale;
  }
  return language === "sw" ? "sw-TZ" : DEFAULT_LOCALE;
}

export function resolveShopCountry(countryCode?: string | null) {
  const normalized = countryCode?.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized ?? "") ? normalized! : DEFAULT_COUNTRY;
}

export function formatMoneyForShop(
  amount: number,
  prefs: { currency?: string | null; locale?: string | null },
  language: Language = "en",
) {
  return formatCurrency(amount, resolveShopCurrency(prefs.currency), resolveShopLocale(prefs.locale, language));
}
