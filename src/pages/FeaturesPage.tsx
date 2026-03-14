import { CTA } from "@/components/landing/CTA";
import { FAQ } from "@/components/landing/FAQ";
import { Features } from "@/components/landing/Features";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeaturesPage() {
  const { language } = useLanguage();

  return (
    <PublicPageShell
      eyebrow={language === "sw" ? "Vipengele" : "Features"}
      title={
        language === "sw"
          ? "Vipengele vya POS, stoki, na usimamizi wa biashara"
          : "POS, inventory, and business management features"
      }
      description={
        language === "sw"
          ? "Chunguza vipengele vya WiseCash vya mauzo, barcode, ripoti, usimamizi wa bidhaa, wateja, na kazi za duka la kisasa."
          : "Explore WiseCash features for checkout, barcode scanning, reports, stock control, customer records, and day-to-day shop operations."
      }
    >
      <Features />
      <FAQ />
      <CTA />
    </PublicPageShell>
  );
}
