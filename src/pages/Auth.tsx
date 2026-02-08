import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowRight, Store, ShieldCheck, BarChart3, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const features = [
  { icon: Store, label: "POS & Sales", labelSw: "Mauzo na POS" },
  { icon: BarChart3, label: "Reports & Analytics", labelSw: "Ripoti na Uchambuzi" },
  { icon: ShieldCheck, label: "Inventory Control", labelSw: "Udhibiti wa Stoki" },
  { icon: Smartphone, label: "Works Offline", labelSw: "Inafanya Kazi Nje ya Mtandao" },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { t, language } = useLanguage();
  const [showSplash, setShowSplash] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", shopName: "" });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) {
          toast.error(error.message.includes("Invalid login") ? (language === "sw" ? "Barua pepe au nenosiri si sahihi" : "Invalid email or password") : error.message);
        }
      } else {
        if (!form.fullName || !form.shopName) {
          toast.error(language === "sw" ? "Tafadhali jaza sehemu zote" : "Please fill in all fields");
          setLoading(false);
          return;
        }
        const { error } = await signUp(form.email, form.password, form.fullName, form.shopName);
        if (error) {
          toast.error(error.message.includes("already registered") ? (language === "sw" ? "Barua pepe imesajiliwa. Tafadhali ingia." : "Email already registered. Please sign in.") : error.message);
        } else {
          toast.success(language === "sw" ? "Akaunti imeundwa! Angalia barua pepe yako au ingia." : "Account created! Check your email to verify, or sign in.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex flex-col items-center">
          <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.2, duration: 0.7, type: "spring" }}
            className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-2xl">
            <Store className="h-14 w-14 text-white" />
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-white">Smart Money</motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-2 text-lg text-white/80">{language === "sw" ? "Mfumo wa Biashara" : "Retail Management"}</motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-8 h-1.5 w-48 rounded-full bg-white/30 overflow-hidden">
            <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ delay: 1.3, duration: 1.2, ease: "easeInOut" }}
              className="h-full w-1/2 rounded-full bg-white" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex">
      {/* Left - Branding panel (hidden on mobile) */}
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Smart Money</span>
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              {language === "sw" ? "Simamia biashara yako kwa urahisi" : "Manage your business with ease"}
            </h2>
            <p className="mt-4 text-lg text-white/70">
              {language === "sw" ? "Mfumo kamili wa POS, hesabu, na ripoti kwa biashara yako." : "Complete POS, inventory, and reporting system for your shop."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <f.icon className="h-5 w-5 text-white/90" />
                <span className="text-sm font-medium text-white/90">{language === "sw" ? f.labelSw : f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/50">© 2026 Smart Money. {language === "sw" ? "Haki zote zimehifadhiwa." : "All rights reserved."}</p>
      </motion.div>

      {/* Right - Auth form */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-background p-6 md:p-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Store className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Smart Money</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? (language === "sw" ? "Ingia kwenye akaunti yako" : "Welcome back") : (language === "sw" ? "Fungua akaunti mpya" : "Create your account")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isLogin ? (language === "sw" ? "Endelea na biashara yako" : "Sign in to continue") : (language === "sw" ? "Anza kusimamia biashara yako" : "Get started with your shop")}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              {language === "sw" ? "Ingia" : "Sign In"}
            </button>
            <button onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${!isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              {language === "sw" ? "Jisajili" : "Sign Up"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div key="signup" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-4 overflow-hidden">
                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Jina Kamili" : "Full Name"}</Label>
                    <Input placeholder={language === "sw" ? "mf. Juma Hassan" : "e.g. John Doe"} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "sw" ? "Jina la Duka" : "Shop Name"}</Label>
                    <Input placeholder={language === "sw" ? "mf. Duka la Vifaa vya Ujenzi" : "e.g. My Hardware Shop"} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="h-12 rounded-xl" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label>{language === "sw" ? "Barua Pepe" : "Email"}</Label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-xl" required />
            </div>

            <div className="space-y-2">
              <Label>{language === "sw" ? "Nenosiri" : "Password"}</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12 rounded-xl pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full gap-2 rounded-xl text-base font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  {isLogin ? (language === "sw" ? "Ingia" : "Sign In") : (language === "sw" ? "Fungua Akaunti" : "Create Account")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
