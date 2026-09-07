import { useState } from "react";
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
  Store,
  Building2,
  Cpu,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const businessTypes = [
  { id: "all", labelEn: "All Businesses", labelSw: "Biashara Zote", icon: Sparkles },
  { id: "retail", labelEn: "Retail Shops & Minisupermarkets", labelSw: "Maduka ya Rejareja & Minisupermarket", icon: Store },
  { id: "wholesale", labelEn: "Wholesalers & Distributors", labelSw: "Maduka ya Jumla & Wasambazaji", icon: Building2 },
  { id: "production", labelEn: "Workshops & Manufacturing", labelSw: "Karakana & Viwanda Vidogo", icon: Factory },
  { id: "services", labelEn: "Salons, Spas & Services", labelSw: "Saluni & Watoa Huduma", icon: Scissors },
];

const erpModules = [
  {
    icon: Tag,
    category: ["all", "retail", "wholesale", "services"],
    titleEn: "Point of Sale (POS)",
    titleSw: "Mauzo na Risiti (POS)",
    descEn: "Lightning-fast checkout with barcode scanning, custom receipt printing, and split cash / M-Pesa payments.",
    descSw: "Malipo ya haraka sana kwa skana ya barcode, uchapishaji wa risiti za wateja, na malipo ya pesa taslimu au M-Pesa.",
  },
  {
    icon: Package,
    category: ["all", "retail", "wholesale", "production"],
    titleEn: "Inventory & Stock Tracking",
    titleSw: "Udhibiti Kamili wa Stoki",
    descEn: "Live stock valuations, weighted average costing, low stock alert warnings, barcode generation, and CSV import.",
    descSw: "Tathmini ya thamani ya stoki kwa wakati halisi, tahadhari za bidhaa zilizobaki kidogo, na utengenezaji wa barcodes.",
  },
  {
    icon: ShoppingCart,
    category: ["all", "retail", "wholesale", "production"],
    titleEn: "Purchasing & Stock In",
    titleSw: "Manunuzi na Mapokezi ya Stoki",
    descEn: "Record purchase orders from suppliers, update inventory quantities, and manage pending supplier payments automatically.",
    descSw: "Rekodi maagizo ya manunuzi kutoka kwa wasambazaji, ongeza idadi ya stoki, na fuatilia madeni ya wasambazaji kiotomatiki.",
  },
  {
    icon: Users,
    category: ["all", "retail", "wholesale"],
    titleEn: "Customer Credit & Receivables",
    titleSw: "Wateja na Madeni ya Mkopo",
    descEn: "Track customer credit balances, record partial debt repayments in installments, and send SMS balance reminders.",
    descSw: "Fuatilia madeni ya wateja, pokea malipo ya awamu, na angalia historia kamili ya manunuzi na masalio ya kila mteja.",
  },
  {
    icon: Factory,
    category: ["all", "production"],
    titleEn: "Production & Batch Recipes",
    titleSw: "Uzalishaji na Utengenezaji",
    descEn: "Track batch runs, automatically deduct raw material ingredients from stock, and yield finished products ready for sale.",
    descSw: "Fuatilia awamu za uzalishaji, kata malighafi zilizotumika stoo kiotomatiki, na ongeza bidhaa zilizokamilika tayari kuuzwa.",
  },
  {
    icon: Scissors,
    category: ["all", "services"],
    titleEn: "Services & Appointments",
    titleSw: "Huduma na Miadi",
    descEn: "Schedule client appointments, assign service staff, and bill time-based or fixed-price services without inventory friction.",
    descSw: "Panga miadi ya wateja, gawa majukumu kwa wahudumu, na toa risiti za huduma kwa urahisi bila usumbufu wa kuhesabu stoki.",
  },
  {
    icon: BarChart3,
    category: ["all", "retail", "wholesale", "production", "services"],
    titleEn: "Financial Reports & P&L",
    titleSw: "Ripoti za Faida na Hasara (P&L)",
    descEn: "Generate real P&L statements with genuine COGS, payment method breakdowns, and profit margins calculated automatically.",
    descSw: "Tengeneza ripoti za kweli za faida na hasara zenye gharama halisi za ununuzi (COGS) na mchanganuo wa njia za malipo.",
  },
  {
    icon: DollarSign,
    category: ["all", "retail", "wholesale", "production", "services"],
    titleEn: "Operating Expenses & Overheads",
    titleSw: "Gharama na Matumizi ya Uendeshaji",
    descEn: "Record and categorize overhead costs like rent, electricity, transport, and staff stipends to see your true bottom line.",
    descSw: "Rekodi matumizi ya biashara kama kodi, umeme, usafiri na mishahara ili kuona faida yako halisi ya mwisho.",
  },
  {
    icon: UsersRound,
    category: ["all", "retail", "wholesale", "production", "services"],
    titleEn: "Staff Roles & Access Permissions",
    titleSw: "Wafanyakazi na Ruhusa",
    descEn: "Restrict cashier vs manager permissions across the system. Ensure cashiers can sell without seeing sensitive profit reports.",
    descSw: "Weka mipaka ya wahudumu dhidi ya mameneja. Ruhusu keshia auza bila kuona ripoti za siri za faida au manunuzi.",
  },
];

export function Features() {
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState("all");

  const filteredModules = erpModules.filter((m) =>
    selectedType === "all" ? true : m.category.includes(selectedType)
  );

  return (
    <section id="features" className="py-20 bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {language === "sw"
              ? "Moduli Zote za Biashara Yako Kwenye Mfumo Mmoja"
              : "Every Module Built for Total Business Control"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {language === "sw"
              ? "Haijalishi kama unauza rejareja, jumla, uzalishaji au huduma — WiseCash ina kila kifaa unachohitaji kufanikiwa."
              : "Whether you run retail, wholesale, manufacturing, or service appointments — WiseCash brings unified clarity to every shift."}
          </p>
        </div>

        {/* Folded Business Types Tag Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            {language === "sw" ? "Inafaa Kwa:" : "Works For:"}
          </span>
          {businessTypes.map((t) => {
            const Icon = t.icon;
            const active = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{language === "sw" ? t.labelSw : t.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((m, index) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.titleEn}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <Card className="h-full border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {language === "sw" ? m.titleSw : m.titleEn}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === "sw" ? m.descSw : m.descEn}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
