import { formatCurrency } from "@/lib/formatters";

export interface CountryOption {
  value: string;
  label: string;
  labelSw: string;
  flag: string;
  currency: string;
  currencyName: string;
  currencyNameSw: string;
  locale: string;
}

export const SHOP_COUNTRY_OPTIONS: CountryOption[] = [
  { value: "TZ", label: "Tanzania", labelSw: "Tanzania", flag: "🇹🇿", currency: "TZS", currencyName: "Tanzanian Shilling", currencyNameSw: "Shilingi ya Tanzania", locale: "sw-TZ" },
  { value: "KE", label: "Kenya", labelSw: "Kenya", flag: "🇰🇪", currency: "KES", currencyName: "Kenyan Shilling", currencyNameSw: "Shilingi ya Kenya", locale: "en-KE" },
  { value: "UG", label: "Uganda", labelSw: "Uganda", flag: "🇺🇬", currency: "UGX", currencyName: "Ugandan Shilling", currencyNameSw: "Shilingi ya Uganda", locale: "en-UG" },
  { value: "RW", label: "Rwanda", labelSw: "Rwanda", flag: "🇷🇼", currency: "RWF", currencyName: "Rwandan Franc", currencyNameSw: "Faranga ya Rwanda", locale: "en-RW" },
  { value: "BI", label: "Burundi", labelSw: "Burundi", flag: "🇧🇮", currency: "BIF", currencyName: "Burundian Franc", currencyNameSw: "Faranga ya Burundi", locale: "fr-BI" },
  { value: "CD", label: "DR Congo", labelSw: "Jamhuri ya Kidemokrasia ya Kongo", flag: "🇨🇩", currency: "CDF", currencyName: "Congolese Franc", currencyNameSw: "Faranga ya Kongo", locale: "fr-CD" },
  { value: "SS", label: "South Sudan", labelSw: "Sudan Kusini", flag: "🇸🇸", currency: "SSP", currencyName: "South Sudanese Pound", currencyNameSw: "Pauni ya Sudan Kusini", locale: "en-SS" },
  { value: "ZM", label: "Zambia", labelSw: "Zambia", flag: "🇿🇲", currency: "ZMW", currencyName: "Zambian Kwacha", currencyNameSw: "Kwacha ya Zambia", locale: "en-ZM" },
  { value: "MW", label: "Malawi", labelSw: "Malawi", flag: "🇲🇼", currency: "MWK", currencyName: "Malawian Kwacha", currencyNameSw: "Kwacha ya Malawi", locale: "en-MW" },
  { value: "MZ", label: "Mozambique", labelSw: "Msumbiji", flag: "🇲🇿", currency: "MZN", currencyName: "Mozambican Metical", currencyNameSw: "Metical ya Msumbiji", locale: "pt-MZ" },
  { value: "ZA", label: "South Africa", labelSw: "Afrika Kusini", flag: "🇿🇦", currency: "ZAR", currencyName: "South African Rand", currencyNameSw: "Randi ya Afrika Kusini", locale: "en-ZA" },
  { value: "NG", label: "Nigeria", labelSw: "Nigeria", flag: "🇳🇬", currency: "NGN", currencyName: "Nigerian Naira", currencyNameSw: "Naira ya Nigeria", locale: "en-NG" },
  { value: "GH", label: "Ghana", labelSw: "Ghana", flag: "🇬🇭", currency: "GHS", currencyName: "Ghanaian Cedi", currencyNameSw: "Cedi ya Ghana", locale: "en-GH" },
  { value: "US", label: "United States", labelSw: "Marekani", flag: "🇺🇸", currency: "USD", currencyName: "US Dollar", currencyNameSw: "Dola ya Marekani", locale: "en-US" },
  { value: "GB", label: "United Kingdom", labelSw: "Uingereza", flag: "🇬🇧", currency: "GBP", currencyName: "British Pound", currencyNameSw: "Pauni ya Uingereza", locale: "en-GB" },
  { value: "AE", label: "United Arab Emirates", labelSw: "Falme za Kiarabu", flag: "🇦🇪", currency: "AED", currencyName: "UAE Dirham", currencyNameSw: "Dirham ya UAE", locale: "ar-AE" },
  { value: "IN", label: "India", labelSw: "Uhindi", flag: "🇮🇳", currency: "INR", currencyName: "Indian Rupee", currencyNameSw: "Rupia ya Uhindi", locale: "en-IN" },
  { value: "CN", label: "China", labelSw: "China", flag: "🇨🇳", currency: "CNY", currencyName: "Chinese Yuan", currencyNameSw: "Yuan ya China", locale: "zh-CN" },
  { value: "CA", label: "Canada", labelSw: "Kanada", flag: "🇨🇦", currency: "CAD", currencyName: "Canadian Dollar", currencyNameSw: "Dola ya Kanada", locale: "en-CA" },
  { value: "AU", label: "Australia", labelSw: "Australia", flag: "🇦🇺", currency: "AUD", currencyName: "Australian Dollar", currencyNameSw: "Dola ya Australia", locale: "en-AU" },
  { value: "EU", label: "European Union", labelSw: "Umoja wa Ulaya", flag: "🇪🇺", currency: "EUR", currencyName: "Euro", currencyNameSw: "Yuro", locale: "en-EU" },
];

