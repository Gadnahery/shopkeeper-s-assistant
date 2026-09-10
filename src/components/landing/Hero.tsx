import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Package,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandGlyph } from "@/components/brand/BrandLogo";

export function Hero() {
  const { language } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 border-b border-border bg-background">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column (Hero Copy) */}
          <div className="text-center lg:text-left lg:col-span-7 space-y-6">
            {/* Free Trial Announcement Pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === "sw"
                  ? "🎉 Majaribio ya Siku 14 Bure kwa Watumiaji Wapya • Hakuna Malipo ya Awali"
                  : "🎉 14-Day Free Trial for All New Accounts • No Upfront Payment"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]"
            >
              {language === "sw" ? (
                <>
                  Acha Kubahatisha Faida Yako <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                    Mwisho wa Siku.
                  </span>
                </>
              ) : (
                <>
                  Stop Guessing Your Profit <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                    At the End of the Day.
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl font-normal leading-relaxed mx-auto lg:mx-0"
            >
              {language === "sw"
                ? "Rekodi kila mauzo, fuatilia stoki inayobaki, dhibiti mauzo ya mkopo na ujue faida yako halisi kila jioni — yote kwenye simu au kompyuta yako hata bila intaneti. Anza na siku 14 za bure leo!"
                : "Record every sale, track stock levels live, manage customer credit debts, and calculate your exact net profit every evening — works on any phone or laptop, even offline. Get started with 14 days free!"}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start pt-2"
            >
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 w-full sm:w-auto"
              >
                <Link to="/signup" className="flex items-center justify-center gap-2">
                  <span>{language === "sw" ? "Anza Siku 14 Bure" : "Start 14-Day Free Trial"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-border bg-card px-8 text-sm font-semibold text-foreground hover:bg-muted w-full sm:w-auto"
              >
                <a href="#pricing">
                  {language === "sw" ? "Tazama Mpango (TZS 25,000/mwezi)" : "See Pricing (TZS 25,000/mo)"}
                </a>
              </Button>
            </motion.div>

            {/* Value Props Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{language === "sw" ? "Jaribio la Siku 14 Bure" : "14-Day Free Trial"}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{language === "sw" ? "Inafanya kazi bila intaneti (PWA)" : "Works 100% offline (PWA)"}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{language === "sw" ? "Lipa kwa M-Pesa au Halotel" : "Pay via M-Pesa or Halotel"}</span>
              </div>
            </div>
          </div>

          {/* Right Column (Realistic Interactive ERP Overview Dashboard Card) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mx-auto max-w-md rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl transition-all"
            >
              {/* Card Header with Live status */}
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                    <BrandGlyph className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">WiseCash Pro</h3>
                    <p className="text-[11px] text-muted-foreground">Kariakoo Store · Dar es Salaam</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {language === "sw" ? "Mfumo Hai" : "Live"}
                </span>
              </div>

              {/* Real ERP Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                {/* Stat 1: Mauzo ya Leo */}
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">{language === "sw" ? "Mauzo ya Leo" : "Today's Sales"}</span>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <p className="text-lg font-extrabold tracking-tight text-foreground">TZS 1,480,000</p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">+18.4% {language === "sw" ? "vs jana" : "vs yesterday"}</p>
                </div>

                {/* Stat 2: Faida Halisi */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <span className="text-[11px] font-semibold">{language === "sw" ? "Faida Halisi (P&L)" : "Net Profit (P&L)"}</span>
                    <Coins className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <p className="text-lg font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">TZS 420,000</p>
                  <p className="text-[10px] text-muted-foreground">{language === "sw" ? "Baada ya COGS & Matumizi" : "After COGS & Expenses"}</p>
                </div>

                {/* Stat 3: Pesa Zilizopokelewa */}
                <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">{language === "sw" ? "Pesa Taslimu / M-Pesa" : "Cash / M-Pesa In"}</span>
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-lg font-extrabold tracking-tight text-foreground">TZS 1,130,000</p>
                  <p className="text-[10px] text-muted-foreground">{language === "sw" ? "M-Pesa 65% · Taslimu 35%" : "M-Pesa 65% · Cash 35%"}</p>
                </div>

                {/* Stat 4: Madeni ya Wateja */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                    <span className="text-[11px] font-medium">{language === "sw" ? "Madeni ya Wateja" : "Customer Credit"}</span>
                    <Users className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <p className="text-lg font-extrabold tracking-tight text-amber-700 dark:text-amber-400">TZS 350,000</p>
                  <p className="text-[10px] text-muted-foreground">{language === "sw" ? "Wateja 3 wanadaiwa" : "3 credit customers"}</p>
                </div>
              </div>

              {/* POS Demo Action Bar */}
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 p-3 px-4 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>{language === "sw" ? "POS ya Haraka kwa Simu" : "Mobile POS Checkout"}</span>
                </div>
                <Button size="sm" asChild className="h-7 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/sales">{language === "sw" ? "Fungua POS" : "Open POS"}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 3-Step "How It Works" Mini Strip (Folded into Hero) */}
        <div className="mt-16 rounded-3xl border border-border bg-card/60 backdrop-blur-xs p-6 shadow-xs">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {language === "sw" ? "Hatua 3 Rahisi za Kuanza na WiseCash Leo" : "3 Simple Steps to Run Your Shop Today"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-start gap-3.5 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-bold text-sm text-primary shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">
                  {language === "sw" ? "Fungua Akaunti (Siku 14 Bure)" : "Sign Up (14 Days Free)"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === "sw" ? "Jaza jina la duka lako kwa sekunde 60 upate siku 14 za bure papo hapo bila malipo ya mwanzo." : "Fill in your shop details in 60 seconds for instant 14 days free full access, no card needed."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-sm text-emerald-600 shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">
                  {language === "sw" ? "Weka Bidhaa & Anza Kuuza" : "Add Inventory & Start Selling"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === "sw" ? "Ingiza bidhaa, fanya mauzo ya POS, dhibiti madeni na uone faida yako kila jioni." : "Add inventory, run mobile POS, track debts, and see net profit every evening."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 font-bold text-sm text-foreground shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">
                  {language === "sw" ? "Endelea kwa TZS 25,000/Mwezi" : "Renew at TZS 25,000/Mo"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === "sw" ? "Kipindi cha siku 14 kikiisha, lipia TZS 25,000 tu kwa mwezi kwa M-Pesa au Halotel kuendelea." : "After your 14-day trial, renew smoothly for just TZS 25,000/month via M-Pesa or HaloPesa."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
