import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_LINKS } from "@/lib/contact";

export function LandingFooter() {
  const { language, setLanguage } = useLanguage();
  const isSw = language === "sw";

  return (
    <footer className="bg-[#1A1D29] px-5 py-16 text-white sm:px-10 sm:py-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div>
            <p className="text-[15px] font-semibold tracking-[0.12em]">WISECASH</p>
            <p className="mt-3 max-w-xs text-sm text-white/55">
              {isSw
                ? "Zana rahisi kwa biashara bora."
                : "Simple tools for better business."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div className="space-y-3">
              <a href="#features" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Vipengele" : "Features"}
              </a>
              <a href="#how-it-works" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Jinsi inavyofanya" : "How it works"}
              </a>
              <a href="#pricing" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Bei" : "Pricing"}
              </a>
              <a href="#faq" className="block text-sm text-white/70 hover:text-white">
                FAQ
              </a>
            </div>
            <div className="space-y-3">
              <Link to="/login" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Ingia" : "Log in"}
              </Link>
              <Link to="/signup" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Anza bure" : "Start free"}
              </Link>
              <Link to="/privacy-policy" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Faragha" : "Privacy"}
              </Link>
              <Link to="/terms-of-service" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Masharti" : "Terms"}
              </Link>
            </div>
            <div className="space-y-3">
              <Link to="/contact" className="block text-sm text-white/70 hover:text-white">
                {isSw ? "Wasiliana" : "Contact"}
              </Link>
              <a
                href={CONTACT_LINKS.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-white/70 hover:text-white"
              >
                WhatsApp
              </a>
              <a
                href={CONTACT_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-white/70 hover:text-white"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <p className="text-xs text-white/40">© 2026 WiseCash</p>
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className="text-xs font-semibold tracking-wide text-white/50 hover:text-white"
          >
            EN | SW
          </button>
        </div>
      </div>
    </footer>
  );
}
