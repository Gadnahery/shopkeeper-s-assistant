import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/passwordRecovery";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function ForgotPassword() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const message = await requestPasswordReset(email, language);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-3 inline-block">
            <BrandLogo size="lg" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {language === "sw" ? "Umesahau Nenosiri?" : "Forgot Password?"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {language === "sw"
              ? "Weka barua pepe yako na tutakutumia kiungo cha kurejesha nenosiri."
              : "Enter your email address and we'll send you a password reset link."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{language === "sw" ? "Barua Pepe" : "Email Address"}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              className="h-10 rounded-xl border-border bg-background text-xs focus-visible:ring-accent"
              required
            />
          </div>

          <Button type="submit" className="h-10 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            <span>{language === "sw" ? "Tuma Kiungo cha Kurejesha" : "Send Reset Link"}</span>
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            <Link className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline" to="/login">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{language === "sw" ? "Rudi kwenye kuingia" : "Back to Login"}</span>
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
