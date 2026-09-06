import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, Store, ShoppingBag, Scissors, Layers, Boxes, Factory, Pill } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type BusinessType, getCapabilitiesForBusinessType } from "@/lib/businessCapabilities";

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

const BUSINESS_TYPE_OPTIONS: Array<{
  id: BusinessType;
  icon: typeof ShoppingBag;
  titleEn: string;
  titleSw: string;
  descEn: string;
  descSw: string;
}> = [
  {
    id: "retail",
    icon: ShoppingBag,
    titleEn: "Retail & Physical Goods",
    titleSw: "Duka la Rejareja / Bidhaa",
    descEn: "POS, barcodes, stock inventory",
    descSw: "POS, barcode, usimamizi wa stoki",
  },
  {
    id: "service",
    icon: Scissors,
    titleEn: "Services & Appointments",
    titleSw: "Huduma na Miadi",
    descEn: "Salon, clinic, repairs, bookings",
    descSw: "Saluni, kliniki, ukarabati, miadi",
  },
  {
    id: "hybrid",
    icon: Layers,
    titleEn: "Hybrid (Both)",
    titleSw: "Mchanganyiko (Bidhaa & Huduma)",
    descEn: "Sell goods and book services together",
    descSw: "Uza bidhaa na toa huduma kwa pamoja",
  },
  {
    id: "wholesale",
    icon: Boxes,
    titleEn: "Wholesale & Distribution",
    titleSw: "Biashara ya Jumla",
    descEn: "Bulk orders, customer credit accounts",
    descSw: "Mauzo ya jumla, akaunti za mikopo",
  },
  {
    id: "manufacturing",
    icon: Factory,
    titleEn: "Production & Workshop",
    titleSw: "Uzalishaji & Karakana",
    descEn: "Raw materials, batches, finished goods",
    descSw: "Malighafi, batches, bidhaa zilizokamilika",
  },
  {
    id: "pharmacy",
    icon: Pill,
    titleEn: "Pharmacy & Health",
    titleSw: "Duka la Dawa / Famasi",
    descEn: "Batch numbers and expiry date alerts",
    descSw: "Namba za batch na tahadhari za tarehe ya mwisho",
  },
];

export default function GoogleOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>("retail");
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
      const capabilities = getCapabilitiesForBusinessType(businessType);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.fullName.trim(),
        })
        .eq("user_id", user.id)
        .eq("shop_id", profile.shop_id);
      if (profileError) throw profileError;

      const { error: shopError } = await supabase
        .from("shops")
        .update({
          name: form.shopName.trim(),
          email: user.email ?? null,
          business_type: businessType,
          capabilities,
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl"
      >
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {language === "sw" ? "Kamilisha maelezo ya biashara yako" : "Set up your business"}
              </CardTitle>
              <CardDescription className="mt-1 text-xs text-muted-foreground">
                {language === "sw"
                  ? "Chagua aina ya biashara na maelezo ya duka lako ili kuanza kutumia WiseCash."
                  : "Choose your business type and name to customize your WiseCash workspace."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Jina Kamili" : "Full Name"}</Label>
                  <Input
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="h-10 rounded-xl border-border bg-background text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Duka / Biashara" : "Business Name"}</Label>
                  <Input
                    value={form.shopName}
                    onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
                    className="h-10 rounded-xl border-border bg-background text-xs"
                    required
                  />
                </div>
              </div>

              {/* Business Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {language === "sw" ? "Aina ya Biashara Yako" : "What kind of business do you run?"}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = businessType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBusinessType(opt.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">
                            {language === "sw" ? opt.titleSw : opt.titleEn}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug truncate">
                            {language === "sw" ? opt.descSw : opt.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full gap-2 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {language === "sw" ? "Kamilisha na Uingie Kwenye Dashibodi" : "Launch My Workspace"}
                    <ArrowRight className="h-4 w-4 text-accent" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                {language === "sw" ? "Rudi kwenye kuingia" : "Back to login"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
