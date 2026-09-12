import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Trophy, Package } from "lucide-react";

interface TopProductItem {
  id: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

interface TopSellingProductsProps {
  periodSales: any[];
  language: "en" | "sw";
  formatMoney: (val: number) => string;
}

export function TopSellingProducts({
  periodSales,
  language,
  formatMoney,
}: TopSellingProductsProps) {
  const navigate = useNavigate();

  // Aggregate product sales from periodSales
  const topProducts = useMemo(() => {
    const productMap = new Map<string, TopProductItem>();

    (periodSales || []).forEach((sale) => {
      const items = Array.isArray(sale.sale_items) ? sale.sale_items : [];
      items.forEach((item: any) => {
        const key = item.product_id || item.product_name || "Unknown";
        const name = item.product_name || "Product";
        const qty = Number(item.quantity) || 1;
        const rev = Number(item.total) || Number(item.unit_price || 0) * qty;

        const existing = productMap.get(key);
        if (existing) {
          existing.quantitySold += qty;
          existing.totalRevenue += rev;
        } else {
          productMap.set(key, {
            id: key,
            name,
            quantitySold: qty,
            totalRevenue: rev,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold || b.totalRevenue - a.totalRevenue)
      .slice(0, 4);
  }, [periodSales]);

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs space-y-2 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-foreground">
              {language === "sw" ? "Bidhaa Zinazoongoza" : "Top Selling Products"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
          >
            <span>{language === "sw" ? "Zote" : "View all"}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        {topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-1.5">
            <Package className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs font-medium">
              {language === "sw"
                ? "Hakuna mauzo ya bidhaa bado."
                : "No products sold in this period."}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {language === "sw"
                ? "Bidhaa zikouzwa zitaonekana hapa."
                : "Top-performing products rank here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {topProducts.map((p, index) => {
              const rank = index + 1;
              const isTop = rank === 1;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 group transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Rank Badge */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${
                        isTop
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.quantitySold} {language === "sw" ? "ziliuzwa" : "sold"}
                      </p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-foreground">
                      {formatMoney(p.totalRevenue)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer link if items exist */}
      {topProducts.length > 0 && (
        <div className="pt-1.5 border-t border-border/40">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="w-full text-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {language === "sw" ? "Dhibiti Stoki na Bei →" : "Manage Inventory →"}
          </button>
        </div>
      )}
    </div>
  );
}
