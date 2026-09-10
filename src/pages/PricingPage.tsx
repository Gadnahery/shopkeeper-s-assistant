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
          ? "Mpango rahisi na wazi — Anza na siku 14 bure leo"
          : "Simple, transparent pricing — Start with 14 days free today"
      }
      description={
        language === "sw"
          ? "Kila biashara inayojiunga na WiseCash inapata majaribio ya bure ya siku 14 bila malipo ya mwanzo. Baada ya hapo, furahia huduma zote kwa ada nafuu ya TZS 25,000 tu kwa mwezi."
          : "Every business that joins WiseCash gets a full 14-day free trial with zero upfront payment. Continue thereafter with all modules unlocked for just TZS 25,000/month."
      }
    >
      <Pricing />
      <FAQ />
      <CTA />
    </PublicPageShell>
  );
}
