import { Link } from "react-router-dom";
import { Mail, Instagram } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_CONTACT, CONTACT_LINKS } from "@/lib/contact";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function PreviewFooter() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const links = [
    { labelEn: "Features", labelSw: "Vipengele", href: "#capabilities" },
    { labelEn: "Product UI", labelSw: "Muonekano", href: "#showcase" },
    { labelEn: "Offline PWA", labelSw: "Bila Mtandao", href: "#offline" },
    { labelEn: "Pricing", labelSw: "Bei", href: "#pricing" },
    { labelEn: "FAQ", labelSw: "Maswali", href: "#faq" },
    { labelEn: "Login", labelSw: "Ingia", href: "/login" },
    { labelEn: "Free Trial", labelSw: "Majaribio Bure", href: "/signup" },
  ];

  return (
    <footer className="border-t border-border/70 bg-card py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Brand & Tanzanian business statement */}
          <div className="space-y-3 text-center md:text-left">
            <Link to="/" className="inline-flex items-center">
              <BrandLogo size="md" />
            </Link>
            <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
              {isSw
                ? "WiseCash ni mfumo wa kisasa wa usimamizi wa biashara na mauzo ulioundwa kuwawezesha wafanyabiashara wa Tanzania kujua faida halisi, kudhibiti stoki na kuacha madaftari."
                : "WiseCash is modern retail ERP and POS software purpose-built to empower Tanzanian shop owners to track true daily profit, control inventory, and stop guessing."}
            </p>

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span>WhatsApp</span>
              </a>
              <a
                href={CONTACT_LINKS.email}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>Email</span>
              </a>
              <a
                href={CONTACT_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Instagram className="h-3.5 w-3.5 text-rose-500" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Right: Quick Links & Contact Details */}
          <div className="space-y-4 text-center md:text-right">
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 text-xs font-medium text-muted-foreground">
              {links.map((link, i) => (
                <a key={i} href={link.href} className="hover:text-foreground transition-colors">
                  {isSw ? link.labelSw : link.labelEn}
                </a>
              ))}
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p>{APP_CONTACT.email}</p>
              <p>{APP_CONTACT.phoneDisplay}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WiseCash. {isSw ? "Haki zote zimehifadhiwa." : "All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
