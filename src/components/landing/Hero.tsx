import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

export function Hero() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const bullets = isSw
    ? [
        "Faida halisi ya siku — si makadirio",
        "Stoki, mauzo & malipo mahali pamoja",
        "Inafanya kazi hata bila mtandao",
      ]
    : [
        "True daily profit — not estimates",
        "Stock, sales & payments in one place",
        "Works offline when the network drops",
      ];

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#0a0f0d] text-white">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.22),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Copy */}
          <div className="lg:col-span-6 space-y-7">
            <motion.p
              {...fade(0)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/90 backdrop-blur-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              {isSw ? "Siku 14 bure · Bila malipo ya awali" : "14-day free trial · No card required"}
            </motion.p>

            <motion.h1
              {...fade(0.08)}
              className="text-[2.15rem] sm:text-5xl lg:text-[3.35rem] font-semibold tracking-tight leading-[1.08] text-white"
            >
              {isSw ? (
                <>
                  Jua faida yako ya{" "}
                  <span className="text-emerald-400">kweli</span>
                  <br className="hidden sm:block" />
                  kila siku.
                </>
              ) : (
                <>
                  Know your{" "}
                  <span className="text-emerald-400">real profit</span>
                  <br className="hidden sm:block" />
                  every day.
                </>
              )}
            </motion.h1>

            <motion.p
              {...fade(0.16)}
              className="max-w-md text-base sm:text-lg text-white/65 leading-relaxed"
            >
              {isSw
                ? "WiseCash ni POS & ERP ya wafanyabiashara wa Tanzania — mauzo, stoki, gharama na ripoti zilizo wazi, hata offline."
                : "WiseCash is POS & ERP built for Tanzanian shops — sales, stock, expenses and clear reports, even offline."}
            </motion.p>

            <motion.ul {...fade(0.22)} className="space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  {b}
                </li>
              ))}
            </motion.ul>

            <motion.div
              {...fade(0.28)}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <Button
                asChild
                size="lg"
                className="h-12 sm:h-14 rounded-full px-7 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-500/25"
              >
                <Link to="/signup" className="inline-flex items-center gap-2">
                  {isSw ? "Anza majaribio bure" : "Start free trial"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 sm:h-14 rounded-full px-6 text-sm font-medium border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#showcase">{isSw ? "Angalia jinsi inavyofanya kazi" : "See how it works"}</a>
              </Button>
            </motion.div>

            <motion.p
              {...fade(0.34)}
              className="text-xs text-white/45 flex items-center gap-2"
            >
              <Shield className="h-3.5 w-3.5" />
              {isSw
                ? "TZS 25,000/mwezi baada ya jaribio · Lipa kwa simu au mikono"
                : "TZS 25,000/mo after trial · Mobile money or manual payment"}
            </motion.p>
          </div>

          {/* Product preview card */}
          <motion.div
            {...fade(0.2)}
            className="lg:col-span-6 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-3xl bg-emerald-500/20 blur-2xl opacity-60" />

              <div className="relative rounded-2xl border border-white/10 bg-[#111916]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Fake window chrome */}
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-2 text-[11px] text-white/40 font-medium">
                    WiseCash · Dashboard
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/40">
                        {isSw ? "Faida ya leo" : "Today’s profit"}
                      </p>
                      <p className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                        TZS 847,200
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +18% {isSw ? "vs jana" : "vs yesterday"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 p-2.5">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {
                        label: isSw ? "Mauzo" : "Sales",
                        value: "1.2M",
                        icon: BarChart3,
                      },
                      {
                        label: isSw ? "Gharama" : "Costs",
                        value: "352K",
                        icon: Wallet,
                      },
                      {
                        label: isSw ? "Stoki chini" : "Low stock",
                        value: "7",
                        icon: Zap,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
                      >
                        <s.icon className="h-3.5 w-3.5 text-white/35 mb-2" />
                        <p className="text-sm font-semibold text-white">{s.value}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5 space-y-2.5">
                    <p className="text-[11px] font-medium text-white/50">
                      {isSw ? "Mauzo ya hivi karibuni" : "Recent sales"}
                    </p>
                    {[
                      { name: "Mchele 25kg", amt: "45,000", time: "2m" },
                      { name: "Mafuta 5L", amt: "28,500", time: "14m" },
                      { name: "Sabuni ×3", amt: "12,000", time: "31m" },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-white/75">{row.name}</span>
                        <span className="text-white/90 font-medium">
                          TZS {row.amt}
                          <span className="text-white/35 font-normal ml-2">{row.time}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
