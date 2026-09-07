/**
 * WiseCash ERP Core Financial Engine
 *
 * Single source of truth for all P&L, Revenue, COGS, Cash Received,
 * and Tax calculations across Dashboard, Reports, and other modules.
 *
 * Principles:
 * 1. Revenue = Subtotal - Discount (Excludes tax collected; tax is a liability, not income).
 * 2. COGS = Sum of (sale_items.buying_price_at_sale * quantity).
 *    Never guess or approximate using a multiplier (e.g. * 0.75) or current product buying price.
 * 3. Gross Profit = Revenue - COGS.
 * 4. Net Profit = Gross Profit + Other Income - Operating Expenses.
 * 5. Cash Received counts Cash, M-Pesa, and both cash/mpesa portions of Split sales.
 *    Credit sales are receivables and do not add to Cash Received.
 */

export interface FinancialPnL {
  revenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  totalOtherIncome: number;
  netProfit: number;
  taxCollected: number;
  grossSales: number;
  netMargin: number;
  grossMargin: number;
}

export function calculatePnL(
  sales: any[] = [],
  expenses: any[] = [],
  otherIncome: any[] = []
): FinancialPnL {
  // 1. Revenue = Subtotal - Discount (Tax collected is excluded from revenue)
  const revenue = (sales || []).reduce((sum, s) => {
    if (!s) return sum;
    const subtotal = s.subtotal !== null && s.subtotal !== undefined ? Number(s.subtotal) : Number(s.total || 0);
    const discount = Number(s.discount_amount || 0);
    // If subtotal wasn't stored separately, check if tax_amount exists to subtract
    if (s.subtotal === null || s.subtotal === undefined) {
      const tax = Number(s.tax_amount || 0);
      return sum + Math.max(0, subtotal - tax);
    }
    return sum + Math.max(0, subtotal - discount);
  }, 0);

  // 2. Cost of Goods Sold (COGS) strictly using historical buying_price_at_sale
  const cogs = (sales || []).reduce((sum, s) => {
    if (!s) return sum;
    const items = Array.isArray(s.sale_items) ? s.sale_items : [];
    const saleCogs = items.reduce((iSum: number, item: any) => {
      if (!item) return iSum;
      const unitCost = Number(item.buying_price_at_sale ?? 0);
      const qty = Number(item.quantity ?? 1);
      return iSum + (unitCost * qty);
    }, 0);
    return sum + saleCogs;
  }, 0);

  // 3. Gross Profit
  const grossProfit = revenue - cogs;

  // 4. Operating Expenses
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e?.amount || 0), 0);

  // 5. Total Other Income
  const totalOtherIncome = (otherIncome || []).reduce((sum, i) => sum + Number(i?.amount || 0), 0);

  // 6. Net Profit (Can be negative for a true net loss)
  const netProfit = grossProfit + totalOtherIncome - totalExpenses;

  // 7. Tax collected (separate liability line, not folded into revenue)
  const taxCollected = (sales || []).reduce((sum, s) => sum + Number(s?.tax_amount || 0), 0);

  // 8. Gross Sales (customer invoices total including tax and discounts)
  const grossSales = (sales || []).reduce((sum, s) => sum + Number(s?.total || 0), 0);

  // 9. Margins
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    totalExpenses,
    totalOtherIncome,
    netProfit,
    taxCollected,
    grossSales,
    netMargin,
    grossMargin,
  };
}

/**
 * Calculates total cash actually collected for a set of sales.
 * Accurately includes:
 * - Cash sales: full total
 * - M-Pesa sales: full total
 * - Split sales: sum of cash_amount + mpesa_amount (or total if legacy)
 * - Credit sales: 0 (deferred payment, recorded upon debt settlement)
 */
export function calculateCashReceived(sales: any[] = []): number {
  return (sales || []).reduce((sum, s) => {
    if (!s || s.status === "cancelled" || s.status === "draft") return sum;

    const method = String(s.payment_method || "").toLowerCase();
    const total = Number(s.total || 0);

    if (method === "credit") {
      return sum;
    }

    if (method === "split") {
      const cashAmt = Number(s.cash_amount || 0);
      const mpesaAmt = Number(s.mpesa_amount || 0);
      if (cashAmt > 0 || mpesaAmt > 0) {
        return sum + cashAmt + mpesaAmt;
      }
      // Fallback for legacy split records before dedicated columns
      return sum + total;
    }

    if (method === "cash" || method === "m-pesa" || method === "mpesa" || method === "mobile" || method === "bank") {
      return sum + total;
    }

    return sum + total;
  }, 0);
}
