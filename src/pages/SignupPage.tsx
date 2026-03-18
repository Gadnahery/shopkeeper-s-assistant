import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkPasswordStrength } from "@/lib/validation";
import { toast } from "sonner";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { isGoogleAuthReady } from "@/lib/authProviders";

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
          : "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol."
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
            : error.message
        );
      } else {
        setSuccess(true);
        toast.success(
          language === "sw"
            ? "Akaunti imeundwa! Angalia barua pepe yako au ingia."
            : "Account created! Check your email to verify, or sign in."
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
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_32%)]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-12 text-white">
          <Link to="/" className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">WiseCash</span>
          </Link>

          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">
              {language === "sw" ? "Anza Leo" : "Start Today"}
            </p>
            <h1 className="max-w-lg text-4xl font-bold leading-tight">
              {language === "sw" ? "Fungua mfumo wako wa biashara ndani ya dakika chache." : "Launch your retail workspace in just a few minutes."}
            </h1>
            <p className="max-w-lg text-lg text-white/75">
              {language === "sw"
                ? "Unda akaunti, sanidi duka lako, kisha anza kuuza, kufuatilia stoki, na kuona ripoti."
                : "Create your account, set up your shop, and start selling, tracking stock, and viewing reports."}
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-2 gap-4">
            {[
              language === "sw" ? "Usajili wa haraka" : "Fast onboarding",
              language === "sw" ? "Duka lako mara moja" : "Your shop instantly",
              language === "sw" ? "Mwonekano wa kisasa" : "Modern workspace",
              language === "sw" ? "Tayari kwa ukuaji" : "Ready to scale",
            ].map((item) => (
              <div key={item} className="rounded-[1.6rem] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="flex min-h-screen items-center justify-center overflow-y-auto px-4 py-10 md:px-8"
        >
          <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/88 p-8 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl md:p-10">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3 rounded-2xl bg-background/70 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">WiseCash</span>
              </Link>
            </div>

            {success ? (
              <div className="rounded-[1.75rem] bg-muted/30 px-6 py-10 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/16">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">{language === "sw" ? "Akaunti Imeundwa!" : "Account Created!"}</h2>
                <p className="mt-2 text-muted-foreground">
                  {language === "sw"
                    ? "Angalia barua pepe yako kuthibitisha akaunti au ingia sasa."
                    : "Check your email to verify your account, or sign in now."}
                </p>
                <Button asChild className="mt-8 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600">
                  <Link to="/login">
                    {language === "sw" ? "Ingia" : "Sign In"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    {language === "sw" ? "Fungua akaunti mpya" : "Create your account"}
                  </h2>
                  <p className="text-muted-foreground">
                    {language === "sw" ? "Sanidi duka lako na anza kusimamia biashara." : "Set up your shop and start managing your business."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <GoogleAuthButton
                    loading={googleLoading}
                    onClick={handleGoogleSignup}
                    disabled={!isGoogleAuthReady}
                    label={language === "sw" ? "Jisajili kwa Google" : "Continue with Google"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {!isGoogleAuthReady
                      ? language === "sw"
                        ? "Google itaonekana hapa baada ya kuunganishwa kwenye Supabase."
                        : "Google sign-in will appear here after it is connected in Supabase."
                      : language === "sw"
                        ? "Ukichagua Google, tutaomba pia jina lako na jina la duka kabla ya kukupeleka ndani."
                        : "If you choose Google, we will also ask for your name and shop name before taking you inside."}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="h-px flex-1 bg-border/70" />
                    <span>{language === "sw" ? "au kwa barua pepe" : "or with email"}</span>
                    <span className="h-px flex-1 bg-border/70" />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Jina Kamili" : "Full Name"}</Label>
                    <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-12 rounded-2xl text-foreground" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Jina la Duka" : "Shop Name"}</Label>
                    <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="h-12 rounded-2xl text-foreground" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-2xl text-foreground" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Nenosiri" : "Password"}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-12 rounded-2xl pr-11 text-foreground"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Thibitisha Nenosiri" : "Confirm Password"}</Label>
                    <Input
                      type="password"
                      placeholder="********"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="h-12 rounded-2xl text-foreground"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "sw"
                      ? "Tumia herufi 8 au zaidi zenye herufi kubwa, ndogo, namba, na alama."
                      : "Use 8 or more characters with uppercase, lowercase, a number, and a symbol."}
                  </p>
                  <Button type="submit" className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-base font-semibold" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                      {language === "sw" ? "Fungua Akaunti" : "Create Account"}
                      <ArrowRight className="h-4 w-4" />
                    </>}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {language === "sw" ? "Tayari una akaunti?" : "Already have an account?"}{" "}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    {language === "sw" ? "Ingia" : "Log in"}
                  </Link>
                </p>
                <p className="mt-4 text-center">
                  <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {"<-"} {language === "sw" ? "Rudi kwenye ukurasa wa kwanza" : "Back to home"}
                  </Link>
                </p>
              </>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
