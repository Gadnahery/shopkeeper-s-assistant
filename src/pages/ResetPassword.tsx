import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { checkPasswordStrength } from "@/lib/validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function ResetPassword() {
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPasswordStrength(password).suggestions.length > 0) {
      toast.error(
        language === "sw"
          ? "Nenosiri liwe na angalau herufi 8, litumie herufi kubwa na ndogo, namba, na alama."
          : "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.",
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === "sw" ? "Nenosiri halilingani" : "Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(language === "sw" ? "Nenosiri limesasishwa kikamilifu" : "Password updated successfully");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-3 inline-block">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {language === "sw" ? "Weka Nenosiri Jipya" : "Reset Password"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "sw"
              ? "Chagua nenosiri jipya na salama kwa ajili ya akaunti yako."
              : "Choose a strong new password for your account."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{language === "sw" ? "Nenosiri Jipya" : "New Password"}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{language === "sw" ? "Thibitisha Nenosiri" : "Confirm Password"}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            <span>{language === "sw" ? "Badilisha Nenosiri" : "Update Password"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
