import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  CircleDollarSign,
  Factory,
  PackagePlus,
  Plus,
  ShoppingCart,
  Tag,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasCapability } from "@/lib/businessCapabilities";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function QuickActionSheet() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const capabilities = profile?.shops?.capabilities;

  const actions = [
    {
      label: language === "sw" ? "Mauzo mapya" : "New Sale",
      icon: Tag,
      to: "/sales",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      show: hasCapability(capabilities, "sales"),
    },
    {
      label: language === "sw" ? "Ongeza bidhaa/huduma" : "Add Product / Service",
      icon: PackagePlus,
      to: "/inventory?new=true",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      show: hasCapability(capabilities, "products") || hasCapability(capabilities, "services"),
    },
    {
      label: language === "sw" ? "Rekodi ununuzi" : "Record Purchase",
      icon: ShoppingCart,
      to: "/purchases?new=true",
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      show: hasCapability(capabilities, "purchases"),
    },
    {
      label: language === "sw" ? "Pokea malipo" : "Receive Payment",
      icon: WalletCards,
      to: "/customers",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      show: hasCapability(capabilities, "payments"),
    },
    {
      label: language === "sw" ? "Ongeza gharama" : "Add Expense",
      icon: CircleDollarSign,
      to: "/expenses?new=true",
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      show: hasCapability(capabilities, "expenses"),
    },
    {
      label: language === "sw" ? "Uzalishaji mpya" : "New Production",
      icon: Factory,
      to: "/production?new=true",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      show: hasCapability(capabilities, "manufacturing") || hasCapability(capabilities, "batches"),
    },
    {
      label: language === "sw" ? "Weka miadi" : "Book Appointment",
      icon: CalendarPlus,
      to: "/appointments?new=true",
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950/40",
      show: hasCapability(capabilities, "appointments"),
    },
  ].filter((action) => action.show);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <>
      {/* FAB — only on mobile */}
      <motion.button
        type="button"
        aria-label={language === "sw" ? "Vitendo vya haraka" : "Quick actions"}
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.93 }}
        className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(26,29,41,0.5)] ring-4 ring-background transition-all md:hidden"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
          right: "1.25rem",
        }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div key="plus" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Plus className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Action Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[1.75rem] border-t border-border bg-card px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.75rem)]"
        >
          <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-border" />
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="text-base font-bold">
              {language === "sw" ? "Anza kazi" : "Start an action"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {language === "sw" ? "Fikia kazi zako za kila siku kwa haraka." : "Reach your most common workflows quickly."}
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            {actions.map(({ label, icon: Icon, to, color, bg }) => (
              <motion.button
                key={to}
                type="button"
                onClick={() => go(to)}
                whileTap={{ scale: 0.97 }}
                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border bg-card px-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <span className="leading-tight">{label}</span>
              </motion.button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
