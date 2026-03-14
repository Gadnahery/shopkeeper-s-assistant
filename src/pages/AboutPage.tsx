import { About } from "@/components/landing/About";
import { CTA } from "@/components/landing/CTA";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutPage() {
  const { language } = useLanguage();

  return (
    <PublicPageShell
      eyebrow={language === "sw" ? "Kuhusu WiseCash" : "About WiseCash"}
      title={
        language === "sw"
          ? "Mfumo wa kisasa wa usimamizi wa duka kwa biashara za Tanzania"
          : "A modern shop management system built for businesses in Tanzania"
      }
      description={
        language === "sw"
          ? "WiseCash imeundwa kusaidia maduka, jumla, na biashara ndogo kusimamia mauzo, stoki, wafanyakazi, na taarifa za kila siku kwa urahisi."
          : "WiseCash helps shops, wholesalers, and growing businesses run sales, stock, staff, and daily reporting from one reliable web app."
      }
    >
      <About />
      <HowItWorks />
      <CTA />
    </PublicPageShell>
  );
}
