import { useSearchParams } from "react-router-dom";
import { SalesHistoryView } from "@/features/sales/components/SalesHistoryView";
import { POSSaleView } from "@/features/sales/components/POSSaleView";

interface SalesProps {
  initialView?: "history" | "new";
}

export default function Sales({ initialView }: SalesProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sub-view inside sales: "history" vs "new"
  const rawViewParam = searchParams.get("view");
  const subView = rawViewParam === "new" || initialView === "new" ? "new" : "history";

  const handleSetSubView = (view: "history" | "new") => {
    if (view === "new") {
      setSearchParams({ view: "new" });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {subView === "new" ? (
        <POSSaleView onBackToHistory={() => handleSetSubView("history")} />
      ) : (
        <SalesHistoryView onAddSale={() => handleSetSubView("new")} />
      )}
    </div>
  );
}
