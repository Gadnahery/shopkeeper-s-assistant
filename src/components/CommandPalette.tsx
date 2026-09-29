import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  ClipboardList,
  CheckSquare,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  UserCog,
  Building2,
  UserPlus,
  Gift,
  Bell,
} from "lucide-react";

const PAGES = [
  { path: "/sales", labelKey: "nav.sales", labelOverride: "Point of Sale (POS)", icon: ShoppingCart },
  { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { path: "/inventory", labelKey: "nav.inventory", icon: Package },
  { path: "/categories", labelKey: "nav.categories", icon: Tags },
  { path: "/orders", labelKey: "nav.orders", icon: ClipboardList },
  { path: "/todo", labelKey: "nav.todo", icon: CheckSquare },
  { path: "/customers", labelKey: "nav.customers", icon: Users },
  { path: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
  { path: "/expenses", labelKey: "nav.expenses", icon: Receipt },
  { path: "/hrm", labelKey: "nav.hrm", icon: UserCog },
  { path: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { path: "/loyalty", labelKey: "nav.loyalty", icon: Gift },
  { path: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { path: "/user-management", labelKey: "nav.userManagement", icon: UserPlus },
  { path: "/assets", labelKey: "nav.assets", icon: Building2 },
  { path: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const handleOpen = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener("open-search-palette", handleOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-search-palette", handleOpen);
    };
  }, []);

  const run = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={language === "sw" ? 'Tafuta (k.m. "Point of Sale", kurasa)...' : 'Type to search (e.g. "Point of Sale", pages)...'} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading={language === "sw" ? "Nenda Kwenye Ukurasa" : "Quick Navigate"}>
          {PAGES.map((p) => {
            const Icon = p.icon;
            const label = p.labelOverride || t(p.labelKey);
            return (
              <CommandItem key={p.path + (p.labelOverride || "")} onSelect={() => run(p.path)}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
