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
                ? "Boresha Usimamizi wa Biashara Yako Leo"
                : "Transform Your Business Operations Today"}
            </h2>
            <p className="text-sm text-gray-300 sm:text-base leading-relaxed max-w-xl mx-auto">
              {language === "sw"
                ? "Jiunge na wafanyabiashara wanaotumia WiseCash kusimamia manunuzi, stoki, wateja, na mauzo kwa wepesi na uhakika kwa TZS 25,000/mwezi tu."
                : "Join growing retail, wholesale, and workshop businesses using WiseCash to power their stock, credit sales, and daily profits for just TZS 25,000/month."}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  <span>{language === "sw" ? "Anza Sasa" : "Get Started"}</span>
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
