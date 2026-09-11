import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Sun, Moon, Check, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAContext } from "@/contexts/PWAContext";
import { useTheme } from "@/hooks/useTheme";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navLinks = [
  { href: "/features", labelEn: "Features", labelSw: "Vipengele" },
  { href: "/pricing", labelEn: "Pricing", labelSw: "Bei" },
  { href: "/about", labelEn: "About", labelSw: "Kuhusu" },
  { href: "/contact", labelEn: "Contact", labelSw: "Wasiliana" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { install, isInstalled } = usePWAContext();

  const t = (en: string, sw: string) => (language === "sw" ? sw : en);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/90 backdrop-blur-md"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(link.labelEn, link.labelSw)}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "sw" ? "en" : "sw")}
            className="flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={language === "sw" ? "Switch to English" : "Badilisha kwa Kiswahili"}
          >
            <Globe className="h-3.5 w-3.5 text-accent" />
            <span>{language === "sw" ? "English" : "Kiswahili"}</span>
          </button>

          <button
            onClick={(e) => toggleTheme(e)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-foreground" />
            )}
          </button>

          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
            <Link to="/login">{t("Login", "Ingia")}</Link>
          </Button>

          <Button asChild size="sm" className="h-8 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90">
            <Link to="/signup" className="flex items-center gap-1">
              <span>{t("Start Free Trial", "Anza Siku 14 Bure")}</span>
              <ArrowRight className="h-3.5 w-3.5 text-accent" />
            </Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-card px-4 py-4 md:hidden space-y-3"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {t(link.labelEn, link.labelSw)}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setLanguage(language === "sw" ? "en" : "sw")}
                className="flex items-center gap-2 rounded-lg py-2 text-xs font-medium text-muted-foreground"
              >
                <Globe className="h-4 w-4 text-accent" />
                <span>{language === "sw" ? "English" : "Kiswahili"}</span>
              </button>
              <button
                onClick={(e) => toggleTheme(e)}
                className="flex items-center gap-2 rounded-lg py-2 text-xs font-medium text-muted-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-accent" />}
                <span>{theme === "dark" ? (language === "sw" ? "Mandhari ya Mwanga" : "Light Mode") : (language === "sw" ? "Mandhari ya Giza" : "Dark Mode")}</span>
              </button>
              <Button asChild className="h-9 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                <Link to="/signup">{t("Start 14-Day Free Trial", "Anza Siku 14 Bure")}</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
