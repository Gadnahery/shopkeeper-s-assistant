import { Link } from "react-router-dom";
import { CTA } from "@/components/landing/CTA";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const contactCards = [
  {
    key: "trial",
    titleEn: "Start your free trial",
    titleSw: "Anza majaribio yako ya bure",
    bodyEn:
      "Create an account, explore the full system, and train your team before the first billing cycle starts.",
    bodySw:
      "Fungua akaunti, tumia mfumo mzima, na fundisha timu yako kabla ya malipo ya kwanza kuanza.",
    ctaEn: "Create account",
    ctaSw: "Fungua akaunti",
    href: "/signup",
  },
  {
    key: "login",
    titleEn: "Already using WiseCash?",
    titleSw: "Umeshajiunga na WiseCash?",
    bodyEn:
      "Sign in to manage your shop, review subscription status, and continue day-to-day operations.",
    bodySw:
      "Ingia kusimamia duka lako, kuangalia usajili, na kuendelea na kazi za kila siku.",
    ctaEn: "Login",
    ctaSw: "Ingia",
    href: "/login",
  },
];

export default function ContactPage() {
  const { language } = useLanguage();
  const t = (en: string, sw: string) => (language === "sw" ? sw : en);

  return (
    <PublicPageShell
      eyebrow={t("Contact", "Wasiliana")}
      title={t("Talk to us about your shop setup", "Ongea nasi kuhusu mpangilio wa duka lako")}
      description={t(
        "Need help getting started with WiseCash, training your team, or moving from manual records? Start a trial or sign in to continue.",
        "Unahitaji msaada wa kuanza na WiseCash, kufundisha timu yako, au kuhama kutoka kwenye kumbukumbu za kawaida? Anza majaribio au ingia kuendelea."
      )}
    >
      <section className="container mx-auto px-4 py-4 md:px-6 md:py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {contactCards.map((card) => (
            <div
              key={card.key}
              className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm"
            >
              <h2 className="text-2xl font-semibold text-foreground">
                {t(card.titleEn, card.titleSw)}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {t(card.bodyEn, card.bodySw)}
              </p>
              <Button asChild className="mt-6 rounded-xl px-6">
                <Link to={card.href}>{t(card.ctaEn, card.ctaSw)}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
      <CTA />
    </PublicPageShell>
  );
}
