import {
  Package,
  Scissors,
  Pill,
  Wrench,
  ShoppingBag,
  Layers,
  Cpu,
  UtensilsCrossed,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BUSINESS_TYPES = [
  {
    icon: ShoppingBag,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    nameEn: "Retail Shop",
    nameSw: "Duka la Rejareja",
    descEn: "Point of sale, stock management, customer accounts",
    descSw: "Mauzo ya papo hapo, stoki, akaunti za wateja",
  },
  {
    icon: Package,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    nameEn: "Wholesale / Distributor",
    nameSw: "Jumla / Usambazaji",
    descEn: "Bulk pricing, customer orders, delivery management",
    descSw: "Bei ya jumla, maagizo, usimamizi wa utoaji",
  },
  {
    icon: Scissors,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    nameEn: "Barbershop / Salon",
    nameSw: "Kinyozi / Saluni",
    descEn: "Appointments, services without stock, staff scheduling",
    descSw: "Miadi, huduma bila stoki, ratiba ya wafanyakazi",
  },
  {
    icon: Pill,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    nameEn: "Pharmacy",
    nameSw: "Duka la Dawa",
    descEn: "Drug tracking, expiry alerts, prescription records",
    descSw: "Ufuatiliaji wa dawa, arifa za muda, rekodi za dawa",
  },
  {
    icon: UtensilsCrossed,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    nameEn: "Restaurant / Food",
    nameSw: "Mkahawa / Chakula",
    descEn: "Table orders, kitchen production, ingredient tracking",
    descSw: "Maagizo ya meza, uzalishaji, ufuatiliaji wa viungo",
  },
  {
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    nameEn: "Hardware / Workshop",
    nameSw: "Hardware / Karakana",
    descEn: "Tools & materials stock, job costing, customer accounts",
    descSw: "Stoki ya zana na vifaa, gharama za kazi, akaunti za wateja",
  },
  {
    icon: Layers,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    nameEn: "Hybrid Business",
    nameSw: "Biashara Mchanganyiko",
    descEn: "Sell products and services in the same transaction",
    descSw: "Uza bidhaa na huduma katika muamala mmoja",
  },
  {
    icon: Cpu,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    nameEn: "Any Business",
    nameSw: "Biashara Yoyote",
    descEn: "Configurable modules — enable only what you need",
    descSw: "Moduli zinazoweza kubadilishwa — wezesha unachohitaji tu",
  },
];

export function BusinessTypes() {
  const { language } = useLanguage();

  return (
    <section className="py-20 px-4 bg-card border-t border-border">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {language === "sw" ? "Inafaa kwa" : "Built for"}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {language === "sw" ? "Mfumo mmoja. Biashara yako." : "One system. Your kind of business."}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground">
            {language === "sw"
              ? "WiseCash inabadilika kulingana na aina ya biashara yako. Wezesha moduli unazohitaji tu."
              : "WiseCash adapts to how your business works. Enable only the modules you need — nothing extra."}
          </p>
        </div>

        {/* Business Type Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.nameEn}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${type.bg}`}>
                  <Icon className={`h-5 w-5 ${type.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    {language === "sw" ? type.nameSw : type.nameEn}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {language === "sw" ? type.descSw : type.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {language === "sw"
            ? "Soma bidhaa, huduma au mchanganyiko wake. WiseCash inashughulikia yote."
            : "Product businesses, service businesses, or both. WiseCash handles it all."}
        </p>
      </div>
    </section>
  );
}
