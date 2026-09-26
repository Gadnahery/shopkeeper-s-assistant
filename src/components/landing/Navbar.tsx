import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#showcase", labelEn: "Product", labelSw: "Bidhaa" },
  { href: "#offline", labelEn: "Offline", labelSw: "Bila mtandao" },
  { href: "#pricing", labelEn: "Pricing", labelSw: "Bei" },
  { href: "#faq", labelEn: "FAQ", labelSw: "Maswali" },
];

export function Navbar() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isSw = language === "sw";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onToggleTheme = (e?: React.MouseEvent) => {
    e?.preventDefault();
    toggleTheme(e);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-b border-border/80 bg-background/85 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="container mx-auto flex h-16 sm:h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="relative z-10 shrink-0">
          <BrandLogo
            size="md"
            className={cn(
              !scrolled &&
                "[&_span]:!text-white [&_div]:!bg-emerald-500/25 [&_div]:!text-emerald-300",
            )}
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                scrolled
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  : "text-white/70 hover:text-white hover:bg-white/10",
              )}
            >
              {isSw ? link.labelSw : link.labelEn}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors",
              scrolled
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            {isSw ? "EN" : "SW"}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              scrolled
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className={cn("h-4 w-4", scrolled ? "text-foreground" : "text-white")} />
            )}
          </button>
          <Button
            variant="ghost"
            asChild
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium",
              scrolled
                ? "text-foreground hover:bg-muted"
                : "text-white hover:bg-white/10 hover:text-white",
            )}
          >
            <Link to="/login">{isSw ? "Ingia" : "Sign in"}</Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-full px-5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/20"
          >
            <Link to="/signup" className="inline-flex items-center gap-1.5">
              {isSw ? "Anza bure" : "Start free"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className={cn(
              "rounded-lg px-2 py-1 text-[11px] font-bold",
              scrolled ? "text-muted-foreground" : "text-white/80",
            )}
          >
            {isSw ? "EN" : "SW"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              scrolled
                ? "border border-border text-foreground"
                : "border border-white/20 text-white",
            )}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-background/95 backdrop-blur-xl md:hidden overflow-hidden"
          >
            <div className="container max-w-6xl px-4 py-5 space-y-4">
              <div className="flex flex-col gap-0.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3.5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    {isSw ? link.labelSw : link.labelEn}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
                <Button variant="outline" asChild className="h-11 w-full rounded-xl">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    {isSw ? "Ingia" : "Sign in"}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-11 w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold"
                >
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {isSw ? "Anza majaribio bure" : "Start free trial"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
