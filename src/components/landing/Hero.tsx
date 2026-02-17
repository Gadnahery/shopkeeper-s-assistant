import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Smartphone, TrendingUp, Receipt, ScanLine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Hero() {
  const { language } = useLanguage();

  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-24 pb-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-teal-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/30 via-transparent to-transparent dark:from-teal-500/10" />

      {/* Floating decorative elements */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-20 h-24 w-24 rounded-2xl bg-teal-400/20 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-20 left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 right-1/3 h-16 w-16 rounded-xl bg-violet-400/20 blur-xl"
      />

      <div className="container relative mx-auto flex flex-col items-center gap-12 px-4 pt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        {/* Left content */}
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
                <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-blue-400">
                  Kidigitali
                </span>
              </>
            ) : (
              <>
                Manage Your Business{" "}
                <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-blue-400">
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
              ? "POS, Hesabu, Stoki, Ripoti na Udhibiti wote sehemu moja."
              : "POS, accounting, stock, reports and control—all in one place."}
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
              className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 px-8 text-base font-semibold shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02]"
            >
              <Link to="/signup">
                {language === "sw" ? "Anza Bure" : "Start Free"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-2 px-8 text-base font-semibold"
            >
              <Link to="/auth">{language === "sw" ? "Tazama Demo" : "View Demo"}</Link>
            </Button>
          </motion.div>
        </div>

        {/* Right - animated illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex-1 lg:max-w-md"
        >
          <div className="relative rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl shadow-teal-500/10 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            {/* Phone mockup with floating cards */}
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
                  className="flex items-center gap-2 rounded-lg bg-teal-500/20 p-2"
                >
                  <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-medium">Mauzo ↑ 24%</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-2 rounded-lg bg-blue-500/20 p-2"
                >
                  <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium">Risiti</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center gap-2 rounded-lg bg-violet-500/20 p-2"
                >
                  <ScanLine className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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
