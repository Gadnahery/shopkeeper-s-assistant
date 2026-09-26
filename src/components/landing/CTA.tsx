import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function CTA() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div className="absolute inset-0 bg-[#0a0f0d]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgba(16,185,129,0.18),transparent)]" />

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
          {isSw ? "Anza leo" : "Get started"}
        </p>
        <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight max-w-2xl mx-auto">
          {isSw
            ? "Acha madaftari. Anza kujua faida yako."
            : "Leave the notebooks. Start knowing your profit."}
        </h2>
        <p className="mt-4 max-w-lg mx-auto text-sm sm:text-base text-white/55 leading-relaxed">
          {isSw
            ? "Jaribu WiseCash siku 14 bure. Hakuna kadi, hakuna malipo ya awali — weka duka lako na uone tofauti."
            : "Try WiseCash free for 14 days. No card, no upfront fee — set up your shop and see the difference."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 sm:h-14 rounded-full px-8 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-500/25"
          >
            <Link to="/signup" className="inline-flex items-center gap-2">
              {isSw ? "Fungua akaunti bure" : "Create free account"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 sm:h-14 rounded-full px-6 text-sm border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/contact">{isSw ? "Wasiliana nasi" : "Talk to us"}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
