import { Link } from "react-router-dom";
import { Mail, Phone, Instagram } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_CONTACT, CONTACT_LINKS } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export function LandingFooter() {
  const { language, setLanguage } = useLanguage();
  const isSw = language === "sw";

  return (
    <footer className="bg-[#1A1D29] text-white">
      <div className="mx-auto max-w-[1100px] px-5 py-14 sm:px-10 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-[15px] font-semibold tracking-[0.12em]">WISECASH</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
              {isSw
                ? "Zana rahisi kwa biashara bora — mauzo, stoki, wateja na faida."
                : "Simple tools for better business — sales, stock, customers and profit."}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <a
                href={CONTACT_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.75} />
              </a>
              <a
                href={CONTACT_LINKS.email}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" strokeWidth={1.75} />
              </a>
              <a
                href={CONTACT_LINKS.phone}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white/40 hover:text-white"
                aria-label="Phone"
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {isSw ? "Bidhaa" : "Product"}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a href="#features" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Vipengele" : "Features"}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Jinsi inavyofanya" : "How it works"}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Bei" : "Pricing"}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm text-white/70 hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {isSw ? "Akaunti" : "Account"}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link to="/login" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Ingia" : "Log in"}
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Anza bure" : "Start free"}
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Faragha" : "Privacy"}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-white/70 hover:text-white">
                  {isSw ? "Masharti" : "Terms"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {isSw ? "Mawasiliano" : "Contact"}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <a href={CONTACT_LINKS.email} className="hover:text-white">
                  {APP_CONTACT.email}
                </a>
              </li>
              <li>
                <a href={CONTACT_LINKS.phone} className="hover:text-white">
                  {APP_CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_LINKS.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_LINKS.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  {APP_CONTACT.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-white/40">© 2026 WiseCash</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`text-xs font-semibold ${!isSw ? "text-white" : "text-white/40 hover:text-white"}`}
            >
              EN
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => setLanguage("sw")}
              className={`text-xs font-semibold ${isSw ? "text-white" : "text-white/40 hover:text-white"}`}
            >
              SW
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
