import { describe, it, expect } from "vitest";
import {
  SHOP_COUNTRY_OPTIONS,
  SHOP_CURRENCY_OPTIONS,
  getCountryByCode,
  getDefaultCurrencyForCountry,
  getDefaultLocaleForCountry,
  formatMoneyForShop,
  resolveShopCurrency,
} from "@/lib/international";

describe("Country and Currency Onboarding Logic", () => {
  it("defaults to Tanzania (TZS) when no country is provided", () => {
    const country = getCountryByCode(null);
    expect(country.value).toBe("TZ");
    expect(country.currency).toBe("TZS");
    expect(getDefaultCurrencyForCountry(null)).toBe("TZS");
    expect(getDefaultCurrencyForCountry("")).toBe("TZS");
    expect(getDefaultCurrencyForCountry("UNKNOWN_CODE")).toBe("TZS");
  });

  it("maps East African Community countries to correct local currencies", () => {
    expect(getDefaultCurrencyForCountry("TZ")).toBe("TZS");
    expect(getDefaultCurrencyForCountry("KE")).toBe("KES");
    expect(getDefaultCurrencyForCountry("UG")).toBe("UGX");
    expect(getDefaultCurrencyForCountry("RW")).toBe("RWF");
    expect(getDefaultCurrencyForCountry("BI")).toBe("BIF");
    expect(getDefaultCurrencyForCountry("CD")).toBe("CDF");
    expect(getDefaultCurrencyForCountry("SS")).toBe("SSP");
  });

  it("maps international countries to correct currencies", () => {
    expect(getDefaultCurrencyForCountry("US")).toBe("USD");
    expect(getDefaultCurrencyForCountry("GB")).toBe("GBP");
    expect(getDefaultCurrencyForCountry("EU")).toBe("EUR");
    expect(getDefaultCurrencyForCountry("ZA")).toBe("ZAR");
    expect(getDefaultCurrencyForCountry("NG")).toBe("NGN");
    expect(getDefaultCurrencyForCountry("AE")).toBe("AED");
    expect(getDefaultCurrencyForCountry("IN")).toBe("INR");
  });

  it("resolves shop currency correctly with TZS default", () => {
    expect(resolveShopCurrency("KES")).toBe("KES");
    expect(resolveShopCurrency("USD")).toBe("USD");
    expect(resolveShopCurrency("")).toBe("TZS");
    expect(resolveShopCurrency(null)).toBe("TZS");
  });

  it("formats money correctly according to shop currency preferences", () => {
    const tzsFormatted = formatMoneyForShop(25000, { currency: "TZS", locale: "sw-TZ" }, "sw");
    expect(tzsFormatted).toMatch(/25[,.]000/);

    const usdFormatted = formatMoneyForShop(100, { currency: "USD", locale: "en-US" }, "en");
    expect(usdFormatted).toMatch(/\$100/);
  });

  it("has flags and localized names for all country options", () => {
    for (const c of SHOP_COUNTRY_OPTIONS) {
      expect(c.value).toBeTruthy();
      expect(c.flag).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.labelSw).toBeTruthy();
      expect(c.currency).toMatch(/^[A-Z]{3}$/);
    }
  });
});
