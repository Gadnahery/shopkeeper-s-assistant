import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingCart, Package, Receipt, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const actions = [
  { path: "/sales/terminal", icon: ShoppingCart, labelKey: "dashboard.newSale" },
  { path: "/inventory/add", icon: Package, labelKey: "dashboard.addProduct" },
  { path: "/expenses", icon: Receipt, labelKey: "dashboard.recordExpense" },
  { path: "/orders", icon: ClipboardList, labelKey: "nav.orders" },
];

export function FloatingActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleAction = (path: string) => {
    playSound("click");
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {actions.map((a) => (
              <Button
                key={a.path}
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2 rounded-xl shadow-lg border bg-card/95 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary",
                  "transition-all duration-200 hover:scale-105"
                )}
                onClick={() => handleAction(a.path)}
              >
                <a.icon className="h-4 w-4" />
                <span>{t(a.labelKey)}</span>
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-2xl shadow-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700",
            "border-0 text-white transition-all duration-200 hover:scale-105"
          )}
          onClick={() => {
            playSound("click");
            setOpen((o) => !o);
          }}
          aria-label="Quick actions"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}
