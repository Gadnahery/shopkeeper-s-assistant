import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Eye, EyeOff, Loader2, Receipt, Store } from "lucide-react";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(form.email, form.password);
      if (error) {
        toast.error(
          error.message.includes("Invalid login")
            ? language === "sw"
              ? "Barua pepe au nenosiri si sahihi"
              : "Invalid email or password"
            : error.message
        );
      } else {
        navigate("/dashboard", { replace: true });
      }
    } finally {
      setLoading(false);
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
        <motion.section
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-teal-500 via-teal-600 to-blue-700 p-12 text-white"
        >
          <Link to="/" className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">WiseCash</span>
          </Link>

          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">
                {language === "sw" ? "Mfumo wa Kisasa wa Biashara" : "Modern Retail Workspace"}
              </p>
              <h1 className="max-w-lg text-4xl font-bold leading-tight">
                {language === "sw" ? "Karibu tena kwenye kituo chako cha biashara." : "Welcome back to your business command center."}
              </h1>
              <p className="max-w-lg text-lg text-white/78">
                {language === "sw"
                  ? "Endelea na mauzo, stoki, ripoti, na usimamizi wa duka lako katika muonekano mpya."
                  : "Continue with sales, inventory, reports, and daily shop management in a cleaner modern workspace."}
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-2 gap-4">
              {[
                { icon: BarChart3, label: language === "sw" ? "Ripoti za haraka" : "Fast reporting" },
                { icon: Receipt, label: language === "sw" ? "Mauzo ya kila siku" : "Daily sales flow" },
                { icon: Store, label: language === "sw" ? "Udhibiti wa duka" : "Store control" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.6rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <item.icon className="h-5 w-5" />
                  <p className="mt-6 text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/55">© 2026 WiseCash</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
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

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                {language === "sw" ? "Ingia kwenye akaunti yako" : "Sign in to your workspace"}
              </h2>
              <p className="text-muted-foreground">
                {language === "sw" ? "Endelea kusimamia biashara yako." : "Continue managing your business."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-12 rounded-2xl text-foreground"
                  required
                />
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
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(form.email);
                    setForgotOpen(true);
                  }}
                  className="text-sm text-primary transition-colors hover:text-primary/80"
                >
                  {language === "sw" ? "Umesahau nenosiri?" : "Forgot password?"}
                </button>
              </div>

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-base font-semibold"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                  {language === "sw" ? "Ingia" : "Login"}
                  <ArrowRight className="h-4 w-4" />
                </>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {language === "sw" ? "Hauna akaunti?" : "Don't have an account?"}{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                {language === "sw" ? "Jisajili" : "Sign up"}
              </Link>
            </p>

            <p className="mt-4 text-center">
              <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {"<-"} {language === "sw" ? "Rudi kwenye ukurasa wa kwanza" : "Back to home"}
              </Link>
            </p>
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
          <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-12 rounded-2xl text-foreground"
                required
              />
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
