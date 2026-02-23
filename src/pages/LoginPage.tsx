import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, Store, BarChart3, Receipt } from "lucide-react";
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

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

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
        redirectTo: `${window.location.origin}/reset-password`,
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

  const formVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4 },
    }),
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Left - Animation panel */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 p-12"
      >
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/" className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-sm transition-colors hover:bg-white/15">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Smart Money</span>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-3xl font-bold text-white">
              {language === "sw" ? "Karibu tena" : "Welcome Back"}
            </h2>
            <p className="mt-3 text-lg text-white/80">
              {language === "sw"
                ? "Ingia kuendelea na biashara yako."
                : "Sign in to continue managing your business."}
            </p>
          </motion.div>
          {/* Floating cards - more rounded */}
          <div className="relative h-48">
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 top-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm"
            >
              <BarChart3 className="h-10 w-10 text-white" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0], rotate: [0, -1, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute right-8 top-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm"
            >
              <Receipt className="h-8 w-8 text-white" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-4 left-1/3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg backdrop-blur-sm"
            >
              <Store className="h-7 w-7 text-white" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right - Login form in rounded card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gradient-to-b from-slate-50/80 to-muted/30 p-4 md:p-8 dark:from-background dark:to-muted/20"
      >
        <div className="mb-6 flex flex-col items-center lg:hidden">
          <Link to="/" className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Smart Money</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-[2rem] border border-border/50 bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-sm md:p-10"
        >
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-bold text-foreground"
          >
            {language === "sw" ? "Ingia kwenye akaunti yako" : "Welcome Back"}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-1 text-muted-foreground"
          >
            {language === "sw" ? "Endelea na biashara yako" : "Continue with your business"}
          </motion.p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <motion.div custom={0} variants={formVariants} initial="hidden" animate="visible" className="space-y-2">
              <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 rounded-2xl border-2 border-border/50 transition-all focus-visible:ring-2 focus-visible:ring-teal-500/30"
                required
              />
            </motion.div>

            <motion.div custom={1} variants={formVariants} initial="hidden" animate="visible" className="space-y-2">
              <Label>{language === "sw" ? "Nenosiri" : "Password"}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 rounded-2xl border-2 border-border/50 pr-10 transition-all focus-visible:ring-2 focus-visible:ring-teal-500/30"
                  required
                  minLength={6}
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </motion.button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(form.email);
                  setForgotOpen(true);
                }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {language === "sw" ? "Umesahau nenosiri?" : "Forgot password?"}
              </button>
            </motion.div>

            <motion.div
              custom={2}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-base font-semibold shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl hover:shadow-teal-500/30"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {language === "sw" ? "Ingia" : "Login"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            {language === "sw" ? "Hauna akaunti?" : "Don't have an account?"}{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              {language === "sw" ? "Jisajili" : "Sign up"}
            </Link>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-center"
          >
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← {language === "sw" ? "Rudi kwenye ukurasa wa kwanza" : "Back to home"}
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 shadow-2xl">
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
                className="h-12 rounded-2xl border-2"
                required
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={resetLoading}>
              {resetLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                language === "sw" ? "Tuma Kiungo" : "Send reset link"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
