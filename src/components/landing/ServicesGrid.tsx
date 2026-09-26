import {
  ShoppingCart,
  Package,
  BarChart3,
  WifiOff,
  Users,
  Receipt,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SERVICES = [
  {
    icon: ShoppingCart,
    titleEn: "Point of Sale",
    titleSw: "Mauzo (POS)",
    bodyEn: "Fast checkout, multiple payment methods, and instant receipts.",
    bodySw: "Malipo ya haraka, njia nyingi za kulipa, na risiti papo hapo.",
  },
  {
    icon: Package,
    titleEn: "Inventory",
    titleSw: "Stoki",
    bodyEn: "Track stock in and out, low-stock alerts, and purchase orders.",
    bodySw: "Fuatilia stoki inayoingia na kutoka, tahadhari, na maagizo ya ununuzi.",
  },
  {
    icon: BarChart3,
    titleEn: "Daily profit",
    titleSw: "Faida ya siku",
    bodyEn: "See real margin after costs — not just sales totals.",
    bodySw: "Ona faida halisi baada ya gharama — si jumla ya mauzo tu.",
  },
  {
    icon: WifiOff,
    titleEn: "Offline-first",
    titleSw: "Bila mtandao",
    bodyEn: "Keep selling when the network drops; sync when you’re back online.",
    bodySw: "Endelea kuuza mtandao ukikatika; sasisha ukirudi mtandaoni.",
  },
  {
    icon: Users,
    titleEn: "Team & roles",
    titleSw: "Timu & majukumu",
    bodyEn: "Owners, managers, and staff with the right permissions.",
    bodySw: "Wamiliki, wasimamizi, na wafanyakazi wenye ruhusa sahihi.",
  },
  {
    icon: Receipt,
    titleEn: "Expenses & finance",
    titleSw: "Gharama & fedha",
    bodyEn: "Record expenses and keep a clean picture of cash flow.",
    bodySw: "Rekodi gharama na uwe na picha safi ya mtiririko wa fedha.",
  },
];

export function ServicesGrid() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="services" className="border-b border-border/60 bg-muted/20 py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 sm:mb-14 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            {isSw ? "Huduma" : "Services"}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            {isSw ? "Kila kitu unachohitaji kuendesha duka." : "Everything you need to run the shop."}
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.titleEn}
              className="group rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-500/15">
                <s.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-foreground">
                {isSw ? s.titleSw : s.titleEn}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {isSw ? s.bodySw : s.bodyEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
