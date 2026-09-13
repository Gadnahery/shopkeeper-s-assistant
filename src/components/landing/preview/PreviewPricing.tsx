import { Link } from "react-router-dom";
import { Check, ArrowRight, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

export function PreviewPricing() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const features = [
    { en: "14-Day full access free trial (zero upfront payment)", sw: "Siku 14 za majaribio ya bure bila malipo ya awali" },
    { en: "High-speed Point of Sale (POS) & custom receipts", sw: "Mauzo ya haraka ya POS na uchapishaji wa risiti" },
    { en: "Live stock tracking & low-stock warning alerts", sw: "Udhibiti wa stoki na tahadhari za bidhaa zinazoisha" },
    { en: "Customer credit ledgers & partial debt repayments", sw: "Daftari la madeni ya wateja na malipo ya awamu" },
    { en: "Automated Profit & Loss (P&L) financial statements", sw: "Taarifa halisi za faida na hasara (P&L) kiotomatiki" },
    { en: "Supplier restocks, expense overheads & team roles", sw: "Manunuzi ya wasambazaji, matumizi na ruhusa za wafanyakazi" },
    { en: "Works 100% offline with automatic cloud synchronization", sw: "Inafanya kazi bila intaneti na kujisawazisha mtandao ukirudi" },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-24 bg-muted/20 border-b border-border/70 scroll-mt-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isSw ? "Siku 14 za Bure Zimejumuishwa" : "14-Day Free Trial Included"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isSw ? "Bei Rahisi na Wazi" : "Simple, Transparent Pricing"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSw
              ? "Jaribu mfumo mzima bure kwa siku 14. Kisha lipia ada moja ndogo kwa mwezi kwa ajili ya duka lako zima."
              : "Try all features free for 14 days. Then continue with one simple flat rate for your entire shop."}
          </p>
        </div>

        {/* Single Elevated Pricing Card */}
        <div className="mx-auto max-w-lg rounded-3xl border border-primary/40 bg-card p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Emerald Accent Strip */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">WiseCash Pro</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSw ? "Mpango Kamili wa Biashara Yako" : "Everything Your Business Needs"}
              </p>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs py-1 px-3">
              {isSw ? "Siku 14 Bure" : "14 Days Free"}
            </Badge>
          </div>

          <div className="mt-6 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-foreground">TZS 25,000</span>
              <span className="text-sm font-medium text-muted-foreground">
                {isSw ? "/ mwezi" : "/ month"}
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {isSw
                ? "✓ Siku 14 za mwanzo ni bure kabisa bila kadi wala malipo"
                : "✓ First 14 days are completely free before any renewal"}
            </p>
          </div>

          {/* Differentiator: Mobile Money */}
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isSw ? "Hakuna Kadi — Lipa kwa Simu Baada ya Majaribio" : "No Card Required — Pay with Mobile Money"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isSw
                ? "Baada ya siku 14 kuisha, unaweza kuendelea kwa kulipia TZS 25,000 moja kwa moja kupitia Vodacom M-Pesa au HaloPesa."
                : "When your trial ends, renew effortlessly via Vodacom M-Pesa or HaloPesa. No bank card or international exchange fees."}
            </p>
          </div>

          {/* Included Capabilities List */}
          <div className="mt-6 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isSw ? "Kilichojumuishwa:" : "What's Included:"}
            </p>
            <ul className="space-y-2 text-xs">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-foreground/90">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>{isSw ? f.sw : f.en}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="w-full h-12 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              <Link to="/signup" className="flex items-center justify-center gap-2">
                <span>{isSw ? "Anza Majaribio ya Siku 14 Bure" : "Start 14-Day Free Trial"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-2.5">
              {isSw ? "Usajili wa haraka chini ya sekunde 60 • Hakuna kadi" : "Quick 60-second signup • No credit card needed"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
