import { Link } from "react-router-dom";
import { ExternalLink, Instagram, Mail, Phone } from "lucide-react";
import { CTA } from "@/components/landing/CTA";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_CONTACT, CONTACT_LINKS } from "@/lib/contact";

const onboardingCards = [
  {
    key: "get-started",
    titleEn: "Get started with WiseCash",
    titleSw: "Anza kutumia WiseCash",
    bodyEn:
      "Create your account, activate with mobile money (TZS 25,000/mo), and get your shop running today.",
    bodySw:
      "Fungua akaunti, amilisha kwa mitandao ya simu (TZS 25,000/mwezi), na uanze kuendesha duka lako leo.",
    ctaEn: "Create account",
    ctaSw: "Fungua akaunti",
    href: "/signup",
  },
  {
    key: "login",
    titleEn: "Already using WiseCash?",
    titleSw: "Umeshajiunga na WiseCash?",
    bodyEn:
      "Sign in to continue managing sales, stock, reports, customers, and daily business operations.",
    bodySw:
      "Ingia kuendelea kusimamia mauzo, stoki, ripoti, wateja, na kazi za kila siku za biashara.",
    ctaEn: "Login",
    ctaSw: "Ingia",
    href: "/login",
  },
];

const directContactCards = [
  {
    key: "whatsapp",
    titleEn: "Chat on WhatsApp",
    titleSw: "Ongea nasi WhatsApp",
    bodyEn: "Send a direct message for setup help, onboarding questions, or product guidance.",
    bodySw: "Tuma ujumbe moja kwa moja kwa msaada wa kuanza, maswali ya onboarding, au mwongozo wa mfumo.",
    ctaEn: "Open WhatsApp",
    ctaSw: "Fungua WhatsApp",
    href: CONTACT_LINKS.whatsapp,
    value: APP_CONTACT.phoneDisplay,
    icon: WhatsAppIcon,
    shell: "border-emerald-500/25 bg-emerald-500/8",
    iconShell: "bg-emerald-500 text-white",
  },
  {
    key: "email",
    titleEn: "Email support",
    titleSw: "Barua pepe ya msaada",
    bodyEn: "Send us your questions by email and we will reply with help, guidance, or setup support.",
    bodySw: "Tutumie maswali yako kwa email na tutakujibu kwa msaada, maelekezo, au support ya kuanza.",
    ctaEn: "Send email",
    ctaSw: "Tuma email",
    href: CONTACT_LINKS.email,
    value: APP_CONTACT.email,
    icon: Mail,
    shell: "border-blue-500/25 bg-blue-500/8",
    iconShell: "bg-blue-600 text-white",
  },
  {
    key: "instagram",
    titleEn: "Follow on Instagram",
    titleSw: "Tufuate Instagram",
    bodyEn: "Reach us on Instagram for updates, announcements, and another quick way to connect.",
    bodySw: "Tupate Instagram kwa updates, matangazo, na njia nyingine ya kuwasiliana haraka.",
    ctaEn: "Open Instagram",
    ctaSw: "Fungua Instagram",
    href: CONTACT_LINKS.instagram,
    value: APP_CONTACT.instagramHandle,
    icon: Instagram,
    shell: "border-fuchsia-500/25 bg-fuchsia-500/8",
    iconShell: "bg-fuchsia-600 text-white",
  },
];

export default function ContactPage() {
  const { language } = useLanguage();
  const t = (en: string, sw: string) => (language === "sw" ? sw : en);

  return (
    <PublicPageShell
      eyebrow={t("Contact", "Wasiliana")}
      title={t("Talk to WiseCash directly", "Ongea na WiseCash moja kwa moja")}
      description={t(
        "Reach WiseCash by WhatsApp, email, phone, or Instagram for onboarding help, setup support, and product questions.",
        "Wasiliana na WiseCash kupitia WhatsApp, email, simu, au Instagram kwa msaada wa kuanza, setup, na maswali ya mfumo."
      )}
    >
      <section className="container mx-auto px-4 py-4 md:px-6 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            {directContactCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.key}
                  className={`rounded-3xl border p-8 shadow-sm backdrop-blur-sm ${card.shell}`}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconShell}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-foreground">
                    {t(card.titleEn, card.titleSw)}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {t(card.bodyEn, card.bodySw)}
                  </p>
                  <p className="mt-5 break-all text-sm font-medium text-foreground/80">{card.value}</p>
                  <Button asChild className="mt-6 rounded-xl px-6">
                    <a href={card.href} target="_blank" rel="noreferrer">
                      {t(card.ctaEn, card.ctaSw)}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("Direct support details", "Mawasiliano ya moja kwa moja")}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {t(
                  "Use the channel that works best for you. WhatsApp is the fastest route, and email is great for detailed questions.",
                  "Tumia njia inayokufaa zaidi. WhatsApp ni ya haraka zaidi, na email inafaa kwa maswali yenye maelezo mengi."
                )}
              </p>

              <div className="mt-6 space-y-4">
                <a href={CONTACT_LINKS.phone} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("Phone", "Simu")}</p>
                      <p className="text-sm text-muted-foreground">{APP_CONTACT.phoneDisplay}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a href={CONTACT_LINKS.email} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/12 text-blue-700 dark:text-blue-300">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("Email", "Email")}</p>
                      <p className="break-all text-sm text-muted-foreground">{APP_CONTACT.email}</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                      <WhatsAppIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        {t("Tap to start chatting instantly", "Bonyeza kuanza mazungumzo moja kwa moja")}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {onboardingCards.map((card) => (
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
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-4 md:px-6 md:pb-8">
        <div className="rounded-[2rem] border border-border/60 bg-card/78 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {t("Need a fast reply?", "Unahitaji majibu ya haraka?")}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                {t("Message WiseCash directly on WhatsApp", "Tuma ujumbe moja kwa moja kwa WiseCash kwenye WhatsApp")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                {t(
                  "Tap the WhatsApp button and a ready-made message will open immediately so you can start the conversation fast.",
                  "Bonyeza kitufe cha WhatsApp na ujumbe wa kuanzia utafunguka mara moja ili uanze mazungumzo haraka."
                )}
              </p>
            </div>

            <Button asChild size="lg" className="h-12 rounded-2xl bg-emerald-600 px-6 text-white hover:bg-emerald-700">
              <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="mr-2 h-5 w-5" />
                {t("Chat on WhatsApp", "Ongea nasi WhatsApp")}
              </a>
            </Button>
          </div>
        </div>
      </section>
      <CTA />
    </PublicPageShell>
  );
}
