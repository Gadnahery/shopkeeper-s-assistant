import { eachDayOfInterval, format, parseISO } from "date-fns";

type SalesLike = {
  created_at: string | null;
  total: number | string | null;
};

type CategoryLike = {
  name: string | null;
  value: number | string | null;
  color?: string | null;
};

export type SalesTrendPoint = {
  day: string;
  sales: number;
};

export type CategoryChartPoint = {
  name: string;
  value: number;
  color: string;
};

function safeParseDate(value: string) {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildSalesTrendData(
  sales: SalesLike[] | undefined,
  start: string,
  end: string,
): SalesTrendPoint[] {
  const startDate = safeParseDate(start);
  const endDate = safeParseDate(end);

  if (!startDate || !endDate || startDate > endDate) {
    return [];
  }

  const buckets = new Map<string, SalesTrendPoint>();

  eachDayOfInterval({ start: startDate, end: endDate }).forEach((date) => {
    const key = format(date, "yyyy-MM-dd");
    buckets.set(key, {
      day: format(date, "dd MMM"),
      sales: 0,
    });
  });

  (sales ?? []).forEach((sale) => {
    const saleDate = sale.created_at ? safeParseDate(sale.created_at) : null;
    if (!saleDate) {
      return;
    }

    const key = format(saleDate, "yyyy-MM-dd");
    const bucket = buckets.get(key);
    if (!bucket) {
      return;
    }

    const total = Number(sale.total ?? 0);
    bucket.sales += Number.isFinite(total) ? total : 0;
  });

  return Array.from(buckets.values());
}

export function buildCategoryChartData(
  categories: CategoryLike[] | undefined,
  fallbackColors: string[],
): CategoryChartPoint[] {
  const sanitized = (categories ?? [])
    .map((category, index) => {
      const value = Number(category.value ?? 0);
      return {
        name: category.name?.trim() || "Uncategorized",
        value: Number.isFinite(value) ? value : 0,
        color: category.color || fallbackColors[index % fallbackColors.length] || "#0D9488",
      };
    })
    .filter((category) => category.value > 0)
    .sort((a, b) => b.value - a.value);

  return sanitized;
}
