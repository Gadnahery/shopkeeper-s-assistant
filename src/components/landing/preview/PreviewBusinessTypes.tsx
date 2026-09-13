import { Store, Building2, Wrench, Scissors, Factory, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function PreviewBusinessTypes() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const businesses = [
    {
      icon: Store,
      nameEn: "Retail Shops & Mini-Markets",
      nameSw: "Maduka ya Rejareja & Minisupermarket",
      benefitEn: "Sell faster. Keep stock accurate with barcode checkout.",
      benefitSw: "Uza haraka zaidi. Weka stoki sahihi kwa skana ya barcode.",
    },
    {
      icon: Building2,
      nameEn: "Wholesale & Distributors",
      nameSw: "Maduka ya Jumla & Wasambazaji",
      benefitEn: "Track bulk cartons, customer ledgers, and delivery orders.",
      benefitSw: "Dhibiti katoni za jumla, madeni ya wateja, na maagizo ya mzigo.",
    },
    {
      icon: Wrench,
      nameEn: "Hardware & Spare Parts",
      nameSw: "Hardware & Spea za Magari",
      benefitEn: "Manage thousands of items, supplier restocks, and contractor credit.",
      benefitSw: "Dhibiti maelfu ya vifaa, manunuzi ya wasambazaji, na mikopo.",
    },
    {
      icon: Scissors,
      nameEn: "Salons, Spas & Services",
      nameSw: "Saluni, Spa & Watoa Huduma",
      benefitEn: "Schedule client appointments, record staff commissions, bill without stock.",
      benefitSw: "Panga miadi ya wateja, gawa asilimia za wafanyakazi bila kero ya stoki.",
    },
    {
      icon: Factory,
      nameEn: "Workshops & Production",
      nameSw: "Karakana & Uzalishaji",
      benefitEn: "Auto-deduct raw ingredients and yield finished goods ready for sale.",
      benefitSw: "Kata malighafi stoo kiotomatiki na ongeza bidhaa zilizokamilika.",
    },
    {
      icon: ShoppingBag,
      nameEn: "Pharmacies & Agrovet",
      nameSw: "Maduka ya Dawa & Pembejeo",
      benefitEn: "Track batch numbers, expiry dates, and prescription sales records.",
      benefitSw: "Fuatilia namba za bachi, tarehe za mwisho wa matumizi, na wateja.",
    },
  ];

  return (
    <section id="businesses" className="py-20 sm:py-24 bg-background border-b border-border/70 scroll-mt-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <span className="inline-block rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isSw ? "Inafaa Biashara Yako" : "Built for Growing Businesses"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isSw ? "Mfumo Mmoja. Biashara Yako." : "One System. Your Kind of Business."}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSw
              ? "Haijalishi unauza bidhaa moja moja, kwa jumla au unatoa huduma — WiseCash inarekebishika kufaa muundo wako."
              : "Whether you run a fast-paced retail shop, wholesale depot, or service business, WiseCash adapts to your exact workflow."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/70 bg-card p-5 space-y-2.5 hover:border-primary/40 transition-colors shadow-xs"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{isSw ? b.nameSw : b.nameEn}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{isSw ? b.benefitSw : b.benefitEn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
