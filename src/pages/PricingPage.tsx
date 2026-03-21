import { CTA } from "@/components/landing/CTA";
import { FAQ } from "@/components/landing/FAQ";
import { Pricing } from "@/components/landing/Pricing";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PricingPage() {
  const { language } = useLanguage();

  return (
    <PublicPageShell
      eyebrow={language === "sw" ? "Bei" : "Pricing"}
      title={
        language === "sw"
          ? "Anza kutumia WiseCash sasa huku global billing ikiandaliwa"
          : "Start using WiseCash now while global billing is being prepared"
      }
      description={
        language === "sw"
          ? "Kwa sasa tunaruhusu matumizi mapana ya WiseCash bila kuzuia biashara kwa billing. Bei na njia rasmi za malipo za kimataifa zitatangazwa baada ya setup kukamilika."
          : "For now, WiseCash is open for broader use without blocking businesses on billing. Official global pricing and payment options will be announced after setup is complete."
      }
    >
      <Pricing />
      <FAQ />
      <CTA />
    </PublicPageShell>
  );
}
