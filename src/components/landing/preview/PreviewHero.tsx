import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Coins,
  Wallet,
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
  Plus,
  Circle,
  BarChart2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandGlyph } from "@/components/brand/BrandLogo";

export function PreviewHero() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 border-b border-border/70 bg-gradient-to-b from-background via-background to-muted/20">
      {/* Subtle radial ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-primary/8 blur-[130px] rounded-full pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Main Hero Header (Centered, Punchy, High Impact) */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs"
          >
            <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isSw
                ? "Majaribio ya Siku 14 Bure • Hakuna Malipo ya Awali"
                : "14-Day Free Trial for All New Accounts • No Upfront Payment"}
            </span>
          </motion.div>

          {/* Core Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.08]"
          >
            {isSw ? (
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
                  At The End Of The Day.
                </span>
              </>
            )}
          </motion.h1>

          {/* Concise Single-Sentence Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl text-base sm:text-lg text-muted-foreground font-normal leading-relaxed mx-auto"
          >
            {isSw
              ? "Endesha mauzo, stoki, madeni ya wateja na fedha zako zote kwenye mfumo mmoja rahisi — kwenye simu au kompyuta hata bila intaneti."
              : "Run your sales, stock, customer credit and finances from one simple business system — works on any phone or laptop, even offline."}
          </motion.p>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Button
              asChild
              size="lg"
              className="h-12 w-full sm:w-auto rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-[0.98]"
            >
              <Link to="/signup" className="flex items-center justify-center gap-2">
                <span>{isSw ? "Anza Siku 14 Bure" : "Start 14-Day Free Trial"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full sm:w-auto rounded-xl border-border bg-card px-7 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <a href="#showcase" className="flex items-center justify-center gap-2">
                <span>{isSw ? "Tazama Jinsi Inavyofanya Kazi" : "See How It Works"}</span>
              </a>
            </Button>
          </motion.div>

          {/* Value Micro-Points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs text-muted-foreground font-medium"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isSw ? "Hakuna Kadi ya Benki" : "No credit card required"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isSw ? "Inafanya kazi bila intaneti" : "Works 100% offline"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isSw ? "Lipa kwa M-Pesa / HaloPesa" : "Vodacom M-Pesa & HaloPesa"}</span>
            </div>
          </motion.div>
        </div>

        {/* HERO PRODUCT VISUAL: Real WiseCash UI Desktop Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="relative mt-12 sm:mt-16 mx-auto max-w-5xl"
        >
          {/* Subtle Ambient Shadow Glow behind Browser */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/20 via-emerald-500/15 to-primary/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

          {/* Browser Container */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden backdrop-blur-xs">
            {/* Browser Header Chrome Bar */}
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/60 px-4 py-3 sm:px-6 sm:py-3.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>

              {/* URL Address Bar */}
              <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground w-64 sm:w-80 justify-center">
                <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono text-[11px] font-medium text-foreground">wisecash.app/dashboard</span>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="hidden sm:inline text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {isSw ? "Mfumo Hai" : "Live"}
                </span>
              </div>
            </div>

            {/* Browser Content: High-Fidelity WiseCash Dashboard */}
            <div className="p-4 sm:p-6 space-y-4 bg-background">
              {/* Dashboard Greeting & Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BrandGlyph className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {isSw ? "Habari ya asubuhi, Kariakoo General Store" : "Good morning, Kariakoo General Store"}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      {isSw ? "Ijumaa, 12 Septemba 2026 • Dar es Salaam" : "Friday, Sep 12, 2026 • Dar es Salaam"}
                    </p>
                  </div>
                </div>

                {/* Filters and New Sale Action */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-[11px] font-semibold">
                    <span className="rounded-md bg-card px-2.5 py-1 text-foreground shadow-xs">
                      {isSw ? "Leo" : "Today"}
                    </span>
                    <span className="px-2.5 py-1 text-muted-foreground">{isSw ? "Wiki Hii" : "This Week"}</span>
                    <span className="px-2.5 py-1 text-muted-foreground">{isSw ? "Mwezi Huu" : "This Month"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isSw ? "+ Mauzo Mapya" : "+ New Sale"}</span>
                  </div>
                </div>
              </div>

              {/* 3 Real KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Metric 1: Sales */}
                <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">{isSw ? "Mauzo ya Leo" : "Today's Sales"}</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground">TZS 1,480,000</p>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>+18.4%</span>
                    <span className="text-muted-foreground font-normal">{isSw ? "vs jana" : "vs yesterday"}</span>
                  </p>
                </div>

                {/* Metric 2: Net Profit */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <span className="text-xs font-semibold">{isSw ? "Faida Halisi (P&L)" : "Net Profit (P&L)"}</span>
                    <Coins className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                    TZS 420,000
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isSw ? "Baada ya manunuzi & matumizi" : "After COGS & shop expenses"}
                  </p>
                </div>

                {/* Metric 3: Cash In */}
                <div className="rounded-2xl border border-border/80 bg-card p-3.5 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">{isSw ? "Pesa Taslimu / M-Pesa" : "Cash / M-Pesa In"}</span>
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground">TZS 1,130,000</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isSw ? "M-Pesa 65% • Taslimu 35%" : "M-Pesa 65% • Cash 35%"}
                  </p>
                </div>
              </div>

              {/* Lower Section: Chart & Recent Sales Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                {/* Sales Chart Mockup (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-border/70 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {isSw ? "Mwenendo wa Mauzo ya Wiki" : "Weekly Sales Velocity"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {isSw ? "Mauzo dhidi ya Faida Halisi" : "Gross revenue vs net margin"}
                      </p>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {isSw ? "Siku 7 Zilizopita" : "Last 7 Days"}
                    </span>
                  </div>

                  {/* SVG Line Chart Graphic */}
                  <div className="h-28 sm:h-32 w-full pt-2">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="25" x2="400" y2="25" stroke="currentColor" strokeOpacity="0.08" />
                      <line x1="0" y1="65" x2="400" y2="65" stroke="currentColor" strokeOpacity="0.08" />
                      {/* Area Fill */}
                      <path
                        d="M0,80 Q60,35 120,60 T240,30 T320,45 T400,15 L400,100 L0,100 Z"
                        fill="url(#heroGradient)"
                      />
                      {/* Line Stroke */}
                      <path
                        d="M0,80 Q60,35 120,60 T240,30 T320,45 T400,15"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {/* Highlight Peak Dot */}
                      <circle cx="400" cy="15" r="4.5" fill="hsl(var(--primary))" />
                      <circle cx="400" cy="15" r="7" fill="hsl(var(--primary))" fillOpacity="0.25" />
                    </svg>
                  </div>

                  {/* Day labels */}
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-1">
                    <span>Jum</span>
                    <span>Jmt</span>
                    <span>Jmn</span>
                    <span>Alh</span>
                    <span>Ijm</span>
                    <span>Mms</span>
                    <span className="font-bold text-foreground">Leo (Ijp)</span>
                  </div>
                </div>

                {/* Live Transactions Stream (5 cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-border/70 bg-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">
                      {isSw ? "Mauzo ya Hivi Karibuni" : "Recent Sales"}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">{isSw ? "Muda Halisi" : "Real-time"}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2 text-xs border border-border/40">
                      <div>
                        <p className="font-semibold text-foreground">Azam Wheat Flour 2kg x 4</p>
                        <p className="text-[10px] text-muted-foreground">M-Pesa • 14:32</p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">TZS 16,800</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2 text-xs border border-border/40">
                      <div>
                        <p className="font-semibold text-foreground">Kilimanjaro Water 1.5L x 12</p>
                        <p className="text-[10px] text-muted-foreground">{isSw ? "Taslimu" : "Cash"} • 14:28</p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">TZS 18,000</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2 text-xs border border-border/40">
                      <div>
                        <p className="font-semibold text-foreground">Panadol Extra (Pack of 10)</p>
                        <p className="text-[10px] text-muted-foreground">HaloPesa • 14:15</p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">TZS 8,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Subtle Micro-Pill (Sale Completed Reassurance) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="absolute -bottom-4 right-4 sm:-bottom-5 sm:right-8 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-card px-3.5 py-2 shadow-xl backdrop-blur-md text-xs font-semibold text-foreground"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground">
                {isSw ? "Mauzo Yamekamilika • Risiti Imetumwa" : "Sale Completed • Receipt Issued"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isSw ? "TZS 45,000 kupitia Vodacom M-Pesa" : "TZS 45,000 via Vodacom M-Pesa"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
