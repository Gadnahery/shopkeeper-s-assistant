import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RecentSalesListProps {
  sales: any[];
  language: "en" | "sw";
  formatMoney: (val: number) => string;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function RecentSalesList({ sales, language, formatMoney }: RecentSalesListProps) {
  const navigate = useNavigate();

  // Take top 4 recent sales
  const recentSales = useMemo(() => {
    return (sales || [])
      .filter((s) => s.status === "completed")
      .slice(0, 4);
  }, [sales]);

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs space-y-2 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-foreground">
              {language === "sw" ? "Mauzo ya Karibuni" : "Recent Sales"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate("/sales")}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
          >
            <span>{language === "sw" ? "Zote" : "View all"}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        {recentSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-1.5">
            <ShoppingBag className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs font-medium">
              {language === "sw"
                ? "Hakuna mauzo bado."
                : "No sales recorded yet."}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {language === "sw"
                ? "Miamala iliyokamilika itaonekana hapa."
                : "Completed checkout transactions appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentSales.map((sale) => {
              const invoice =
                sale.invoice_number ||
                `#${String(sale.id || "").slice(0, 6).toUpperCase()}`;

              const customerName =
                sale.customer_name ||
                sale.customers?.name ||
                (language === "sw" ? "Mteja wa kawaida" : "Walk-in");

              const timeRelative = formatRelativeTime(sale.created_at);
              const timeFormatted = sale.created_at
                ? format(new Date(sale.created_at), "HH:mm")
                : "";

              const paymentMethod = String(sale.payment_method || "Cash").toLowerCase();
              const isCredit = paymentMethod === "credit";
              const isMpesa = paymentMethod === "m-pesa" || paymentMethod === "mpesa" || paymentMethod === "mobile";

              return (
                <div
                  key={sale.id}
                  onClick={() => navigate("/sales")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/sales")}
                  className="flex items-center justify-between py-1.5 hover:bg-muted/30 px-1.5 rounded-lg transition-colors cursor-pointer select-none"
                >
                  {/* Left: Invoice & Customer */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                        isCredit
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      <ShoppingBag className="h-3 w-3" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {customerName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {invoice}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{timeRelative || timeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Status Badge & Amount */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "hidden xl:inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold",
                        isCredit
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {!isCredit && <CheckCircle2 className="h-2 w-2" />}
                      {isCredit
                        ? language === "sw"
                          ? "Mkopo"
                          : "Credit"
                        : isMpesa
                        ? "M-Pesa"
                        : "Cash"}
                    </span>

                    <span className="text-xs font-bold text-foreground">
                      +{formatMoney(Number(sale.total || 0))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer link if items exist */}
      {recentSales.length > 0 && (
        <div className="pt-1.5 border-t border-border/40">
          <button
            type="button"
            onClick={() => navigate("/sales")}
            className="w-full text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {language === "sw" ? "Tazama Mauzo Yote →" : "View All Sales →"}
          </button>
        </div>
      )}
    </div>
  );
}
