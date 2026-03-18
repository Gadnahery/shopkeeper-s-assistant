import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, Store } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function needsShopSetup(fullName: string | null | undefined, shopName: string | null | undefined) {
  const normalizedFullName = (fullName || "").trim().toLowerCase();
  const normalizedShopName = (shopName || "").trim().toLowerCase();

  return (
    !normalizedFullName ||
    !normalizedShopName ||
    normalizedFullName === "shop owner" ||
    normalizedFullName === "staff" ||
    normalizedShopName === "my shop"
  );
}

export default function GoogleOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", shopName: "" });

  const intent = searchParams.get("intent");
  const profileShopName = profile?.shops?.name ?? "";
  const oauthName =
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";
  const oauthShopName =
    typeof user?.user_metadata?.shop_name === "string" ? user.user_metadata.shop_name : "";

  const requiresSetup = useMemo(() => {
    if (intent === "signup") return true;
    return needsShopSetup(profile?.full_name, profileShopName);
  }, [intent, profile?.full_name, profileShopName]);

  useEffect(() => {
    if (!loading && user && !profile) {
      void refreshProfile();
    }
  }, [loading, profile, refreshProfile, user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!loading && user && profile && !requiresSetup) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, navigate, profile, requiresSetup, user]);

  useEffect(() => {
    setForm((current) => ({
      fullName: current.fullName || (needsShopSetup(profile?.full_name, profileShopName) ? oauthName : profile?.full_name || oauthName),
      shopName: current.shopName || (profileShopName && profileShopName.toLowerCase() !== "my shop" ? profileShopName : oauthShopName),
    }));
  }, [oauthName, oauthShopName, profile?.full_name, profileShopName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !profile?.shop_id) {
      toast.error(language === "sw" ? "Akaunti haijakamilika bado. Tafadhali jaribu tena." : "Your account is still loading. Please try again.");
      return;
    }
    if (!form.fullName.trim() || !form.shopName.trim()) {
      toast.error(language === "sw" ? "Jaza jina lako na jina la duka." : "Enter your full name and shop name.");
      return;
    }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.fullName.trim(),
          email: user.email ?? profile.email ?? null,
        })
        .eq("user_id", user.id)
        .eq("shop_id", profile.shop_id);
      if (profileError) throw profileError;

      const { error: shopError } = await supabase
        .from("shops")
        .update({
          name: form.shopName.trim(),
          email: user.email ?? null,
        })
        .eq("id", profile.shop_id);
      if (shopError) throw shopError;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: form.fullName.trim(),
          shop_name: form.shopName.trim(),
        },
      });
      if (authError) throw authError;

      await refreshProfile();
      toast.success(language === "sw" ? "Taarifa za duka zimehifadhiwa." : "Shop details saved.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === "sw" ? "Imeshindikana kuhifadhi taarifa." : "Could not save your details."));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_32%)]">
      <div className="flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <Card className="rounded-[2rem] border border-border/60 bg-card/92 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <CardHeader className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {language === "sw" ? "Kamilisha maelezo ya duka lako" : "Complete your shop details"}
                </CardTitle>
                <CardDescription className="mt-2 text-sm">
                  {language === "sw"
                    ? "Umeingia kwa Google. Kabla ya kuendelea, weka jina lako na jina la duka kama unavyotaka yaonekane kwenye WiseCash."
                    : "You signed in with Google. Before continuing, add your name and your shop name the way you want them to appear in WiseCash."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label>{language === "sw" ? "Jina Kamili" : "Full Name"}</Label>
                  <Input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="h-12 rounded-2xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "sw" ? "Jina la Duka" : "Shop Name"}</Label>
                  <Input
                    value={form.shopName}
                    onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
                    className="h-12 rounded-2xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 text-base font-semibold"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {language === "sw" ? "Endelea kwenye dashibodi" : "Continue to dashboard"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-medium text-primary hover:underline">
                  {language === "sw" ? "Rudi kwenye kuingia" : "Back to login"}
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
