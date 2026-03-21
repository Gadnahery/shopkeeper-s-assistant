import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function CTA() {
  const { language } = useLanguage();
  const { install, installHint, isInstalled } = usePWAContext();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-teal-50 via-cyan-100 to-blue-100 p-12 text-center shadow-[0_28px_70px_-40px_rgba(14,116,144,0.45)] dark:border-white/10 dark:bg-gradient-to-br dark:from-teal-500 dark:via-teal-600 dark:to-blue-600 dark:shadow-2xl"
        >
          {/* Decorative blur */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,_rgba(255,255,255,0.92)_0%,_rgba(255,255,255,0.2)_32%,_transparent_56%)] dark:bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
          <div className="absolute -left-12 top-8 h-40 w-40 rounded-full bg-white/55 blur-3xl dark:hidden" />
          <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl dark:bg-violet-500/20" />

          <div className="relative">
            <h2 className="text-3xl font-bold text-slate-950 md:text-4xl dark:text-white">
              {language === "sw"
                ? "Tayari Kuanza?"
                : "Ready to Start?"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-700 dark:text-white/90">
              {language === "sw"
                ? "Fungua akaunti ya WiseCash, jaribu wiki 1 bure, kisha endelea kusimamia POS, stoki, na ripoti za biashara yako."
                : "Create your WiseCash account, try it free for 1 week, then keep running POS, inventory, and business reports from one place."}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <motion.div
                initial={{ scale: 0.95 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-xl bg-slate-950 px-10 text-lg font-semibold text-white shadow-[0_22px_45px_-26px_rgba(15,23,42,0.75)] transition-all hover:bg-slate-900 hover:shadow-[0_28px_50px_-24px_rgba(15,23,42,0.8)] dark:bg-white dark:text-teal-700 dark:hover:bg-white/95"
                >
                  <Link to="/signup">
                    {language === "sw" ? "Fungua Akaunti Bure" : "Create Free Account"}
                  </Link>
                </Button>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-xl border-slate-300 bg-white/80 px-8 text-slate-800 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm hover:border-slate-400 hover:bg-white hover:text-slate-950 dark:border-white/35 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
                onClick={() => void install()}
                disabled={isInstalled}
              >
                {isInstalled ? <Check className="mr-2 h-5 w-5" /> : <Download className="mr-2 h-5 w-5" />}
                {isInstalled
                  ? language === "sw"
                    ? "Imesakinishwa"
                    : "Installed"
                  : language === "sw"
                    ? "Download the App"
                    : "Download the App"}
              </Button>
            </div>
            {installHint && (
              <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-white/85">
                {installHint}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
