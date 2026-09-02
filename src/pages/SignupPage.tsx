import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkPasswordStrength } from "@/lib/validation";
import { toast } from "sonner";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, signUp, signInWithGoogle } = useAuth();
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
  });

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

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
      const { error } = await signUp(form.email, form.password, form.fullName, form.shopName);
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
      const { error } = await signInWithGoogle("signup");
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {language === "sw" ? "Fungua Akaunti ya Biashara" : "Create Your Business Account"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "sw"
              ? "Anza kutumia mfumo kamili wa ERP bure."
              : "Start managing your ERP & POS workspace for free."}
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
