import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Sun, Moon, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function PreviewNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const isSw = language === "sw";

  const navItems = [
    { label: isSw ? "Vipengele" : "Capabilities", href: "#capabilities" },
    { label: isSw ? "Muonekano" : "Product UI", href: "#showcase" },
    { label: isSw ? "Bila Mtandao" : "Offline PWA", href: "#offline" },
    { label: isSw ? "Biashara" : "Solutions", href: "#businesses" },
    { label: isSw ? "Bei" : "Pricing", href: "#pricing" },
    { label: isSw ? "Maswali" : "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo with Live Preview tag */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <BrandLogo size="md" />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>{isSw ? "Muonekano Mpya" : "Redesign Preview"}</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions (Language, Theme, Auth, CTA) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className="flex items-center gap-1.5 rounded-xl border border-border/80 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={isSw ? "Switch to English" : "Badili kwenda Kiswahili"}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{isSw ? "English" : "Kiswahili"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-foreground" />
            )}
          </button>

          {/* Sign In Link */}
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-semibold text-foreground">
            <Link to="/login">{isSw ? "Ingia" : "Login"}</Link>
          </Button>

          {/* Free Trial Primary CTA - Enlarged & Immersed */}
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

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(isSw ? "en" : "sw")}
            className="flex items-center gap-1 rounded-lg border border-border/80 px-2 py-1 text-xs font-semibold text-muted-foreground"
          >
            <Globe className="h-3 w-3 text-primary" />
            <span>{isSw ? "EN" : "SW"}</span>
          </button>

          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-3 w-3 text-amber-500" /> : <Moon className="h-3 w-3" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 md:hidden space-y-3"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-border/80 flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full justify-center text-xs font-semibold">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  {isSw ? "Ingia kwenye Akaunti" : "Sign In to Account"}
                </Link>
              </Button>
              <Button asChild className="w-full justify-center bg-primary text-xs font-bold text-primary-foreground">
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  {isSw ? "Anza Majaribio ya Siku 14 Bure" : "Start 14-Day Free Trial"}
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
