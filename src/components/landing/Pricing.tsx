import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const includedFeatures = [
  { en: "Point of Sale (POS) & custom receipts", sw: "Mauzo ya POS & risiti za wateja" },
  { en: "Live inventory & low stock notifications", sw: "Usimamizi wa stoki & tahadhari za bidhaa chache" },
  { en: "Customer credit & partial repayments", sw: "Mauzo ya mkopo & kumbukumbu za madeni ya wateja" },
  { en: "Supplier purchase orders & restock tracking", sw: "Manunuzi ya wasambazaji & upokeaji stoki" },
  { en: "Production & manufacturing batch recipes", sw: "Awamu za uzalishaji & upishi wa bidhaa" },
  { en: "Financial profit & loss (P&L) reports", sw: "Ripoti halisi za faida na hasara (P&L)" },
  { en: "Operating expense & overhead tracking", sw: "Kumbukumbu ya gharama za uendeshaji" },
  { en: "Staff permissions (Cashier vs Manager roles)", sw: "Ruhusa za wafanyakazi (Keshia vs Meneja)" },
  { en: "Works 100% offline with auto cloud-sync", sw: "Inafanya kazi bila intaneti (Offline PWA)" },
];

export function Pricing() {
  const { language } = useLanguage();

  return (
    <section id="pricing" className="py-20 bg-muted/20 border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Zap className="h-3.5 w-3.5" />
            <span>{language === "sw" ? "Mpango Mmoja Kamili" : "One Transparent Plan"}</span>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">
            {language === "sw" ? "Gharama Wazi Bila Ada Zilizofichwa" : "Simple, Transparent Pricing"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {language === "sw"
              ? "Moduli zote 10 zimejumuishwa kwenye mpango mmoja wa bei nafuu. Lipa kwa simu, hauhitaji kadi ya benki."
              : "All 10 modules included in one affordable plan. Pay with mobile money — no credit card needed."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg rounded-3xl border border-primary/40 bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden"
        >
          {/* Subtle top accent ribbon */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">WiseCash Pro</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "sw" ? "Mpango wa Biashara Kamili" : "Full Business Suite"}
              </p>
            </div>
            <Badge className="bg-primary/15 text-primary border-primary/30 font-bold text-xs py-1 px-3">
              {language === "sw" ? "Ufikiaji Wote" : "All-Inclusive"}
            </Badge>
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-foreground">TZS 25,000</span>
            <span className="text-sm font-medium text-muted-foreground">
              {language === "sw" ? "/ mwezi kwa duka" : "/ month per shop"}
            </span>
          </div>

          {/* Differentiator Banner: Mobile Money Supported */}
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>{language === "sw" ? "Lipa kwa Simu — Hakuna Kadi Inayohitajika" : "Pay with Mobile Money — No Card Needed"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {language === "sw"
                ? "Tuma malipo moja kwa moja kupitia Vodacom M-Pesa au HaloPesa. Akaunti yako inathibitishwa na kuwa hai mara moja."
                : "Send payment directly via Vodacom M-Pesa or HaloPesa. Your shop account is activated quickly."}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {language === "sw" ? "Vilivyojumuishwa:" : "What's Included:"}
            </p>
            <ul className="space-y-2.5">
              {includedFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{language === "sw" ? f.sw : f.en}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild size="lg" className="mt-8 h-12 w-full rounded-xl bg-primary text-sm font-bold shadow-md hover:bg-primary/90">
            <Link to="/signup" className="flex items-center justify-center gap-2">
              <span>{language === "sw" ? "Anza Sasa (TZS 25,000/mwezi)" : "Get Started (TZS 25,000/mo)"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {language === "sw"
              ? "Hakuna mkataba wa lazima. Unaweza kuhuisha mwezi kwa mwezi upendavyo."
              : "No lock-in contract. Renew monthly on your terms whenever you choose."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
