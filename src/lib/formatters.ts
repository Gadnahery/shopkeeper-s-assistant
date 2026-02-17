/**
 * Formatting utilities - Consistent data display
 */

import { format as formatDateFns, formatDistanceToNow, parseISO } from "date-fns";

export function formatCurrency(
  amount: number,
  currency: string = "TZS",
  locale: string = "en-US"
): string {
  if (currency === "TZS" || currency === "Tsh") {
    return `Tsh ${amount.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = "en-US"
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(
  date: Date | string,
  formatStr: string = "PPP"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDateFns(dateObj, formatStr);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "PPP p");
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length > 10) return `+${cleaned}`;
  return phone;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getStockStatus(
  stock: number,
  lowStockAlert: number
): { status: "in-stock" | "low-stock" | "out-of-stock"; label: string; color: string } {
  if (stock === 0) {
    return {
      status: "out-of-stock",
      label: "Out of Stock",
      color: "text-red-600 bg-red-50",
    };
  }
  if (stock <= lowStockAlert) {
    return {
      status: "low-stock",
      label: "Low Stock",
      color: "text-amber-600 bg-amber-50",
    };
  }
  return {
    status: "in-stock",
    label: "In Stock",
    color: "text-green-600 bg-green-50",
  };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, length: number = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
