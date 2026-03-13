import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function CTA() {
  const { language } = useLanguage();
  const { canInstall, install, installHint, needsManualInstallHint } = usePWAContext();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 p-12 text-center shadow-2xl"
        >
          {/* Decorative blur */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              {language === "sw"
                ? "Tayari Kuanza?"
                : "Ready to Start?"}
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-white/90">
              {language === "sw"
                ? "Fungua akaunti bila malipo na anza kusimamia biashara yako leo."
                : "Create your free account and start managing your business today."}
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
                  className="h-14 rounded-xl bg-white px-10 text-lg font-semibold text-teal-600 shadow-xl transition-all hover:bg-white/95 hover:shadow-2xl"
                >
                  <Link to="/signup">
                    {language === "sw" ? "Fungua Akaunti Bure" : "Create Free Account"}
                  </Link>
                </Button>
              </motion.div>
              {(canInstall || needsManualInstallHint) && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-xl border-white/35 bg-white/10 px-8 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => void install()}
                >
                  {language === "sw" ? "Sakinisha App" : "Install App"}
                </Button>
              )}
            </div>
            {installHint && (
              <p className="mx-auto mt-4 max-w-2xl text-sm text-white/85">
                {installHint}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
