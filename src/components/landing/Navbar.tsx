import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Sun, Moon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const isSw = language === "sw";

  const navLinks = [
    { href: "#showcase", labelEn: "Features", labelSw: "Vipengele" },
    { href: "#offline", labelEn: "Offline PWA", labelSw: "Bila Mtandao" },
    { href: "#businesses", labelEn: "Solutions", labelSw: "Biashara" },
    { href: "#pricing", labelEn: "Pricing", labelSw: "Bei" },
    { href: "#faq", labelEn: "FAQ", labelSw: "Maswali" },
  ];

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-card/90 backdrop-blur-xl transition-all"
    >
      <nav className="container mx-auto flex h-16 sm:h-17 items-center justify-between px-4 sm:px-6 max-w-6xl">
        <Link to="/" className="flex items-center">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isSw ? link.labelSw : link.labelEn}
            </a>
          ))}
        </div>

        {/* Actions (Language, Theme, Login, Primary CTA) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className="flex items-center gap-1.5 rounded-xl border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={isSw ? "Switch to English" : "Badilisha kwa Kiswahili"}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{isSw ? "English" : "Kiswahili"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </button>

          {/* Login Link */}
          <Button variant="ghost" size="sm" asChild className="h-9 px-3 text-xs font-semibold text-foreground">
            <Link to="/login">{isSw ? "Ingia" : "Login"}</Link>
          </Button>

          {/* ENLARGED & IMMERSED Primary CTA Button */}
          <Button
            asChild
            className="h-10 sm:h-10.5 rounded-full bg-primary px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link to="/signup" className="flex items-center gap-2">
              <span className="leading-none">{isSw ? "Anza Siku 14 Bure" : "Start Free Trial"}</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </Button>
        </div>

        {/* Mobile menu toggle & quick actions */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className="flex items-center gap-1 rounded-lg border border-border/80 px-2 py-1 text-xs font-semibold text-muted-foreground"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{isSw ? "EN" : "SW"}</span>
          </button>

          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-foreground" />}
          </button>

          <button
            type="button"
            className="p-2 rounded-xl hover:bg-muted text-foreground border border-border/70"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-card/95 backdrop-blur-xl px-4 py-5 md:hidden space-y-4"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {isSw ? link.labelSw : link.labelEn}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-border/80 flex flex-col gap-2.5">
              <Button variant="outline" asChild className="h-11 w-full justify-center text-xs font-semibold rounded-xl">
                <Link to="/login" onClick={() => setOpen(false)}>
                  {isSw ? "Ingia kwenye Akaunti" : "Sign In to Account"}
                </Link>
              </Button>

              <Button asChild className="h-11 w-full justify-center bg-primary text-sm font-bold text-primary-foreground rounded-full shadow-md">
                <Link to="/signup" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2">
                  <span>{isSw ? "Anza Majaribio ya Siku 14 Bure" : "Start 14-Day Free Trial"}</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
