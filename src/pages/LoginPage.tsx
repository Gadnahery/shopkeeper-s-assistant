import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/passwordRecovery";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("deleted") === "true") {
      toast.error(
        language === "sw"
          ? "Akaunti hii haipo au imefutwa."
          : "This account does not exist or has been deleted."
      );
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(form.email, form.password);
      if (error) {
        if (
          error.message === "ACCOUNT_DOES_NOT_EXIST" ||
          error.message.includes("ACCOUNT_DOES_NOT_EXIST")
        ) {
          toast.error(
            language === "sw"
              ? "Akaunti hii haipo au imefutwa."
              : "This account does not exist or has been deleted."
          );
          return;
        }

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
      setForgotMode(false);
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle("login");
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
            {forgotMode
              ? language === "sw"
                ? "Rejesha Nenosiri"
                : "Reset Password"
              : language === "sw"
              ? "Ingia Kwenye Akaunti Yako"
              : "Log In to Your Workspace"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {forgotMode
              ? language === "sw"
                ? "Weka barua pepe yako kupokea kiungo cha kurejesha nenosiri."
                : "Enter your email to receive password recovery instructions."
              : language === "sw"
              ? "Mfumo kamili wa ERP na POS wa biashara yako."
              : "Small-business ERP & POS management system."}
          </p>
        </div>

        {/* Forgot Password Sub-flow */}
        {forgotMode ? (
          <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe" : "Email Address"}</Label>
              <Input
                type="email"
                required
                placeholder="owner@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              />
            </div>

            <Button
              type="submit"
              disabled={resetLoading || !resetEmail.trim()}
              className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{language === "sw" ? "Tuma Kiungo cha Kurejesha" : "Send Reset Link"}</span>
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {language === "sw" ? "← Rudi kwenye kuingia" : "← Back to Login"}
              </button>
            </div>
          </form>
        ) : (
          /* Normal Login Form */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe" : "Email Address"}</Label>
              <Input
                type="email"
                required
                placeholder="owner@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{language === "sw" ? "Nenosiri" : "Password"}</Label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-accent"
                >
                  {language === "sw" ? "Umesahau?" : "Forgot?"}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background pr-10 text-xs focus-visible:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              <span>{language === "sw" ? "Ingia Sasa" : "Log In"}</span>
            </Button>

            {/* Divider */}
            <div className="relative my-4">
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
              mode="login"
              language={language}
              loading={googleLoading}
              onClick={handleGoogleLogin}
            />

            {/* Switch to Signup */}
            <div className="pt-3 text-center text-xs text-muted-foreground">
              {language === "sw" ? "Huna akaunti bado? " : "Don't have an account? "}
              <Link to="/signup" className="font-bold text-foreground hover:underline">
                {language === "sw" ? "Jisajili Bure" : "Sign Up"}
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
