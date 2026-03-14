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
          ? "Jaribu bure kwa wiki moja, kisha ulipe 10,000 TZS kwa mwezi"
          : "Start with a 1-week free trial, then pay 10,000 TZS monthly"
      }
      description={
        language === "sw"
          ? "WiseCash inakupa mafunzo ya kuanza, kipindi cha majaribio bila malipo, na usajili wa kila mwezi unaolipwa kwa mobile money kupitia AzamPay."
          : "WiseCash includes onboarding, a free trial, and simple monthly subscription billing collected with mobile money through AzamPay."
      }
    >
      <Pricing />
      <FAQ />
      <CTA />
    </PublicPageShell>
  );
}
