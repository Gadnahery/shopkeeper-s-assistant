import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Factory,
  Package,
  ShieldCheck,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandGlyph } from "@/components/brand/BrandLogo";

export function Hero() {
  const { language } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 border-b border-border bg-background">
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column (Hero Copy) */}
          <div className="text-center lg:text-left lg:col-span-7">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-foreground shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              <span>{language === "sw" ? "Mfumo mmoja wa biashara" : "One workspace for your business"}</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              {language === "sw" ? (
                <>
                  Simamia Biashara Yako <br />
                  <span className="text-accent">Katika Mfumo Mmoja</span>
                </>
              ) : (
                <>
                  Run your business. <br />
                  <span className="text-accent">Know your numbers.</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl font-normal"
            >
              {language === "sw"
                ? "Mauzo, stoki, wateja, malipo na faida — kwa bidhaa, huduma au biashara mchanganyiko."
                : "Sales, stock, customers, payments and profit — for product, service and hybrid businesses."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="h-11 rounded-xl bg-primary px-7 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  <span>{language === "sw" ? "Anza Bure" : "Start free"}</span>
                  <ArrowRight className="h-4 w-4 text-accent" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 rounded-xl border-border bg-card px-7 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Link to="/features">{language === "sw" ? "Jinsi inavyofanya kazi" : "See how it works"}</Link>
              </Button>
            </motion.div>

            {/* Quick feature bullets */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>{language === "sw" ? "Inafanya kazi bila intaneti" : "Offline PWA capable"}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>{language === "sw" ? "Lugha ya Kiswahili & Kiingereza" : "Swahili & English bilingual"}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>{language === "sw" ? "Salama & Haraka" : "Encrypted & Cloud-synced"}</span>
              </div>
            </div>
          </div>

          {/* Right Column (Live Mockup Card of ERP Overview) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <BrandGlyph className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">WiseCash Overview</h3>
                    <p className="text-[10px] text-muted-foreground">Product + service workspace</p>
                  </div>
                </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--success-text)]">
                  Ready to run
                </span>
              </div>

              {/* 4 Mini Stat Blocks */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Mauzo ya Leo" : "Today's Sales"}</span>
                  <p className="mt-1 text-base font-bold text-foreground">TSH 1,480,000</p>
                  <p className="mt-0.5 text-[10px] text-[var(--success-text)] font-semibold">+18.4% vs jana</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <span className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Pesa Zilizopokelewa" : "Cash received"}</span>
                  <p className="mt-1 text-base font-bold text-foreground">TSh 830K</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Today</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <span className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Huduma" : "Services"}</span>
                  <p className="mt-1 text-base font-bold text-foreground">8 bookings</p>
                  <p className="mt-0.5 text-[10px] text-accent font-semibold">Today</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[10px] font-medium text-muted-foreground">{language === "sw" ? "Madeni ya Wateja" : "Receivables"}</span>
                  <p className="mt-1 text-base font-bold text-foreground">TSH 350,000</p>
                  <p className="mt-0.5 text-[10px] text-[var(--warning-text)] font-semibold">3 accounts</p>
                </div>
              </div>

              {/* Quick Operation Row */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 p-3">
                <span className="text-xs font-semibold text-foreground">{language === "sw" ? "Fungua POS ya Mauzo" : "Quick Checkout POS"}</span>
                <Button size="sm" asChild className="h-7 rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
                  <Link to="/sales">Fungua</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trust Bar / ERP Capabilities Strip */}
        <div className="mt-16 rounded-2xl border border-border bg-muted/40 p-6">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {language === "sw" ? "Moduli 10 Kamili za Kusimamia Biashara Yako" : "10 Unified Modules Built for Modern Commerce"}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 text-center">
            {[
              { label: language === "sw" ? "1. Muhtasari (Overview)" : "1. Overview", icon: BarChart3 },
              { label: language === "sw" ? "2. Bidhaa" : "2. Products", icon: Package },
              { label: language === "sw" ? "3. Huduma" : "3. Services", icon: Tag },
              { label: language === "sw" ? "4. Malipo" : "4. Payments", icon: TrendingUp },
              { label: language === "sw" ? "5. Wateja" : "5. Customers", icon: Users },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-center p-2 rounded-xl bg-card border border-border/80">
                  <Icon className="h-4 w-4 text-accent mb-1.5" />
                  <span className="text-xs font-semibold text-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
