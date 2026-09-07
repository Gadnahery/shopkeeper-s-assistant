import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_CONTACT, CONTACT_LINKS } from "@/lib/contact";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="space-y-3 text-center md:text-left">
            <Link to="/" className="inline-flex items-center">
              <BrandLogo size="md" />
            </Link>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              {language === "sw"
                ? "WiseCash ni mfumo wa kisasa wa ERP na POS uliotengenezwa mahsusi kuwawezesha wafanyabiashara wa Tanzania kufuatilia stoki, kudhibiti madeni, na kujua faida halisi ya biashara zao kila siku."
                : "WiseCash is modern retail ERP and POS software purpose-built to empower Tanzanian businesses to manage inventory, eliminate credit leakages, and track true daily profits."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-start pt-1">
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-accent" />
                WhatsApp
              </a>
              <a
                href={CONTACT_LINKS.email}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Mail className="h-3.5 w-3.5 text-accent" />
                Email
              </a>
              <a
                href={CONTACT_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <Instagram className="h-3.5 w-3.5 text-accent" />
                Instagram
              </a>
            </div>
          </div>

          <div className="space-y-4 text-center md:text-right">
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
              {footerLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  {language === "sw" ? link.sw : link.en}
                </Link>
              ))}
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p>{APP_CONTACT.email}</p>
              <p>{APP_CONTACT.phoneDisplay}</p>
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WiseCash ERP. {language === "sw" ? "Haki zote zimehifadhiwa." : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
