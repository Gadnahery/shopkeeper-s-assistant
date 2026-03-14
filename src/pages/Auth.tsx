import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Eye, EyeOff, Loader2, ShieldCheck, Smartphone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAppUrl } from "@/lib/siteUrl";

const features = [
  { icon: Store, label: "POS & Sales", labelSw: "Mauzo na POS" },
  { icon: BarChart3, label: "Reports & Analytics", labelSw: "Ripoti na Uchambuzi" },
  { icon: ShieldCheck, label: "Inventory Control", labelSw: "Udhibiti wa Stoki" },
  { icon: Smartphone, label: "Works Offline", labelSw: "Inafanya Kazi Nje ya Mtandao" },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", shopName: "" });

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
              : error.message
          );
        }
      } else {
        if (!form.fullName || !form.shopName) {
          toast.error(language === "sw" ? "Tafadhali jaza sehemu zote" : "Please fill in all fields");
          return;
        }
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
          toast.success(
            language === "sw"
              ? "Akaunti imeundwa! Angalia barua pepe yako au ingia."
              : "Account created! Check your email to verify, or sign in."
          );
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error(language === "sw" ? "Nenosiri lazima liwe angalau herufi 6" : "Password must be at least 6 characters");
      return;
    }
    setUpdatePasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(language === "sw" ? "Nenosiri limebadilishwa. Unaweza kuingia sasa." : "Password updated. You can sign in now.");
        setRecoveryMode(false);
        setNewPassword("");
      }
    } finally {
      setUpdatePasswordLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error(language === "sw" ? "Ingiza barua pepe" : "Enter your email");
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${getAppUrl()}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          language === "sw"
            ? "Angalia barua pepe yako kwa kiungo cha kubadilisha nenosiri."
            : "Check your email for a link to reset your password."
        );
        setForgotOpen(false);
        setResetEmail("");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_32%)]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Store className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">WiseCash</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="max-w-lg text-4xl font-bold leading-tight">
                {language === "sw" ? "Simamia biashara yako kwa urahisi zaidi." : "Manage your business with more clarity and control."}
              </h1>
              <p className="mt-4 max-w-lg text-lg text-white/75">
                {language === "sw"
                  ? "Mfumo kamili wa POS, hesabu, ripoti, na usimamizi wa duka lako katika muonekano mpya wa kisasa."
                  : "A complete POS, inventory, reporting, and store management system in a cleaner modern workspace."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div key={feature.label} className="rounded-[1.6rem] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                  <feature.icon className="h-5 w-5" />
                  <p className="mt-6 text-sm font-medium">{language === "sw" ? feature.labelSw : feature.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/55">© 2026 WiseCash</p>
        </section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="flex min-h-screen items-center justify-center overflow-y-auto px-4 py-10 md:px-8"
        >
          <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl md:p-10">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-background/70 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">WiseCash</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                {recoveryMode
                  ? language === "sw" ? "Weka Nenosiri Jipya" : "Set New Password"
                  : isLogin
                    ? language === "sw" ? "Ingia kwenye akaunti yako" : "Welcome back"
                    : language === "sw" ? "Fungua akaunti mpya" : "Create your account"}
              </h2>
              <p className="text-muted-foreground">
                {recoveryMode
                  ? language === "sw" ? "Chagua nenosiri jipya kwa akaunti yako." : "Choose a new password for your account."
                  : isLogin
                    ? language === "sw" ? "Endelea na biashara yako." : "Sign in to continue."
                    : language === "sw" ? "Anza kusimamia biashara yako." : "Get started with your shop."}
              </p>
            </div>

            {recoveryMode ? (
              <form onSubmit={handleUpdatePassword} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label>{language === "sw" ? "Nenosiri Jipya" : "New Password"}</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 rounded-2xl pr-11"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="h-12 w-full rounded-2xl" disabled={updatePasswordLoading}>
                  {updatePasswordLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : language === "sw" ? "Weka Nenosiri Jipya" : "Set new password"}
                </Button>
              </form>
            ) : (
              <>
                <div className="mt-8 flex rounded-2xl bg-muted p-1">
                  <button onClick={() => setIsLogin(true)} className={`flex-1 rounded-[1rem] py-2.5 text-sm font-medium transition ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                    {language === "sw" ? "Ingia" : "Sign In"}
                  </button>
                  <button onClick={() => setIsLogin(false)} className={`flex-1 rounded-[1rem] py-2.5 text-sm font-medium transition ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                    {language === "sw" ? "Jisajili" : "Sign Up"}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  {!isLogin && (
                    <>
                      <div className="space-y-2">
                        <Label>{language === "sw" ? "Jina Kamili" : "Full Name"}</Label>
                        <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-12 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "sw" ? "Jina la Duka" : "Shop Name"}</Label>
                        <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="h-12 rounded-2xl" />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-2xl" required />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Nenosiri" : "Password"}</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="********" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12 rounded-2xl pr-11" required minLength={6} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {isLogin && (
                      <button type="button" onClick={() => { setResetEmail(form.email); setForgotOpen(true); }} className="text-sm text-primary hover:text-primary/80">
                        {language === "sw" ? "Umesahau nenosiri?" : "Forgot password?"}
                      </button>
                    )}
                  </div>

                  <Button type="submit" className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-base font-semibold" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                      {isLogin ? language === "sw" ? "Ingia" : "Sign In" : language === "sw" ? "Fungua Akaunti" : "Create Account"}
                      <ArrowRight className="h-4 w-4" />
                    </>}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.section>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-[1.75rem]">
          <DialogHeader>
            <DialogTitle>{language === "sw" ? "Badilisha Nenosiri" : "Reset Password"}</DialogTitle>
            <DialogDescription>
              {language === "sw"
                ? "Ingiza barua pepe yako. Tutakutumia kiungo cha kubadilisha nenosiri."
                : "Enter your email. We'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
              <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="h-12 rounded-2xl" required />
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={resetLoading}>
              {resetLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : language === "sw" ? "Tuma Kiungo" : "Send reset link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
