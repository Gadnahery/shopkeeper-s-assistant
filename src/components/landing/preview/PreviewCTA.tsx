import { Link } from "react-router-dom";
import { ArrowRight, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";

export function PreviewCTA() {
  const { language } = useLanguage();
  const { install, isInstalled } = usePWAContext();
  const isSw = language === "sw";

  return (
    <section className="py-20 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20 border border-neutral-800">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-2xl space-y-5">
            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400">
              {isSw ? "Jaribu Bila Malipo Yoyote ya Awali" : "Zero Risk • 14-Day Free Trial"}
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {isSw ? "Endesha Biashara Yako kwa Uhakika Zaidi." : "Run Your Business With More Confidence."}
            </h2>

            <div className="space-y-1 text-base sm:text-lg font-medium text-neutral-300">
              <p>{isSw ? "Jua mauzo yako halisi." : "Know your sales."}</p>
              <p>{isSw ? "Jua stoki yako inayobaki." : "Know your stock."}</p>
              <p className="font-bold text-white">{isSw ? "Jua faida yako kila jioni." : "Know your profit."}</p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto pt-1">
              {isSw
                ? "Jiunge na wajasiriamali wa Tanzania wanaoacha madaftari na kuendesha biashara kisasa."
                : "Join hundreds of Tanzanian shop owners moving from paper notebooks to modern business intelligence."}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 w-full sm:w-auto rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                <Link to="/signup" className="flex items-center justify-center gap-2">
                  <span>{isSw ? "Anza Siku 14 Bure Sasa" : "Start 14-Day Free Trial"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => void install()}
                disabled={isInstalled}
                className="h-12 w-full sm:w-auto rounded-xl border-white/20 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20"
              >
                {isInstalled ? (
                  <Check className="mr-2 h-4 w-4 text-emerald-400" />
                ) : (
                  <Download className="mr-2 h-4 w-4 text-emerald-400" />
                )}
                <span>
                  {isInstalled
                    ? isSw
                      ? "App Imesakinishwa"
                      : "App Installed"
                    : isSw
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