export const SHOP_CURRENCY_OPTIONS = [
  { value: "TZS", label: "TZS - Tanzanian Shilling (Tanzania)" },
  { value: "KES", label: "KES - Kenyan Shilling (Kenya)" },
  { value: "UGX", label: "UGX - Ugandan Shilling (Uganda)" },
  { value: "RWF", label: "RWF - Rwandan Franc (Rwanda)" },
  { value: "BIF", label: "BIF - Burundian Franc (Burundi)" },
  { value: "CDF", label: "CDF - Congolese Franc (DR Congo)" },
  { value: "SSP", label: "SSP - South Sudanese Pound (South Sudan)" },
  { value: "ZMW", label: "ZMW - Zambian Kwacha (Zambia)" },
  { value: "MWK", label: "MWK - Malawian Kwacha (Malawi)" },
  { value: "MZN", label: "MZN - Mozambican Metical (Mozambique)" },
  { value: "ZAR", label: "ZAR - South African Rand (South Africa)" },
  { value: "NGN", label: "NGN - Nigerian Naira (Nigeria)" },
  { value: "GHS", label: "GHS - Ghanaian Cedi (Ghana)" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

export const SHOP_LOCALE_OPTIONS = [
  { value: "sw-TZ", label: "Kiswahili (Tanzania)" },
  { value: "en-KE", label: "English (Kenya)" },
  { value: "en-UG", label: "English (Uganda)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr-FR", label: "French (France / DR Congo / Burundi)" },
  { value: "ar-AE", label: "Arabic (UAE)" },
] as const;

export const DEFAULT_COUNTRY = "TZ";
export const DEFAULT_CURRENCY = "TZS";
export const DEFAULT_LOCALE = "sw-TZ";

type Language = "en" | "sw";

export function getCountryByCode(code?: string | null): CountryOption {
  const normalized = (code || "").trim().toUpperCase();
  return SHOP_COUNTRY_OPTIONS.find((c) => c.value === normalized) || SHOP_COUNTRY_OPTIONS[0];
}

export function getDefaultCurrencyForCountry(countryCode?: string | null): string {
  return getCountryByCode(countryCode).currency;
}

export function getDefaultLocaleForCountry(countryCode?: string | null, language: Language = "en"): string {
  const country = getCountryByCode(countryCode);
  if (country.value === "TZ") {
    return language === "en" ? "en-TZ" : "sw-TZ";
  }
  return country.locale;
}

export function resolveShopCurrency(currency?: string | null) {
  const normalized = currency?.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized ?? "") ? normalized! : DEFAULT_CURRENCY;
}

export function resolveShopLocale(locale?: string | null, language: Language = "en") {
  if (locale?.trim()) {
    return locale;
  }
  return language === "sw" ? "sw-TZ" : "en-US";
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
