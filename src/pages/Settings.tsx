import { useState, useEffect } from "react";
import {
  Bell,
  Camera,
  CheckCircle2,
  DollarSign,
  Download,
  Globe,
  Loader2,
  Lock,
  Printer,
  QrCode,
  ScanLine,
  Shield,
  Smartphone,
  Store,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  History,
  RotateCcw,
  User,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { useDataResetLogs, useResetModule, useResetAllData, type ResettableModule } from "@/hooks/useDataReset";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useShopSettings, useUpdateShopSettings } from "@/hooks/useShopSettings";
import { usePWAContext } from "@/contexts/PWAContext";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { getCameraPermissionState, requestCameraPermission } from "@/lib/cameraPermissions";
import { SHOP_COUNTRY_OPTIONS, SHOP_CURRENCY_OPTIONS, SHOP_LOCALE_OPTIONS, getCountryByCode } from "@/lib/international";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";
import { type BusinessType, type CapabilityKey, resolveCapabilities } from "@/lib/businessCapabilities";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { profile, shopId, isOwner } = useAuth();
  const { data: shopSettings, isLoading } = useShopSettings();
  const updateSettings = useUpdateShopSettings();
  const { canInstall, install, isInstalled } = usePWAContext();
  const { isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  const [activeTab, setActiveTab] = useState("shop");

  // Data Management & Reset State (Restricted to Shop Owner)
  const [selectedModule, setSelectedModule] = useState<ResettableModule>("sales");
  const [moduleConfirmText, setModuleConfirmText] = useState("");
  const [fullResetConfirmText, setFullResetConfirmText] = useState("");

  const resetModuleMutation = useResetModule();
  const resetAllDataMutation = useResetAllData();
  const { data: resetLogs, isLoading: resetLogsLoading } = useDataResetLogs();

  const handleModuleReset = async () => {
    if (moduleConfirmText.trim().toUpperCase() !== selectedModule.toUpperCase()) {
      toast.error(language === "sw" ? "Neno la uthibitisho halilingani" : "Confirmation word does not match");
      return;
    }
    try {
      await resetModuleMutation.mutateAsync(selectedModule);
      toast.success(
        language === "sw"
          ? `Moduli ya ${selectedModule.toUpperCase()} imefutwa kikamilifu`
          : `Module ${selectedModule.toUpperCase()} data reset successfully`
      );
      setModuleConfirmText("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset module data");
    }
  };

  const handleFullReset = async () => {
    const expectedShopName = shopForm.shop_name.trim();
    if (fullResetConfirmText.trim().toLowerCase() !== expectedShopName.toLowerCase()) {
      toast.error(language === "sw" ? "Jina la duka halilingani" : "Shop name confirmation does not match");
      return;
    }
    try {
      await resetAllDataMutation.mutateAsync();
      toast.success(
        language === "sw"
          ? "Data zote za biashara zimefutwa. Duka liko tayari kuanza upya!"
          : "All business data has been reset. Your shop is ready to start fresh!"
      );
      setFullResetConfirmText("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to perform full reset");
    }
  };
  const [shopForm, setShopForm] = useState({
    shop_name: "",
    phone: "",
    address: "",
    currency: "TZS",
    locale: "sw-TZ",
    country_code: "TZ",
  });
  const [businessType, setBusinessType] = useState<BusinessType>("retail");
  const [capabilities, setCapabilities] = useState<Record<CapabilityKey, boolean>>(resolveCapabilities(null));

  const [receiptForm, setReceiptForm] = useState({
    receipt_header: "",
    receipt_footer: "",
    logo_url: "",
    tax_rate: "0",
  });

  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [cameraState, setCameraState] = useState<string>("unknown");

  useEffect(() => {
    if (!shopSettings) return;

    setShopForm({
      shop_name: shopSettings.name || "",
      phone: shopSettings.phone || "",
      address: shopSettings.address || "",
      currency: shopSettings.currency || "TZS",
      locale: shopSettings.locale || "sw-TZ",
      country_code: shopSettings.country_code || "TZ",
    });
    setBusinessType((shopSettings.business_type as BusinessType) || "retail");
    setCapabilities(resolveCapabilities(shopSettings.capabilities));

    const settings = shopSettings as any;
    const caps = (shopSettings?.capabilities && typeof shopSettings.capabilities === "object")
      ? (shopSettings.capabilities as Record<string, any>)
      : {};
    setReceiptForm({
      receipt_header: settings.receipt_header || "",
      receipt_footer: settings.receipt_footer || "",
      logo_url: settings.logo_url || "",
      tax_rate: String(settings.tax_rate || 0),
    });

    setEnableLowStockAlerts(settings.enable_low_stock_alerts ?? caps.enable_low_stock_alerts ?? true);
    setAutoPrintReceipt(settings.auto_print_receipt ?? caps.auto_print_receipt ?? false);
  }, [shopSettings]);

  useEffect(() => {
    getCameraPermissionState().then((r) => setCameraState(r.state));
  }, []);

  if (shopSettings === undefined || isLoading) {
    return <PageLoader message="Loading settings..." messageSw="Inapakia mipangilio..." language={language} />;
  }

  const handleSaveShop = async () => {
    if (!shopId) return;
    try {
      await supabase
        .from("shops")
        .update({
          name: shopForm.shop_name,
          phone: shopForm.phone,
          address: shopForm.address,
          currency: shopForm.currency,
          locale: shopForm.locale,
          country_code: shopForm.country_code,
          business_type: businessType,
          capabilities,
        })
        .eq("id", shopId);

      await updateSettings.mutateAsync({
        name: shopForm.shop_name,
        phone: shopForm.phone,
        address: shopForm.address,
      });

      toast.success(language === "sw" ? "Taarifa za duka zimehifadhiwa" : "Shop details saved successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save shop settings");
    }
  };

  const handleSaveReceipt = async () => {
    if (!shopId) return;
    try {
      const currentCaps = (shopSettings?.capabilities && typeof shopSettings.capabilities === "object")
        ? (shopSettings.capabilities as Record<string, any>)
        : {};
      const updatedCaps = { ...currentCaps, auto_print_receipt: autoPrintReceipt };

      await supabase
        .from("shops")
        .update({
          receipt_header: receiptForm.receipt_header || null,
          receipt_footer: receiptForm.receipt_footer || null,
          logo_url: receiptForm.logo_url || null,
          tax_rate: parseFloat(receiptForm.tax_rate) || 0,
          capabilities: updatedCaps as any,
          auto_print_receipt: autoPrintReceipt,
        })
        .eq("id", shopId);

      toast.success(language === "sw" ? "Mipangilio ya risiti imehifadhiwa" : "Receipt template saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save receipt settings");
    }
  };

  const handleToggleAutoPrint = async (checked: boolean) => {
    setAutoPrintReceipt(checked);
    if (!shopId) return;
    try {
      const currentCaps = (shopSettings?.capabilities && typeof shopSettings.capabilities === "object")
        ? (shopSettings.capabilities as Record<string, any>)
        : {};
      const updatedCaps = { ...currentCaps, auto_print_receipt: checked };

      await supabase
        .from("shops")
        .update({
          capabilities: updatedCaps as any,
          auto_print_receipt: checked,
        })
        .eq("id", shopId);
    } catch {
      // silently handle, save button can also persist
    }
  };

  const handleToggleLowStockAlerts = async (checked: boolean) => {
    setEnableLowStockAlerts(checked);
    if (!shopId) return;
    try {
      const currentCaps = (shopSettings?.capabilities && typeof shopSettings.capabilities === "object")
        ? (shopSettings.capabilities as Record<string, any>)
        : {};
      const updatedCaps = { ...currentCaps, enable_low_stock_alerts: checked };

      await supabase
        .from("shops")
        .update({
          capabilities: updatedCaps as any,
          enable_low_stock_alerts: checked,
        })
        .eq("id", shopId);
      toast.success(language === "sw" ? "Mipangilio ya tahadhari imesasishwa" : "Stock alert setting updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update alert setting");
    }
  };

  const handleProfileUpload = async (url: string) => {
    if (!profile?.id) return;
    try {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
      toast.success(language === "sw" ? "Picha ya wasifu imesasishwa" : "Profile photo updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile photo");
    }
  };

  const handleTestCamera = async () => {
    const res = await requestCameraPermission();
    setCameraState(res.state);
    if (res.state === "granted") {
      toast.success(language === "sw" ? "Kamera inafanya kazi kikamilifu" : "Camera access granted");
    } else {
      toast.error(language === "sw" ? "Ruhusa ya kamera haijatolewa" : "Camera access denied or unavailable");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly Quick Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Lugha ya Mfumo" : "Language"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Globe className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{language === "sw" ? "Kiswahili" : "English"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Chaguo-msingi" : "System default"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Sarafu ya Duka" : "Currency"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{shopForm.currency}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{shopForm.country_code} ({shopForm.locale})</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Ujumbe wa Push" : "Push Alerts"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Bell className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {isSubscribed ? (language === "sw" ? "Imewashwa" : "Active") : (language === "sw" ? "Imezimwa" : "Disabled")}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Tahadhari za simu" : "Device notifications"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Hali ya App" : "App Status"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Smartphone className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {isInstalled ? "PWA Installed" : "Web Online"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Version 2.4.0</p>
          </div>
        </Card>
      </div>

      {/* Main Settings Card */}
      <Card className="border border-border bg-card shadow-xs">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-border p-4">
            <TabsList className="bg-muted p-1 rounded-xl">
              <TabsTrigger value="shop" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {language === "sw" ? "Duka na Wasifu" : "Shop & Profile"}
              </TabsTrigger>
              <TabsTrigger value="receipt" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {language === "sw" ? "Risiti na Nembo" : "Receipt & Logo"}
              </TabsTrigger>
              <TabsTrigger value="hardware" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {language === "sw" ? "Vifaa na Kamera" : "Hardware & Devices"}
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                {language === "sw" ? "Mfumo na PWA" : "System & PWA"}
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger
                  value="data"
                  className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-destructive data-[state=active]:shadow-xs text-destructive/80 hover:text-destructive flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{language === "sw" ? "Usimamizi wa Data" : "Data Management"}</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* TAB 1: Shop & Profile */}
          <TabsContent value="shop" className="m-0 p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <ImageUpload
                currentUrl={profile?.avatar_url}
                bucket="avatars"
                folder={shopId || "default"}
                onUpload={handleProfileUpload}
                variant="avatar"
              />
              <div>
                <h3 className="text-base font-bold text-foreground">{profile?.full_name || "Business Owner"}</h3>
                <p className="text-xs text-muted-foreground">{profile?.phone || "owner@wisecash.app"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Duka / Biashara *" : "Shop Name *"}</Label>
                <Input
                  value={shopForm.shop_name}
                  onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Nambari ya Simu" : "Phone Number"}</Label>
                <Input
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">{language === "sw" ? "Anwani ya Duka" : "Shop Address / Location"}</Label>
                <Input
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Lugha ya Mfumo" : "System Language"}</Label>
                <Select value={language} onValueChange={(v: "en" | "sw") => setLanguage(v)}>
                  <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="sw">Kiswahili (Chaguo-msingi)</SelectItem>
                    <SelectItem value="en">English (US / UK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Nchi ya Biashara" : "Business Country / Nation"}</Label>
                <Select
                  value={shopForm.country_code}
                  onValueChange={(val) => {
                    const country = getCountryByCode(val);
                    setShopForm({
                      ...shopForm,
                      country_code: val,
                      currency: country.currency,
                      locale: country.locale,
                    });
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl border-border bg-popover text-xs">
                    {SHOP_COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{c.flag}</span>
                          <span>{language === "sw" ? c.labelSw : c.label}</span>
                          <span className="text-muted-foreground text-[10px]">({c.currency})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Sarafu ya Biashara" : "Currency"}</Label>
                <Select value={shopForm.currency} onValueChange={(v) => setShopForm({ ...shopForm, currency: v })}>
                  <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    {SHOP_CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Aina ya Biashara" : "Business Type"}</Label>
                <Select value={businessType} onValueChange={(value: BusinessType) => setBusinessType(value)}>
                  <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="retail">{language === "sw" ? "Rejareja" : "Retail"}</SelectItem>
                    <SelectItem value="wholesale">{language === "sw" ? "Jumla" : "Wholesale"}</SelectItem>
                    <SelectItem value="service">{language === "sw" ? "Huduma" : "Service"}</SelectItem>
                    <SelectItem value="hybrid">{language === "sw" ? "Bidhaa na huduma" : "Products + services"}</SelectItem>
                    <SelectItem value="manufacturing">{language === "sw" ? "Uzalishaji" : "Manufacturing"}</SelectItem>
                    <SelectItem value="pharmacy">{language === "sw" ? "Duka la dawa" : "Pharmacy"}</SelectItem>
                    <SelectItem value="other">{language === "sw" ? "Nyingine" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">{language === "sw" ? "Moduli za biashara" : "Business modules"}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {language === "sw" ? "Onyesha tu zana ambazo biashara yako inatumia." : "Show only the tools your business uses."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {([
                  ["products", language === "sw" ? "Bidhaa" : "Products"],
                  ["services", language === "sw" ? "Huduma" : "Services"],
                  ["inventory", language === "sw" ? "Stoki" : "Inventory"],
                  ["purchases", language === "sw" ? "Manunuzi" : "Purchases"],
                  ["customers", language === "sw" ? "Wateja" : "Customers"],
                  ["appointments", language === "sw" ? "Miadi" : "Appointments"],
                  ["manufacturing", language === "sw" ? "Uzalishaji" : "Production"],
                  ["loyalty", language === "sw" ? "Uaminifu" : "Loyalty"],
                ] as [CapabilityKey, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                    <Label htmlFor={`capability-${key}`} className="text-xs font-medium">{label}</Label>
                    <Switch
                      id={`capability-${key}`}
                      checked={capabilities[key]}
                      onCheckedChange={(checked) => setCapabilities((current) => ({ ...current, [key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveShop} className="h-9 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-accent" />
                <span>{t("common.save")}</span>
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: Receipt & Logo */}
          <TabsContent value="receipt" className="m-0 p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === "sw" ? "Ujumbe wa Juu ya Risiti (Header)" : "Receipt Header"}</Label>
              <Textarea
                rows={2}
                value={receiptForm.receipt_header}
                onChange={(e) => setReceiptForm({ ...receiptForm, receipt_header: e.target.value })}
                placeholder="Karibu tena! / Welcome to our store!"
                className="rounded-xl border-border bg-background text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === "sw" ? "Ujumbe wa Chini ya Risiti (Footer)" : "Receipt Footer"}</Label>
              <Textarea
                rows={2}
                value={receiptForm.receipt_footer}
                onChange={(e) => setReceiptForm({ ...receiptForm, receipt_footer: e.target.value })}
                placeholder="Bidhaa zilizonunuliwa hazirudishwi / Goods once sold are not returnable."
                className="rounded-xl border-border bg-background text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === "sw" ? "Kiwango cha Kodi / VAT (%)" : "Tax Rate (%)"}</Label>
                <Input
                  type="number"
                  value={receiptForm.tax_rate}
                  onChange={(e) => setReceiptForm({ ...receiptForm, tax_rate: e.target.value })}
                  className="h-10 rounded-xl border-border bg-background text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">{language === "sw" ? "Chapisha risiti otomatiki" : "Auto-print receipt"}</p>
                  <p className="text-[11px] text-muted-foreground">{language === "sw" ? "Baada ya kukamilisha mauzo" : "Immediately on checkout"}</p>
                </div>
                <Switch checked={autoPrintReceipt} onCheckedChange={handleToggleAutoPrint} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveReceipt} className="h-9 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-accent" />
                <span>{language === "sw" ? "Hifadhi Risiti" : "Save Receipt"}</span>
              </Button>
            </div>
          </TabsContent>

          {/* TAB 3: Hardware & Devices */}
          <TabsContent value="hardware" className="m-0 p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs mb-1">
                    <Printer className="h-4 w-4 text-accent" />
                    <span>{language === "sw" ? "Printa ya Risiti" : "Thermal Receipt Printer"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {language === "sw" ? "Inatumia printa yoyote ya mfumo au Bluetooth/USB ESC/POS." : "Supports any standard USB/Bluetooth thermal printer."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(language === "sw" ? "Printa iko tayari" : "Printer ready")}
                  className="mt-4 h-8 rounded-xl text-xs"
                >
                  {language === "sw" ? "Jaribu Printa" : "Test Printer"}
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs mb-1">
                    <Camera className="h-4 w-4 text-accent" />
                    <span>{language === "sw" ? "Kamera ya Simu / Barcode Scanner" : "Camera Barcode Scanner"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Status: <span className="font-semibold text-foreground capitalize">{cameraState}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestCamera}
                  className="mt-4 h-8 rounded-xl text-xs"
                >
                  {language === "sw" ? "Ruhusu / Kagua Kamera" : "Check Camera Permission"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: System & PWA */}
          <TabsContent value="system" className="m-0 p-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <p className="text-xs font-semibold text-foreground">{language === "sw" ? "Tahadhari za Stoki Ndogo" : "Low Stock Notifications"}</p>
                <p className="text-[11px] text-muted-foreground">{language === "sw" ? "Pokea taarifa bidhaa zikikaribia kuisha" : "Alert when items reach threshold"}</p>
              </div>
              <Switch checked={enableLowStockAlerts} onCheckedChange={handleToggleLowStockAlerts} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <p className="text-xs font-semibold text-foreground">{language === "sw" ? "Ujumbe wa Push (Device Push)" : "Device Push Alerts"}</p>
                <p className="text-[11px] text-muted-foreground">{language === "sw" ? "Pokea tahadhari hata app ikiwa imefungwa" : "Receive alerts in background"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
                className="h-8 rounded-xl text-xs"
              >
                {isSubscribed ? (language === "sw" ? "Zima Push" : "Disable") : (language === "sw" ? "Washa Push" : "Enable")}
              </Button>
            </div>

            {canInstall && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">{language === "sw" ? "Sakinisha App Kwenye Kifaa" : "Install App to Device"}</p>
                  <p className="text-[11px] text-muted-foreground">{language === "sw" ? "Tumia WiseCash kama app halisi ya simu au kompyuta" : "Run offline with standalone app"}</p>
                </div>
                <Button onClick={install} className="h-8 rounded-xl bg-primary text-xs text-primary-foreground">
                  <Download className="h-3.5 w-3.5 mr-1 text-accent" />
                  <span>{language === "sw" ? "Sakinisha" : "Install App"}</span>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 5: Data Management (Restricted to Owner) */}
          {isOwner && (
            <TabsContent value="data" className="m-0 p-6 space-y-6">
              {/* Informative Security Guarantee Banner */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3.5">
                <AlertOctagon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-foreground text-sm">
                    {language === "sw" ? "Eneo la Kufuta na Kuanza Upya Data ya Biashara" : "Shop Data Reset & Deletion Tools"}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === "sw"
                      ? "Sehemu hii inamruhusu mmiliki pekee kufuta data za moduli moja au data zote za kibiashara ili kuanza upya. Akaunti yako, nenosiri, majukumu ya wafanyakazi, mipangilio ya duka na usajili unaofanya kazi (subscription) HAUTAFUTWA kamwe."
                      : "This area allows the shop owner to wipe specific module data or clear all business records to start fresh. Your shop account, login credentials, staff roles, store settings, and active subscription will NEVER be deleted."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Module-by-Module Reset Card */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Trash2 className="h-4.5 w-4.5 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {language === "sw" ? "1. Futa Moduli Moja" : "1. Reset Single Module"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {language === "sw" ? "Chagua eneo moja unalotaka kufuta bila kuathiri mengine" : "Wipe data from a specific area without touching the rest"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold text-foreground">
                      {language === "sw" ? "Chagua Moduli ya Kufuta" : "Select Module to Reset"}
                    </Label>
                    <Select
                      value={selectedModule}
                      onValueChange={(val) => {
                        setSelectedModule(val as ResettableModule);
                        setModuleConfirmText("");
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-border bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">
                          {language === "sw" ? "Mauzo na Rasimu (Sales & Drafts)" : "Sales & Drafts (sales, sale_items)"}
                        </SelectItem>
                        <SelectItem value="inventory">
                          {language === "sw" ? "Bidhaa na Stoki (Inventory & Products)" : "Inventory & Products (products, stock_history)"}
                        </SelectItem>
                        <SelectItem value="purchases">
                          {language === "sw" ? "Manunuzi ya Bidhaa (Purchases)" : "Purchases (stock_received & items)"}
                        </SelectItem>
                        <SelectItem value="production">
                          {language === "sw" ? "Kazi za Uzalishaji (Production)" : "Production (production_batches)"}
                        </SelectItem>
                        <SelectItem value="customers">
                          {language === "sw" ? "Wateja na Madeni (Customers)" : "Customers & Receivables (customers, payments)"}
                        </SelectItem>
                        <SelectItem value="expenses">
                          {language === "sw" ? "Matumizi (Expenses)" : "Expenses (expenses)"}
                        </SelectItem>
                        <SelectItem value="suppliers">
                          {language === "sw" ? "Wasambazaji (Suppliers)" : "Suppliers (suppliers)"}
                        </SelectItem>
                        <SelectItem value="orders">
                          {language === "sw" ? "Oda za Wateja (Orders)" : "Customer Orders (orders & notes)"}
                        </SelectItem>
                        <SelectItem value="other_income">
                          {language === "sw" ? "Mapato Mengine (Other Income)" : "Other Income"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-xs space-y-2">
                    <p className="font-semibold text-foreground">
                      {language === "sw" ? "Uthibitisho wa lazima:" : "Deliberate Confirmation:"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === "sw"
                        ? `Kuthibitisha kufuta moduli hii, andika neno "${selectedModule.toUpperCase()}" hapa chini:`
                        : `To confirm deleting this module, type "${selectedModule.toUpperCase()}" below:`}
                    </p>
                    <Input
                      value={moduleConfirmText}
                      onChange={(e) => setModuleConfirmText(e.target.value)}
                      placeholder={`Type ${selectedModule.toUpperCase()}`}
                      className="h-9 rounded-xl border-border bg-background text-xs font-mono"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleModuleReset}
                    disabled={
                      resetModuleMutation.isPending ||
                      moduleConfirmText.trim().toUpperCase() !== selectedModule.toUpperCase()
                    }
                    className={cn(
                      "w-full h-9 rounded-xl text-xs font-bold gap-2 transition-all",
                      moduleConfirmText.trim().toUpperCase() === selectedModule.toUpperCase()
                        ? "border-destructive text-destructive hover:bg-destructive/10 cursor-pointer"
                        : "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {resetModuleMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{language === "sw" ? "Inafuta moduli..." : "Resetting module..."}</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>
                          {language === "sw"
                            ? `Futa Moduli ya ${selectedModule.toUpperCase()}`
                            : `Wipe ${selectedModule.toUpperCase()} Data`}
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Full Reset Card */}
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-destructive">
                        {language === "sw" ? "2. Futa Data Zote (Anza Upya)" : "2. Full Business Reset (Start Afresh)"}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {language === "sw" ? "Inafuta taarifa zote za biashara lakini inabakisha akaunti na usajili" : "Erases all transactional records while keeping shop & subscription safe"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "sw"
                      ? "Kitendo hiki kitafuta mauzo, bidhaa, manunuzi, uzalishaji, wateja, matumizi, na oda zote. Duka lako litarudi kama jipya tayari kuingiza taarifa upya."
                      : "This wipes all sales, inventory products, purchases, production batches, customers, expenses, and orders in one operation. Your store will be reset clean for fresh entry."}
                  </p>

                  <div className="rounded-xl border border-destructive/20 bg-background/80 p-3 text-xs space-y-2">
                    <p className="font-semibold text-destructive">
                      {language === "sw" ? "Uthibitisho wa kiwango cha juu:" : "High-Friction Confirmation:"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === "sw"
                        ? `Ili kufuta kabisa data zote, andika jina kamili la duka lako "${shopForm.shop_name}" hapa chini:`
                        : `To permanently wipe all data, type your exact shop name "${shopForm.shop_name}" below:`}
                    </p>
                    <Input
                      value={fullResetConfirmText}
                      onChange={(e) => setFullResetConfirmText(e.target.value)}
                      placeholder={`Type "${shopForm.shop_name}"`}
                      className="h-9 rounded-xl border-destructive/30 bg-background text-xs font-mono"
                    />
                  </div>

                  <Button
                    onClick={handleFullReset}
                    disabled={
                      resetAllDataMutation.isPending ||
                      fullResetConfirmText.trim().toLowerCase() !== shopForm.shop_name.trim().toLowerCase()
                    }
                    className={cn(
                      "w-full h-9 rounded-xl text-xs font-bold gap-2 transition-all",
                      fullResetConfirmText.trim().toLowerCase() === shopForm.shop_name.trim().toLowerCase()
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer shadow-xs"
                        : "opacity-60 cursor-not-allowed bg-muted text-muted-foreground"
                    )}
                  >
                    {resetAllDataMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{language === "sw" ? "Inafuta data zote..." : "Wiping business data..."}</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{language === "sw" ? "Futa Data Zote & Anza Upya" : "Wipe All Business Data & Start Fresh"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Audit Trail Section */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-accent" />
                    <h4 className="text-sm font-bold text-foreground">
                      {language === "sw" ? "Kumbukumbu ya Vitendo vya Kufuta Data (Audit Trail)" : "Data Reset Audit Trail"}
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {language === "sw" ? "Rekodi za kudumu" : "Durable logs"}
                  </span>
                </div>

                {resetLogsLoading ? (
                  <div className="py-6 flex items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>{language === "sw" ? "Inapakia kumbukumbu..." : "Loading audit log..."}</span>
                  </div>
                ) : !resetLogs || resetLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {language === "sw"
                      ? "Hakuna kumbukumbu ya kufuta data iliyorekodiwa kwenye duka hili."
                      : "No data reset events recorded for this shop yet."}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {resetLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">
                            {log.reset_type === "all"
                              ? language === "sw" ? "Kufuta Data Zote za Biashara" : "Full Business Data Reset"
                              : `${language === "sw" ? "Kufuta Moduli ya" : "Reset Module:"} ${String(log.module_name || "").toUpperCase()}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {log.user_email || "Shop Owner"} · {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                            {JSON.stringify(log.row_counts)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
