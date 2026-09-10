import { Link } from "react-router-dom";
import { ArrowRight, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function CTA() {
  const { language } = useLanguage();
  const { install, isInstalled } = usePWAContext();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20 border border-neutral-800">
          <div className="relative mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              {language === "sw"
                ? "Anza na Siku 14 za Majaribio ya Bure Leo"
                : "Start with a 14-Day Free Trial Today"}
            </h2>
            <p className="text-sm text-gray-300 sm:text-base leading-relaxed max-w-xl mx-auto">
              {language === "sw"
                ? "Jiunge na WiseCash leo na upate siku 14 za bure kujaribu mfumo mzima bila malipo ya awali au kadi ya benki. Baada ya hapo, endelea kwa TZS 25,000/mwezi tu."
                : "Join WiseCash today and get 14 days of free trial with zero upfront payment or credit card needed. After your trial, subscribe for just TZS 25,000/month."}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  <span>{language === "sw" ? "Anza Siku 14 Bure Sasa" : "Start 14-Day Free Trial Now"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => void install()}
                disabled={isInstalled}
                className="h-12 rounded-xl border-white/20 bg-white/10 px-7 text-sm font-semibold text-white hover:bg-white/20"
              >
                {isInstalled ? (
                  <Check className="mr-2 h-4 w-4 text-emerald-400" />
                ) : (
                  <Download className="mr-2 h-4 w-4 text-emerald-400" />
                )}
                <span>
                  {isInstalled
                    ? language === "sw"
                      ? "App Imesakinishwa"
                      : "App Installed"
                    : language === "sw"
                    ? "Pakua App (PWA)"
                    : "Install App (PWA)"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
