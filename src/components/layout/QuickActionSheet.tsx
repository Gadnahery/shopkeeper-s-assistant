import { useNavigate } from "react-router-dom";
import { CircleDollarSign, PackagePlus, Plus, ShoppingCart, WalletCards } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasCapability } from "@/lib/businessCapabilities";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function QuickActionSheet() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const capabilities = profile?.shops?.capabilities;

  const actions = [
    { label: language === "sw" ? "Mauzo mapya" : "New sale", icon: ShoppingCart, to: "/sales", show: hasCapability(capabilities, "sales") },
    { label: language === "sw" ? "Ongeza bidhaa" : "Add product", icon: PackagePlus, to: "/inventory?new=true", show: hasCapability(capabilities, "products") },
    { label: language === "sw" ? "Rekodi ununuzi" : "Record purchase", icon: WalletCards, to: "/purchases?new=true", show: hasCapability(capabilities, "purchases") },
    { label: language === "sw" ? "Pokea malipo" : "Receive payment", icon: CircleDollarSign, to: "/customers", show: hasCapability(capabilities, "payments") },
    { label: language === "sw" ? "Ongeza gharama" : "Add expense", icon: CircleDollarSign, to: "/expenses?new=true", show: hasCapability(capabilities, "expenses") },
  ].filter((action) => action.show);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label={language === "sw" ? "Vitendo vya haraka" : "Quick actions"}
        onClick={() => setOpen(true)}
        className="fixed bottom-[5.9rem] right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-background md:hidden"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle>{language === "sw" ? "Anza kazi" : "Start an action"}</SheetTitle>
            <SheetDescription>
              {language === "sw" ? "Fikia kazi zako za kila siku kwa haraka." : "Reach your most common workflows quickly."}
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            {actions.map(({ label, icon: Icon, to }) => (
              <button
                key={to}
                type="button"
                onClick={() => go(to)}
                className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-5 w-5 shrink-0 text-accent" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
