import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Factory,
  BarChart3,
  Users,
  DollarSign,
  UsersRound,
  ShieldCheck,
  Tag,
  Boxes,
  Scissors,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

const erpModules = [
  {
    icon: ShoppingCart,
    titleEn: "Purchasing & Stock In",
    titleSw: "Manunuzi na Mapokezi ya Stoki",
    descEn: "Record purchase orders from suppliers, update inventory quantities, and manage pending supplier payments automatically.",
    descSw: "Rekodi maagizo ya manunuzi kutoka kwa wasambazaji, ongeza idadi ya stoki, na fuatilia madeni ya wasambazaji kiotomatiki.",
  },
  {
    icon: Scissors,
    titleEn: "Services & Appointments",
    titleSw: "Huduma na Miadi",
    descEn: "Schedule client appointments, assign service staff, and bill time-based or fixed-price services without inventory friction.",
    descSw: "Panga miadi ya wateja, gawa majukumu kwa wahudumu, na toa risiti za huduma kwa urahisi bila usumbufu wa kuhesabu stoki.",
  },
  {
    icon: Layers,
    titleEn: "Universal Catalog (Hybrid)",
    titleSw: "Katalogi ya Pamoja (Hybrid)",
    descEn: "Sell physical inventory items alongside professional services in a single unified POS basket.",
    descSw: "Uza bidhaa zenye stoki sambamba na huduma za kitaalamu kwenye kikapu kimoja cha mauzo.",
  },
  {
    icon: Factory,
    titleEn: "Production & Manufacturing",
    titleSw: "Uzalishaji na Utengenezaji",
    descEn: "Track batch runs, automatically deduct raw material ingredients from stock, and yield finished products ready for sale.",
    descSw: "Fuatilia awamu za uzalishaji, kata malighafi zilizotumika stoo kiotomatiki, na ongeza bidhaa zilizokamilika tayari kuuzwa.",
  },
  {
    icon: Tag,
    titleEn: "Point of Sale (POS)",
    titleSw: "Mauzo na Risiti (POS)",
    descEn: "Lightning fast checkout with barcode scanning, custom receipt printing, and split cash / mobile money payment modes.",
    descSw: "Malipo ya haraka sana kwa skana ya barcode, uchapishaji wa risiti za wateja, na malipo ya pesa taslimu au mitandao ya simu.",
  },
  {
    icon: Package,
    titleEn: "Inventory & Stock Tracking",
    titleSw: "Udhibiti Kamili wa Stoki",
    descEn: "Real-time stock valuations, low stock alert warnings, barcode and QR code generation, and CSV imports.",
    descSw: "Tathmini ya thamani ya stoki kwa wakati halisi, tahadhari za bidhaa zilizobaki kidogo, na utengenezaji wa barcodes.",
  },
  {
    icon: Users,
    titleEn: "Customers & Receivables",
    titleSw: "Wateja na Madeni",
    descEn: "Track credit balances, accept debt repayments in installments, and view complete customer purchasing histories.",
    descSw: "Fuatilia madeni ya wateja, pokea malipo ya awamu, na angalia historia kamili ya manunuzi ya kila mteja.",
  },
  {
    icon: DollarSign,
    titleEn: "Finance & Operational Expenses",
    titleSw: "Gharama na Uendeshaji",
    descEn: "Categorize operational costs like rent, salaries, utilities, and logistics to understand your true net profit margin.",
    descSw: "Rekodi matumizi ya biashara kama kodi, umeme, usafiri na mishahara ili kujua faida halisi ya biashara yako.",
  },
  {
    icon: UsersRound,
    titleEn: "HR & User Permissions",
    titleSw: "Wafanyakazi na Ruhusa",
    descEn: "Manage team salaries, staff roles, and restrict cashier vs manager access permissions across the system.",
    descSw: "Simamia mishahara ya timu, majukumu ya wafanyakazi, na dhibiti nani ana ruhusa ya kuona au kubadilisha nini.",
  },
  {
    icon: BarChart3,
    titleEn: "Financial Reports & P&L",
    titleSw: "Ripoti za Faida na Hasara",
    descEn: "Generate detailed profit and loss statements, payment mix analyses, and export clean financial summaries.",
    descSw: "Tengeneza ripoti za faida na hasara, mchanganuo wa njia za malipo, na ripoti rasmi kwa ajili ya kufanya maamuzi.",
  },
];

export function Features() {
  const { language } = useLanguage();

  return (
    <section id="features" className="py-20 bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {language === "sw" ? "Moduli Zote za Biashara Yako Kwenye Mfumo Mmoja" : "Every Module Built for Total Operational Clarity"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {language === "sw"
              ? "Hakuna haja ya kutumia programu tofauti. WiseCash inaunganisha hatua zote za biashara kuanzia manunuzi, uzalishaji, stoki, hadi mauzo na ripoti."
              : "No need for fragmented spreadsheets. WiseCash connects your supply chain, inventory, cashier POS, and executive reporting in one place."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {erpModules.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={i}
                className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm hover:border-accent/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {language === "sw" ? f.titleSw : f.titleEn}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {language === "sw" ? f.descSw : f.descEn}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
