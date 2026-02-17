import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const navLinks = [
  { href: "#features", labelEn: "Features", labelSw: "Vipengele" },
  { href: "#pricing", labelEn: "Pricing", labelSw: "Bei" },
  { href: "#how-it-works", labelEn: "How it Works", labelSw: "Jinsi Inavyofanya Kazi" },
  { href: "#about", labelEn: "About", labelSw: "Kuhusu" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const t = (en: string, sw: string) => (language === "sw" ? sw : en);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80"
    >
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-lg shadow-teal-500/25">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-blue-400">
            Smart Money
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(link.labelEn, link.labelSw)}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === "sw" ? "en" : "sw")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            title={language === "sw" ? "Switch to English" : "Badilisha kwa Kiswahili"}
          >
            <Globe className="h-4 w-4" />
            <span>{language === "sw" ? "EN" : "SW"}</span>
          </button>
          <Button variant="ghost" asChild>
            <Link to="/login">{t("Login", "Ingia")}</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-md shadow-teal-500/25">
            <Link to="/signup">{t("Signup", "Jisajili")}</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto flex flex-col gap-1 py-4 px-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {t(link.labelEn, link.labelSw)}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    {t("Login", "Ingia")}
                  </Link>
                </Button>
                <Button asChild className="w-full bg-gradient-to-r from-teal-500 to-blue-600">
                  <Link to="/signup" onClick={() => setOpen(false)}>
                    {t("Signup", "Jisajili")}
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
