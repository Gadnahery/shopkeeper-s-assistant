import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkPasswordStrength } from "@/lib/validation";
import { toast } from "sonner";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SHOP_COUNTRY_OPTIONS, getCountryByCode } from "@/lib/international";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCodeFromUrl = (searchParams.get("ref") || "").trim().toUpperCase();
  const storedRef = (typeof window !== "undefined" ? localStorage.getItem("wisecash_referral_code") : "") || "";
  const initialRef = refCodeFromUrl || storedRef;

  useEffect(() => {
    if (refCodeFromUrl) {
      try {
        localStorage.setItem("wisecash_referral_code", refCodeFromUrl);
      } catch {}
    }
  }, [refCodeFromUrl]);

  const { signUp, signInWithGoogle } = useAuth();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    shopName: "",
    countryCode: "TZ",
    referralCode: initialRef,
  });

  const selectedCountry = getCountryByCode(form.countryCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(language === "sw" ? "Nenosiri halilingani" : "Passwords do not match");
      return;
    }
    if (!form.fullName || !form.shopName) {
      toast.error(language === "sw" ? "Tafadhali jaza sehemu zote" : "Please fill in all fields");
      return;
    }
    const passwordCheck = checkPasswordStrength(form.password);
    if (passwordCheck.suggestions.length > 0) {
      toast.error(
        language === "sw"
          ? "Nenosiri liwe na angalau herufi 8, litumie herufi kubwa na ndogo, namba, na alama."
          : "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.",
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(
        form.email,
        form.password,
        form.fullName,
        form.shopName,
        form.countryCode,
        form.referralCode
      );
      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? language === "sw"
              ? "Barua pepe imesajiliwa. Tafadhali ingia."
              : "Email already registered. Please sign in."
            : error.message,
        );
      } else {
        setSuccess(true);
        toast.success(
          language === "sw"
            ? "Akaunti imeundwa! Angalia barua pepe yako au ingia."
            : "Account created! Check your email to verify, or sign in.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const activeRef = (form.referralCode || initialRef || "").trim().toUpperCase();
      if (activeRef) {
        try {
          localStorage.setItem("wisecash_referral_code", activeRef);
        } catch {}
      }
      const { error } = await signInWithGoogle("signup", activeRef);
      if (error) {
        toast.error(error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-3 inline-block">
            <BrandLogo size="lg" />
          </Link>
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === "sw" ? "Siku 14 Bure Ukijiunga" : "14-Day Free Trial Included"}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {language === "sw" ? "Fungua Akaunti ya Biashara" : "Create Your Business Account"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "sw"
              ? "Jaribu mfumo kamili wa POS & ERP bure kwa siku 14 bila malipo ya mwanzo."
              : "Explore the full POS & ERP system free for 14 days with zero upfront payment."}
          </p>
        </div>

        {success ? (
          <div className="mt-6 space-y-4 rounded-xl bg-muted/40 p-6 text-center border border-border">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success-text)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {language === "sw" ? "Akaunti Imeundwa Kikamilifu!" : "Account Created Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === "sw"
                ? "Tumetuma ujumbe wa uthibitisho kwenye barua pepe yako. Unaweza kuingia sasa."
                : "A verification email has been sent. You can now proceed to log in."}
            </p>
            <Button asChild className="w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground">
              <Link to="/login">{language === "sw" ? "Ingia Sasa" : "Go to Login"}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Duka / Biashara *" : "Business / Shop Name *"}</Label>
              <Input
                required
                placeholder="e.g. Mangi Hardware & Retail"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>{language === "sw" ? "Nchi / Taifa *" : "Country / Nation *"}</span>
                <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {selectedCountry.flag} {selectedCountry.currency}
                </span>
              </Label>
              <Select
                value={form.countryCode}
                onValueChange={(val) => setForm({ ...form, countryCode: val })}
              >
                <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs focus:ring-accent">
                  <SelectValue placeholder={language === "sw" ? "Chagua Nchi" : "Select Country"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl border-border bg-popover text-xs">
                  {SHOP_COUNTRY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{c.flag}</span>
                        <span className="font-medium">{language === "sw" ? c.labelSw : c.label}</span>
                        <span className="text-muted-foreground text-[10px]">({c.currency})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <span>{language === "sw" ? "Sarafu kuu itakayowekwa:" : "Default account currency:"}</span>
                <span className="font-bold text-foreground">
                  {selectedCountry.currency} ({language === "sw" ? selectedCountry.currencyNameSw : selectedCountry.currencyName})
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Jina Kamili la Mmiliki *" : "Full Name *"}</Label>
              <Input
                required
                placeholder="e.g. Baraka Juma"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe *" : "Email Address *"}</Label>
              <Input
                type="email"
                required
                placeholder="owner@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{language === "sw" ? "Nenosiri *" : "Password *"}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="h-10 rounded-xl border-border bg-background pr-9 text-xs focus-visible:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">{language === "sw" ? "Thibitisha *" : "Confirm *"}</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  {language === "sw" ? "Nambari ya Mwaliko (Hiari)" : "Referral Code (Optional)"}
                </Label>
                {refCodeFromUrl && (
                  <span className="text-[10px] font-medium text-primary">
                    {language === "sw" ? "Imewekwa kutoka kwa kiungo" : "Applied from link"}
                  </span>
                )}
              </div>
              <Input
                placeholder="e.g. WISE-ABC123"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                className="h-10 rounded-xl border-border bg-background text-xs uppercase tracking-wider focus-visible:ring-accent"
              />
              <p className="text-[10px] text-muted-foreground">
                {language === "sw"
                  ? "Ikiwa umetumwa na mmiliki mwingine wa duka, weka msimbo wake hapa."
                  : "If invited by another shopkeeper, enter their referral code here."}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              <span>{language === "sw" ? "Kamilisha Usajili" : "Create Account"}</span>
            </Button>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {language === "sw" ? "au jiunge na" : "or sign up with"}
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <GoogleAuthButton
              mode="signup"
              language={language}
              loading={googleLoading}
              onClick={handleGoogleSignup}
            />

            {/* Switch to Login */}
            <div className="pt-2 text-center text-xs text-muted-foreground">
              {language === "sw" ? "Tayari una akaunti? " : "Already have an account? "}
              <Link to="/login" className="font-bold text-foreground hover:underline">
                {language === "sw" ? "Ingia Hapa" : "Sign In"}
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
