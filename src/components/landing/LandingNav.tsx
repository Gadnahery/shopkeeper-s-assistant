import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", en: "Features", sw: "Vipengele" },
  { href: "#how-it-works", en: "How it works", sw: "Jinsi inavyofanya" },
  { href: "#pricing", en: "Pricing", sw: "Bei" },
  { href: "#faq", en: "FAQ", sw: "Maswali" },
];

export function LandingNav() {
  const { language, setLanguage } = useLanguage();
  const isSw = language === "sw";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <nav
        className={cn(
          "mx-auto flex h-16 max-w-[1280px] items-center justify-between rounded-[18px] px-4 transition-all duration-300 sm:px-6",
          scrolled
            ? "border border-[rgba(229,231,235,0.8)] bg-[rgba(255,255,255,0.82)] shadow-sm backdrop-blur-[22px]"
            : "border border-transparent bg-transparent",
        )}
      >
        <a
          href="#top"
          className={cn(
            "text-[15px] font-semibold tracking-[0.12em]",
            scrolled ? "text-[#1A1D29]" : "text-white",
          )}
        >
          WISECASH
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "text-[14px] font-medium transition-colors",
                scrolled
                  ? "text-[#6B7280] hover:text-[#1A1D29]"
                  : "text-white/75 hover:text-white",
              )}
            >
              {isSw ? l.sw : l.en}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className={cn(
              "text-[12px] font-semibold tracking-wide",
              scrolled ? "text-[#6B7280]" : "text-white/70",
            )}
          >
            {isSw ? "EN" : "SW"}
          </button>
          <Link
            to="/login"
            className={cn(
              "text-[14px] font-medium",
              scrolled ? "text-[#1A1D29]" : "text-white",
            )}
          >
            {isSw ? "Ingia" : "Log in"}
          </Link>
          <Link
            to="/signup"
            className={cn(
              "inline-flex h-10 items-center rounded-[14px] px-4 text-[14px] font-medium",
              scrolled
                ? "bg-[#1A1D29] text-white hover:bg-[#2a2e3d]"
                : "bg-white text-[#1A1D29] hover:bg-white/90",
            )}
          >
            {isSw ? "Anza bure" : "Start free"}
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl md:hidden",
            scrolled ? "text-[#1A1D29]" : "text-white",
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-[1280px] rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-medium text-[#1A1D29]"
              >
                {isSw ? l.sw : l.en}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-[#E5E7EB] pt-4">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[#1A1D29] px-4 py-3 text-center text-[15px] font-medium text-[#1A1D29]"
            >
              {isSw ? "Ingia" : "Log in"}
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-[#1A1D29] px-4 py-3 text-center text-[15px] font-medium text-white"
            >
              {isSw ? "Anza bure" : "Start free"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
