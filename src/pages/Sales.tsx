import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders } from "@/hooks/useOrders";
import { SalesHistoryView } from "@/components/sales/SalesHistoryView";
import { POSSaleView } from "@/components/sales/POSSaleView";
import Orders from "./Orders";

interface SalesProps {
  initialView?: "history" | "new";
}

export default function Sales({ initialView }: SalesProps) {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active module: "sales" vs "orders"
  const activeModule = searchParams.get("tab") === "orders" ? "orders" : "sales";

  // Sub-view inside sales: "history" vs "new"
  const rawViewParam = searchParams.get("view");
  const subView = rawViewParam === "new" || initialView === "new" ? "new" : "history";

  const { data: orders } = useOrders();

  const pendingOrdersCount = useMemo(() => {
    return (orders || []).filter(
      (o: any) => o.status === "pending" || o.status === "processing"
    ).length;
  }, [orders]);

  const handleSwitchModule = (module: "sales" | "orders") => {
    if (module === "orders") {
      setSearchParams({ tab: "orders" });
    } else {
      // Return to sales history by default
      setSearchParams({});
    }
  };

  const handleSetSubView = (view: "history" | "new") => {
    if (view === "new") {
      setSearchParams({ view: "new" });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Module Navigation: Sales vs Customer Orders */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeModule === "sales" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSwitchModule("sales")}
            className="h-8 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <Tag className="h-3.5 w-3.5 text-accent" />
            <span>{language === "sw" ? "Mauzo" : "Sales"}</span>
          </Button>

          <Button
            variant={activeModule === "orders" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSwitchModule("orders")}
            className="h-8 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <ClipboardList className="h-3.5 w-3.5 text-accent" />
            <span>{language === "sw" ? "Maagizo ya Wateja" : "Customer Orders"}</span>
            {pendingOrdersCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">
                {pendingOrdersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Module Content */}
      {activeModule === "orders" ? (
        <Orders />
      ) : subView === "new" ? (
        <POSSaleView onBackToHistory={() => handleSetSubView("history")} />
      ) : (
        <SalesHistoryView onAddSale={() => handleSetSubView("new")} />
      )}
    </div>
  );
}
