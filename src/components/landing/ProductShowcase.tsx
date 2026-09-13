import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Package,
  Users,
  BarChart3,
  Settings2,
  CheckCircle2,
  ArrowRight,
  Search,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

type TabKey = "sales" | "inventory" | "credit" | "finance" | "operations";

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<TabKey>("sales");
  const { language } = useLanguage();
  const isSw = language === "sw";

  const tabs: { key: TabKey; labelEn: string; labelSw: string; icon: any }[] = [
    { key: "sales", labelEn: "Sales & POS", labelSw: "Mauzo & POS", icon: Tag },
    { key: "inventory", labelEn: "Inventory", labelSw: "Stoki & Ghala", icon: Package },
    { key: "credit", labelEn: "Customer Credit", labelSw: "Madeni ya Wateja", icon: Users },
    { key: "finance", labelEn: "Profit & Finance", labelSw: "Faida & Hesabu", icon: BarChart3 },
    { key: "operations", labelEn: "Operations", labelSw: "Uendeshaji & Timu", icon: Settings2 },
  ];

  return (
    <section id="showcase" className="py-20 sm:py-28 bg-background border-b border-border/70 scroll-mt-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="inline-block rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isSw ? "Mfumo Mmoja Kamili" : "One System for Your Business"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isSw ? "Tazama WiseCash Inavyofanya Kazi" : "See Exactly How WiseCash Works"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSw
              ? "Uza kwa haraka, fuatilia stoki, dhibiti madeni na uone faida yako bila madaftari au mahesabu magumu."
              : "Sell faster, track live inventory, eliminate notebook credit losses, and see your true daily profit."}
          </p>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{isSw ? tab.labelSw : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Interactive Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Left 5 cols: Concise outcome copy (20%) */}
            <div className="lg:col-span-5 space-y-6">
              {activeTab === "sales" && (
                <>
                  <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider">
                    {isSw ? "Mauzo ya Haraka ya POS" : "High-Speed Point of Sale"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSw ? "Uza haraka sana na uweke rekodi ya kila senti." : "Sell quickly and keep every transaction recorded."}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isSw
                      ? "Fanya mauzo kwa sekunde chache kwa skana ya barcode au kugusa. Gawanya malipo ya M-Pesa na taslimu, kisha toa risiti za kidijitali."
                      : "Checkout in seconds with barcode scan or one-tap search. Accept split payments between M-Pesa and Cash, with custom printed or digital receipts."}
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-foreground">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Malipo ya mchanganyiko (Taslimu + M-Pesa + Mkopo)" : "Split tenders: Cash + M-Pesa + Customer Credit"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Inafanya kazi hata intaneti inapokatika (Offline)" : "Full checkout functionality even with zero internet"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Uchapishaji wa risiti au SMS kwa mteja" : "Thermal receipt printing or direct customer SMS"}</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "inventory" && (
                <>
                  <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider">
                    {isSw ? "Usimamizi wa Stoki" : "Live Inventory Tracking"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSw ? "Jua ulichonacho, kinachoisha na cha kuagiza." : "Know what you have, what is moving, and what to restock."}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isSw
                      ? "Stoki yako inapungua kiotomatiki kila unapouza. Pata taarifa za haraka bidhaa zikikaribia kuisha ili usipoteze wateja."
                      : "Stock automatically deducts on every sale. Receive instant low-stock alerts before items run out, with live valuation at cost."}
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-foreground">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Tahadhari za bidhaa zilizobaki chache (Low stock)" : "Automated low-stock threshold warning alerts"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Thamani halisi ya duka nzima kwa bei ya jumla" : "Real-time inventory valuation at purchase cost"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Kuweka bidhaa nyingi kwa pamoja kupitia Excel/CSV" : "Bulk product imports & barcode generator"}</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "credit" && (
                <>
                  <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider">
                    {isSw ? "Daftari la Madeni" : "Customer Credit & Debts"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSw ? "Fuatilia madeni ya wateja bila kupoteza kurasa za daftari." : "Track customer credit and debt balances without notebooks."}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isSw
                      ? "Hakuna tena kubishana na wateja. Kila deni, tarehe, na malipo ya awamu yanarekodiwa kwa jina na namba ya simu ya mteja."
                      : "Eliminate disputed balances and lost notebook pages. Record credit sales, log partial installment repayments, and keep clear histories."}
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-foreground">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Kikomo cha deni (Credit limit) kwa kila mteja" : "Set custom credit limits to prevent overdue debt risks"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Pokea malipo ya kidogo kidogo (Installments)" : "Record partial repayments smoothly with auto-updated balance"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Tuma ujumbe wa salio la deni moja kwa moja" : "Clear statement reports for customer transparency"}</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "finance" && (
                <>
                  <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider">
                    {isSw ? "Hesabu za Faida na Hasara" : "Financial P&L Reporting"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSw ? "Angalia mapato, gharama na faida halisi sehemu moja." : "See expenses, revenue and net profit in one place."}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isSw
                      ? "Mauzo sio faida. WiseCash inatoa gharama halisi za bidhaa (COGS) na kutoa matumizi kama kodi na umeme ili ujue faida yako halisi."
                      : "Revenue is not profit. WiseCash calculates real Cost of Goods Sold and deducts operating expenses like rent and bills for true net profit."}
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-foreground">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Hesabu halisi ya faida (Net Profit) ya siku, wiki au mwezi" : "True automated Net Profit calculations (Daily/Weekly/Monthly)"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Kumbukumbu ya gharama za duka (Kodi, umeme, mishahara)" : "Overhead expense categorization & spending reports"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Mchanganuo wa pesa taslimu vs pesa za mitandao" : "Cash vs Mobile Money reconciliation statement"}</span>
                    </li>
                  </ul>
                </>
              )}

              {activeTab === "operations" && (
                <>
                  <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider">
                    {isSw ? "Uendeshaji na Wafanyakazi" : "Operations & Staff Permissions"}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSw ? "Dhibiti manunuzi ya wasambazaji na ruhusa za wafanyakazi." : "Manage purchasing, supplier bills, and team access."}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isSw
                      ? "Gawa majukumu salama kwa wafanyakazi wako. Keshia anauza tu bila kuona faida wala kubadilisha bei za bidhaa."
                      : "Delegate safely with role-based access. Cashiers can ring sales without seeing your profit margins or changing inventory costs."}
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-foreground">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Akaunti tofauti za Keshia na Meneja" : "Role permissions: Cashier vs Manager vs Owner"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Rekodi ya manunuzi kutoka kwa wasambazaji" : "Supplier purchase orders & incoming stock receipts"}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{isSw ? "Kumbukumbu ya kila muamala na anayeufanya" : "Detailed audit trails of every transaction"}</span>
                    </li>
                  </ul>
                </>
              )}

              <div className="pt-2">
                <Button
                  asChild
                  className="h-11 sm:h-12 rounded-2xl bg-primary px-7 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Link to="/signup" className="flex items-center gap-2">
                    <span>{isSw ? "Anza Majaribio Bure" : "Start Free Trial"}</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right 7 cols: Rich, realistic WiseCash UI preview (80%) */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xl backdrop-blur-xs">
                {/* 1. SALES POS UI MOCKUP */}
                {activeTab === "sales" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-foreground">WiseCash POS Terminal</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">Order #TZ-8924</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Left: Product Quick Selection */}
                      <div className="sm:col-span-7 space-y-2">
                        <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
                          <Search className="h-3.5 w-3.5" />
                          <span>{isSw ? "Tafuta bidhaa au skana barcode..." : "Search items or scan barcode..."}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1 hover:border-primary/50 transition-colors cursor-pointer">
                            <p className="font-bold text-foreground truncate">Azam Sugar 1kg</p>
                            <p className="text-[11px] font-semibold text-primary">TZS 3,200</p>
                            <span className="text-[9px] text-emerald-600 font-medium">42 in stock</span>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1 hover:border-primary/50 transition-colors cursor-pointer">
                            <p className="font-bold text-foreground truncate">Cooking Oil 1L</p>
                            <p className="text-[11px] font-semibold text-primary">TZS 6,500</p>
                            <span className="text-[9px] text-emerald-600 font-medium">18 in stock</span>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1 hover:border-primary/50 transition-colors cursor-pointer">
                            <p className="font-bold text-foreground truncate">Kilimanjaro Water 1.5L</p>
                            <p className="text-[11px] font-semibold text-primary">TZS 1,500</p>
                            <span className="text-[9px] text-emerald-600 font-medium">55 in stock</span>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1 hover:border-primary/50 transition-colors cursor-pointer">
                            <p className="font-bold text-foreground truncate">Ngano Safi 2kg</p>
                            <p className="text-[11px] font-semibold text-primary">TZS 4,200</p>
                            <span className="text-[9px] text-emerald-600 font-medium">24 in stock</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Checkout Drawer */}
                      <div className="sm:col-span-5 rounded-xl border border-border/80 bg-muted/30 p-3 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span>{isSw ? "Kikapu cha Mauzo" : "Active Cart"}</span>
                            <span className="text-[10px] text-primary font-semibold">2 items</span>
                          </p>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between border-b border-border/40 pb-1">
                              <span>Azam Sugar 1kg x 2</span>
                              <span className="font-bold">TZS 6,400</span>
                            </div>
                            <div className="flex justify-between border-b border-border/40 pb-1">
                              <span>Cooking Oil 1L x 4</span>
                              <span className="font-bold">TZS 26,000</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <div className="flex justify-between text-xs font-black text-foreground">
                            <span>Jumla (Total):</span>
                            <span className="text-emerald-600 dark:text-emerald-400">TZS 32,400</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                            <span className="text-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 py-1 text-emerald-700 dark:text-emerald-300">
                              M-Pesa (TZS 32,400)
                            </span>
                            <span className="text-center rounded-lg bg-muted border border-border py-1 text-muted-foreground">
                              {isSw ? "Taslimu" : "Cash"}
                            </span>
                          </div>
                          <div className="w-full text-center rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground shadow-xs">
                            {isSw ? "Kamilisha Mauzo ✓" : "Complete Checkout ✓"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. INVENTORY UI MOCKUP */}
                {activeTab === "inventory" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          {isSw ? "Orodha ya Stoki ya Duka" : "Stock Inventory Ledger"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {isSw ? "Bidhaa 142 • Thamani: TZS 24,800,000" : "142 SKUs • Valuation: TZS 24,800,000"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {isSw ? "Bidhaa 3 Zimepungua" : "3 Low Stock Alerts"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border/50 p-2.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">Azam Wheat Flour 2kg</p>
                          <p className="text-[10px] font-mono text-muted-foreground">SKU: AZM-WHT-02 • Bei: TZS 4,200</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            64 in stock
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Cost: TZS 3,500</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/30 p-2.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">Sunseed Cooking Oil 5L</p>
                          <p className="text-[10px] font-mono text-muted-foreground">SKU: SUN-OIL-05 • Bei: TZS 28,500</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            2 left (Low Stock)
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Cost: TZS 24,000</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border/50 p-2.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">Mo Super Dawa Soap (Bar)</p>
                          <p className="text-[10px] font-mono text-muted-foreground">SKU: MO-SOAP-01 • Bei: TZS 1,800</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            88 in stock
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Cost: TZS 1,350</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CUSTOMER CREDIT UI MOCKUP */}
                {activeTab === "credit" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          {isSw ? "Madeni ya Wateja wa Mkopo" : "Customer Receivables Ledger"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {isSw ? "Jumla ya Madeni: TZS 1,120,000" : "Total Outstanding Debt: TZS 1,120,000"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {isSw ? "Wateja 3 Wenye Madeni" : "3 Active Debtors"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">Juma Rashid</p>
                          <p className="text-[10px] text-muted-foreground">0754 123 456 • Deni tangu 08 Sept</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-extrabold text-amber-600 dark:text-amber-400">TZS 350,000</p>
                          <span className="inline-block rounded bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">
                            {isSw ? "Pokea Malipo" : "Record Repayment"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">Mama Asha Catering</p>
                          <p className="text-[10px] text-muted-foreground">0713 987 654 • Deni tangu 02 Sept</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-extrabold text-amber-600 dark:text-amber-400">TZS 520,000</p>
                          <span className="inline-block rounded bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">
                            {isSw ? "Pokea Malipo" : "Record Repayment"}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">Peter Massawe</p>
                          <p className="text-[10px] text-muted-foreground">0784 456 789 • Deni tangu 11 Sept</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-extrabold text-amber-600 dark:text-amber-400">TZS 250,000</p>
                          <span className="inline-block rounded bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">
                            {isSw ? "Pokea Malipo" : "Record Repayment"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PROFIT & FINANCE UI MOCKUP */}
                {activeTab === "finance" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          {isSw ? "Taarifa ya Faida na Hasara (P&L)" : "Net Profit & Loss Statement"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {isSw ? "Kipindi: Mwezi Huu (Septemba 2026)" : "Period: This Month (September 2026)"}
                        </p>
                      </div>
                      <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                        {isSw ? "Hesabu Kiotomatiki" : "Auto-Calculated"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">{isSw ? "1. Jumla ya Mauzo (Revenue)" : "1. Gross Revenue"}</span>
                        <span className="font-bold text-foreground">TZS 12,450,000</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">{isSw ? "2. Gharama ya Bidhaa (COGS)" : "2. Cost of Goods Sold (COGS)"}</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">- TZS 8,200,000</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40 bg-muted/20 px-2 rounded-lg">
                        <span className="font-bold text-foreground">{isSw ? "Faida Ghafi (Gross Margin)" : "Gross Profit Margin"}</span>
                        <span className="font-bold text-foreground">TZS 4,250,000 (34.1%)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">{isSw ? "3. Matumizi ya Duka (Kodi, Umeme)" : "3. Operating Overheads"}</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">- TZS 1,150,000</span>
                      </div>
                      <div className="flex justify-between py-2 bg-emerald-500/10 border border-emerald-500/30 px-3 rounded-xl mt-2">
                        <span className="font-black text-emerald-800 dark:text-emerald-300">
                          {isSw ? "FAIDA HALISI (NET PROFIT):" : "TRUE NET PROFIT:"}
                        </span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          TZS 3,100,000
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. OPERATIONS UI MOCKUP */}
                {activeTab === "operations" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          {isSw ? "Usimamizi wa Timu na Manunuzi" : "Staff Access & Supplier Restock"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {isSw ? "Wafanyakazi 3 • Wasambazaji 5" : "3 Active Staff • 5 Registered Suppliers"}
                        </p>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border/50 p-2.5">
                        <div>
                          <p className="font-bold text-foreground">Neema Mtui (Keshia / Cashier)</p>
                          <p className="text-[10px] text-muted-foreground">Ruhusa: Mauzo ya POS tu • Haoni Faida wala COGS</p>
                        </div>
                        <span className="rounded bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">
                          POS Access
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border/50 p-2.5">
                        <div>
                          <p className="font-bold text-foreground">Baraka John (Meneja wa Stoo)</p>
                          <p className="text-[10px] text-muted-foreground">Ruhusa: Kuingiza bidhaa, manunuzi, na stoki</p>
                        </div>
                        <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                          Stock Manager
                        </span>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">Agizo la Manunuzi #PO-402</p>
                          <p className="text-[10px] text-muted-foreground">Kutoka: Bakhresa Grain Mills • Azam Ngano x 50</p>
                        </div>
                        <span className="rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                          Received & Stocked ✓
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
