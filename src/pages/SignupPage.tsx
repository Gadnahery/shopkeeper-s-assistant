import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, Store, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      toast.error(
        language === "sw" ? "Nenosiri halilingani" : "Passwords do not match"
      );
      return;
    }
    if (!form.fullName || !form.shopName) {
      toast.error(language === "sw" ? "Tafadhali jaza sehemu zote" : "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(
        form.email,
        form.password,
        form.fullName,
        form.shopName
      );
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

  const formVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.35 },
    }),
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Left - Animation panel */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-gradient-to-br from-teal-500 via-blue-600 to-violet-600 p-12"
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
              {language === "sw" ? "Fungua Akaunti" : "Create Account"}
            </h2>
            <p className="mt-3 text-lg text-white/80">
              {language === "sw"
                ? "Jiunge na Smart Money na anza kusimamia biashara yako leo."
                : "Join Smart Money and start managing your business today."}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right - Signup form in rounded card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gradient-to-b from-slate-50/80 to-muted/30 p-4 md:p-8 overflow-y-auto dark:from-background dark:to-muted/20"
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
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="rounded-3xl bg-muted/20 py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 ring-4 ring-green-500/10"
                >
                  <CheckCircle2 className="h-14 w-14 text-green-600 dark:text-green-400" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-2xl font-bold text-foreground"
                >
                  {language === "sw" ? "Akaunti Imeundwa!" : "Account Created!"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-2 text-muted-foreground"
                >
                  {language === "sw"
                    ? "Angalia barua pepe yako kuthibitisha, au ingia sasa."
                    : "Check your email to verify, or sign in now."}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    asChild
                    className="mt-8 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 shadow-lg"
                  >
                    <Link to="/login">
                      {language === "sw" ? "Ingia" : "Sign In"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-foreground"
                >
                  {language === "sw" ? "Fungua akaunti mpya" : "Create your account"}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38 }}
                  className="mt-1 text-muted-foreground"
                >
                  {language === "sw" ? "Anza kusimamia biashara yako" : "Get started with your shop"}
                </motion.p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  {[
                    { label: language === "sw" ? "Jina Kamili" : "Full Name", value: form.fullName, onChange: (v: string) => setForm((f) => ({ ...f, fullName: v })), placeholder: language === "sw" ? "mf. Juma Hassan" : "e.g. John Doe" },
                    { label: language === "sw" ? "Jina la Duka" : "Shop Name", value: form.shopName, onChange: (v: string) => setForm((f) => ({ ...f, shopName: v })), placeholder: language === "sw" ? "mf. Duka la Vifaa" : "e.g. My Hardware Shop" },
                    { label: language === "sw" ? "Barua Pepe" : "Email", value: form.email, onChange: (v: string) => setForm((f) => ({ ...f, email: v })), placeholder: "you@example.com", type: "email" as const },
                  ].map((field, i) => (
                    <motion.div key={field.label} custom={i} variants={formVariants} initial="hidden" animate="visible" className="space-y-2">
                      <Label>{field.label}</Label>
                      <Input
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-12 rounded-2xl border-2 border-border/50 transition-all focus-visible:ring-2 focus-visible:ring-teal-500/30"
                        required
                      />
                    </motion.div>
                  ))}
                  <motion.div custom={3} variants={formVariants} initial="hidden" animate="visible" className="space-y-2">
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
                  </motion.div>
                  <motion.div custom={4} variants={formVariants} initial="hidden" animate="visible" className="space-y-2">
                    <Label>{language === "sw" ? "Thibitisha Nenosiri" : "Confirm Password"}</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="h-12 rounded-2xl border-2 border-border/50 transition-all focus-visible:ring-2 focus-visible:ring-teal-500/30"
                      required
                      minLength={6}
                    />
                  </motion.div>

                  <motion.div
                    custom={5}
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
                          {language === "sw" ? "Fungua Akaunti" : "Create Account"}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 text-center text-sm text-muted-foreground"
                >
                  {language === "sw" ? "Tayari una akaunti?" : "Already have an account?"}{" "}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    {language === "sw" ? "Ingia" : "Log in"}
                  </Link>
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="mt-4 text-center"
                >
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← {language === "sw" ? "Rudi kwenye ukurasa wa kwanza" : "Back to home"}
                  </Link>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
