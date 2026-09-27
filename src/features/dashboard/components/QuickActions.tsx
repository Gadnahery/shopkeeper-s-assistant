import { Link } from "react-router-dom";
import { ShoppingBag, Package, Users, Receipt } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    to: "/sales",
    icon: ShoppingBag,
    en: "New sale",
    sw: "Mauzo mapya",
    primary: true,
  },
  {
    to: "/inventory?new=1",
    icon: Package,
    en: "Add product",
    sw: "Ongeza bidhaa",
  },
  {
    to: "/customers?new=true",
    icon: Users,
    en: "Add customer",
    sw: "Ongeza mteja",
  },
  {
    to: "/expenses?new=1",
    icon: Receipt,
    en: "Add expense",
    sw: "Ongeza gharama",
  },
] as const;

export function QuickActions({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {ACTIONS.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 transition-all active:scale-[0.98]",
            a.primary
              ? "border-[#1A1D29] bg-[#1A1D29] text-white shadow-sm"
              : "border-border/80 bg-card text-foreground hover:bg-muted/50",
          )}
        >
          <a.icon
            className={cn("h-4 w-4 shrink-0", a.primary ? "text-white" : "text-[#D99A4E]")}
            strokeWidth={1.75}
          />
          <span className="text-xs font-semibold sm:text-[13px]">
            {isSw ? a.sw : a.en}
          </span>
        </Link>
      ))}
    </div>
  );
}
