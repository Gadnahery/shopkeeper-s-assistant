import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { resolveShopCountry, resolveShopCurrency, resolveShopLocale } from "@/lib/international";

type CurrencyOptions = Intl.NumberFormatOptions;
type DateOptions = Intl.DateTimeFormatOptions;

export function useShopFormatting() {
  const { profile } = useAuth();
  const { language } = useLanguage();

  const shopIntl = useMemo(() => {
    const shop = profile?.shops;
    const currency = resolveShopCurrency(shop?.currency);
    const locale = resolveShopLocale(shop?.locale, language);
    const countryCode = resolveShopCountry(shop?.country_code);

    return { currency, locale, countryCode };
  }, [language, profile?.shops]);

  return useMemo(
    () => ({
      ...shopIntl,
      formatMoney: (amount: number, options?: CurrencyOptions) =>
        formatCurrency(amount, shopIntl.currency, shopIntl.locale, options),
      formatNumber: (value: number, decimals = 0) => formatNumber(value, decimals, shopIntl.locale),
      formatDate: (value: Date | string | number, options?: DateOptions) =>
        new Date(value).toLocaleDateString(shopIntl.locale, options),
      formatDateTime: (value: Date | string | number, options?: DateOptions) =>
        new Date(value).toLocaleString(shopIntl.locale, options),
    }),
    [shopIntl],
  );
}
