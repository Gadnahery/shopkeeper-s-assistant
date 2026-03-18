import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Smartphone, TrendingUp, Receipt, ScanLine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Hero() {
  const { language } = useLanguage();

  return (
    <section className="relative min-h-[90vh] overflow-hidden pb-16 pt-24">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-200/30 via-transparent to-transparent dark:from-emerald-500/10" />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-20 top-32 h-24 w-24 rounded-2xl bg-emerald-400/20 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-20 left-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute right-1/3 top-1/2 h-16 w-16 rounded-xl bg-cyan-400/20 blur-xl"
      />

      <div className="container relative mx-auto flex flex-col items-center gap-12 px-4 pt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="flex-1 text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
          >
            {language === "sw" ? (
              <>
                Simamia Biashara Yako{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-cyan-400">
                  Kidigitali
                </span>
              </>
            ) : (
              <>
                Manage Your Business{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-cyan-400">
                  Digitally
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl"
          >
            {language === "sw"
              ? "WiseCash ni mfumo wa POS, usimamizi wa stoki, mauzo, ripoti, na uendeshaji wa biashara kwa maduka ya kisasa."
              : "WiseCash is a POS system, inventory management, sales reporting, and retail business software for modern shops."}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base"
          >
            {language === "sw"
              ? "Dhibiti mauzo ya dukani, barcode, stoki, wateja, wafanyakazi, na usajili wa kila mwezi kutoka kwenye web app moja ya kisasa."
              : "Run checkout, barcode scanning, stock control, customer records, staff tools, and monthly subscriptions from one modern web app."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-8 text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30"
            >
              <Link to="/signup">{language === "sw" ? "Anza Bure" : "Start Free"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-2 px-8 text-base font-semibold">
              <Link to="/auth">{language === "sw" ? "Tazama Demo" : "View Demo"}</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex-1 lg:max-w-md"
        >
          <div className="relative rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto w-48 rounded-3xl border-4 border-neutral-200 bg-neutral-100 p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="space-y-3">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500/20 p-2"
                >
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium">Mauzo +24%</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500/20 p-2"
                >
                  <Receipt className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-medium">Risiti</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center gap-2 rounded-lg bg-sky-500/20 p-2"
                >
                  <ScanLine className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-medium">Skana Barcode</span>
                </motion.div>
              </div>
              <Smartphone className="absolute -bottom-2 -right-2 h-8 w-8 text-neutral-400/50" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
