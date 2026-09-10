import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Globe, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkPasswordStrength } from "@/lib/validation";
import { requestPasswordReset } from "@/lib/passwordRecovery";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SHOP_COUNTRY_OPTIONS, getCountryByCode } from "@/lib/international";

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", shopName: "", countryCode: "TZ" });
  const selectedCountry = getCountryByCode(form.countryCode);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setRecoveryMode(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (user && !recoveryMode) navigate("/dashboard", { replace: true });
  }, [user, recoveryMode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) {
          toast.error(
            error.message.includes("Invalid login")
              ? language === "sw"
                ? "Barua pepe au nenosiri si sahihi"
                : "Invalid email or password"
              : error.message,
          );
          return;
        }
        navigate("/dashboard", { replace: true });
      } else {
        if (!form.fullName || !form.shopName) {
          toast.error(language === "sw" ? "Tafadhali jaza sehemu zote" : "Please fill in all fields");
          return;
        }
        if (checkPasswordStrength(form.password).suggestions.length > 0) {
          toast.error(
            language === "sw"
              ? "Nenosiri liwe na herufi 8 au zaidi, herufi kubwa na ndogo, namba, na alama."
              : "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.",
          );
          return;
        }
        const { error } = await signUp(form.email, form.password, form.fullName, form.shopName, form.countryCode);
        if (error) {
          toast.error(
            error.message.includes("already registered")
              ? language === "sw"
                ? "Barua pepe imesajiliwa. Tafadhali ingia."
                : "Email already registered. Please sign in."
              : error.message,
          );
        } else {
          toast.success(
            language === "sw"
              ? "Akaunti imeundwa! Angalia barua pepe yako au ingia."
              : "Account created! Check your email to verify, or sign in.",
          );
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const message = await requestPasswordReset(resetEmail, language);
      toast.success(message);
      setForgotOpen(false);
      setResetEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : language === "sw"
          ? "Imeshindikana kutuma barua pepe."
          : "Could not send the reset email.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPasswordStrength(newPassword).suggestions.length > 0) {
      toast.error(
        language === "sw"
          ? "Nenosiri liwe na angalau herufi 8, litumie herufi kubwa na ndogo, namba, na alama."
          : "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.",
      );
      return;
    }
    setUpdatePasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(language === "sw" ? "Nenosiri jipya limewekwa!" : "New password saved!");
      setRecoveryMode(false);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setUpdatePasswordLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle(isLogin ? "login" : "signup");
      if (error) toast.error(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (recoveryMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg space-y-4">
          <BrandLogo size="lg" />
          <h2 className="text-xl font-bold">{language === "sw" ? "Weka Nenosiri Jipya" : "Enter New Password"}</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Nenosiri Jipya" : "New Password"}</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-xl border-border bg-background text-xs"
              />
            </div>
            <Button type="submit" disabled={updatePasswordLoading} className="w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground">
              {updatePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {language === "sw" ? "Hifadhi Nenosiri" : "Save Password"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

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
            {isLogin
              ? language === "sw"
                ? "Karibu Tena Kwenye WiseCash"
                : "Welcome Back to WiseCash"
              : language === "sw"
              ? "Fungua Akaunti ya Biashara"
              : "Create Your Business Account"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLogin
              ? language === "sw"
                ? "Ingia kusimamia ERP na POS ya biashara yako."
                : "Sign in to access your ERP workspace."
              : language === "sw"
              ? "Mfumo kamili wa ERP kwa biashara inayokua."
              : "All-in-one ERP system for growing businesses."}
          </p>
        </div>

        {forgotOpen ? (
          <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe" : "Email Address"}</Label>
              <Input
                type="email"
                required
                placeholder="owner@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-10 rounded-xl border-border bg-background text-xs"
              />
            </div>
            <Button type="submit" disabled={resetLoading} className="w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground">
              {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {language === "sw" ? "Tuma Kiungo" : "Send Reset Link"}
            </Button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setForgotOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
                {language === "sw" ? "← Rudi" : "← Back"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Duka / Biashara *" : "Shop Name *"}</Label>
                  <Input
                    required
                    placeholder="e.g. Mangi Hardware"
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    className="h-10 rounded-xl border-border bg-background text-xs"
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
                    className="h-10 rounded-xl border-border bg-background text-xs"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe *" : "Email Address *"}</Label>
              <Input
                type="email"
                required
                placeholder="owner@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 rounded-xl border-border bg-background text-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{language === "sw" ? "Nenosiri *" : "Password *"}</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-accent"
                  >
                    {language === "sw" ? "Umesahau?" : "Forgot?"}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background pr-9 text-xs"
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

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              <span>{isLogin ? (language === "sw" ? "Ingia Sasa" : "Log In") : (language === "sw" ? "Kamilisha Usajili" : "Create Account")}</span>
            </Button>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {language === "sw" ? "au endelea na" : "or continue with"}
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <GoogleAuthButton
              mode={isLogin ? "login" : "signup"}
              language={language}
              loading={googleLoading}
              onClick={handleGoogleAuth}
            />

            {/* Toggle Mode */}
            <div className="pt-2 text-center text-xs text-muted-foreground">
              {isLogin
                ? (language === "sw" ? "Huna akaunti? " : "Don't have an account? ")
                : (language === "sw" ? "Tayari una akaunti? " : "Already have an account? ")}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-foreground hover:underline"
              >
                {isLogin
                  ? (language === "sw" ? "Jisajili Bure" : "Sign Up")
                  : (language === "sw" ? "Ingia Hapa" : "Log In")}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
