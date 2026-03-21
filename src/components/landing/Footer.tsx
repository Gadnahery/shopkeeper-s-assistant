import { Link } from "react-router-dom";
import { Instagram, Mail, Store } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_CONTACT, CONTACT_LINKS } from "@/lib/contact";

export function Footer() {
  const { language } = useLanguage();
  const footerLinks = [
    { href: "/features", en: "Features", sw: "Vipengele" },
    { href: "/pricing", en: "Pricing", sw: "Bei" },
    { href: "/about", en: "About", sw: "Kuhusu" },
    { href: "/contact", en: "Contact", sw: "Wasiliana" },
    { href: "/login", en: "Login", sw: "Ingia" },
    { href: "/signup", en: "Signup", sw: "Jisajili" },
  ];

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-border bg-gradient-to-br from-slate-100 via-teal-50/30 to-blue-50/40 py-12 dark:from-neutral-900 dark:via-teal-950/20 dark:to-blue-950/20">
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-teal-400/15 blur-3xl dark:bg-teal-500/10" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl dark:bg-blue-500/10" />
      <div className="container relative mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="space-y-4 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">WiseCash</span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {language === "sw"
                ? "Wasiliana nasi moja kwa moja kwa WhatsApp, email, au Instagram kwa msaada wa WiseCash."
                : "Reach us directly on WhatsApp, email, or Instagram for WiseCash support and onboarding help."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={CONTACT_LINKS.email}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
              <a
                href={CONTACT_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-2 text-sm font-medium text-fuchsia-700 transition-colors hover:bg-fuchsia-500/15 dark:text-fuchsia-300"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>

          <div className="space-y-5 text-center md:text-right">
            <div className="flex flex-wrap items-center justify-center gap-6 md:justify-end">
              {footerLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {language === "sw" ? link.sw : link.en}
                </Link>
              ))}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{APP_CONTACT.email}</p>
              <p>{APP_CONTACT.phoneDisplay}</p>
              <p>{APP_CONTACT.instagramHandle}</p>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Copyright 2026 WiseCash. {language === "sw" ? "Haki zote zimehifadhiwa." : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
