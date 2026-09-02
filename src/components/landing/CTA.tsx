import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function CTA() {
  const { language } = useLanguage();
  const { install, isInstalled } = usePWAContext();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a1d29] px-6 py-16 text-center text-white shadow-xl sm:px-12 sm:py-20">
          <div className="relative mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              {language === "sw" ? "Boresha Usimamizi wa Biashara Yako Leo" : "Transform Your Business Operations Today"}
            </h2>
            <p className="text-sm text-gray-300 sm:text-base leading-relaxed">
              {language === "sw"
                ? "Jiunge na wafanyabiashara wanaotumia WiseCash kusimamia manunuzi, uzalishaji, stoki, na mauzo kwa wepesi na uhakika."
                : "Join growing retail and manufacturing businesses using WiseCash to power their purchasing, production, stock, and sales."}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 rounded-xl bg-accent px-8 text-xs font-bold text-slate-950 shadow-md hover:bg-accent/90"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  <span>{language === "sw" ? "Anza Bure Sasa" : "Start Free Trial"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => void install()}
                disabled={isInstalled}
                className="h-11 rounded-xl border-white/20 bg-white/10 px-6 text-xs font-semibold text-white hover:bg-white/20"
              >
                {isInstalled ? <Check className="mr-1.5 h-4 w-4 text-accent" /> : <Download className="mr-1.5 h-4 w-4 text-accent" />}
                <span>{isInstalled ? (language === "sw" ? "Imesakinishwa" : "Installed") : (language === "sw" ? "Pakua App (PWA)" : "Install App")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
