import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Barcode as BarcodeIcon,
  Bell,
  Camera,
  Download,
  Globe,
  Loader2,
  Printer,
  Smartphone,
  Store,
  Usb,
  Wifi,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useShopSettings, useUpdatePreferences, useUpdateShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { usePWAContext } from "@/contexts/PWAContext";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { data: shopSettings, isLoading } = useShopSettings();
  const updateSettings = useUpdateShopSettings();
  const updatePreferences = useUpdatePreferences();
  const queryClient = useQueryClient();
  const { profile, shopId } = useAuth();
  const { canInstall, install, isInstalled, isStandalone } = usePWAContext();
  const { permission, requestPermission, supportsNativeNotifications } = useNotificationContext();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    isLoading: pushLoading,
  } = usePushNotifications();

  const [shopForm, setShopForm] = useState({ shop_name: "", phone: "", address: "" });
  const [receiptForm, setReceiptForm] = useState({
    receipt_header: "",
    receipt_footer: "",
    logo_url: "",
    tax_rate: "",
  });
  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);

  useEffect(() => {
    if (!shopSettings) {
      return;
    }

    setShopForm({
      shop_name: shopSettings.shop_name || "",
      phone: shopSettings.phone || "",
      address: shopSettings.address || "",
    });

    const settings = shopSettings as {
      receipt_header?: string;
      receipt_footer?: string;
      logo_url?: string;
      tax_rate?: number;
      enable_low_stock_alerts?: boolean;
      auto_print_receipt?: boolean;
    };

    setReceiptForm({
      receipt_header: settings.receipt_header ?? "",
      receipt_footer: settings.receipt_footer ?? "",
      logo_url: settings.logo_url ?? "",
      tax_rate: String(settings.tax_rate ?? 0),
    });
    setEnableLowStockAlerts(settings.enable_low_stock_alerts ?? true);
    setAutoPrintReceipt(settings.auto_print_receipt ?? false);
  }, [shopSettings]);

  if (shopSettings === undefined || isLoading) {
    return <PageLoader message="Loading settings..." messageSw="Inapakia mipangilio..." language={language} />;
  }

  const handleSaveShop = async () => {
    if (!shopId) {
      return;
    }

    await supabase.from("shops").update({ name: shopForm.shop_name, phone: shopForm.phone, address: shopForm.address }).eq("id", shopId);
    await updateSettings.mutateAsync({ id: shopSettings?.id || undefined, ...shopForm });
  };

  const handleSaveReceipt = async () => {
    if (!shopId) {
      return;
    }

    const { error } = await supabase
      .from("shops")
      .update({
        receipt_header: receiptForm.receipt_header || null,
        receipt_footer: receiptForm.receipt_footer || null,
        logo_url: receiptForm.logo_url || null,
        tax_rate: parseFloat(receiptForm.tax_rate) || 0,
      })
      .eq("id", shopId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(language === "sw" ? "Mipangilio ya risiti imehifadhiwa" : "Receipt settings saved");
    queryClient.invalidateQueries({ queryKey: ["shop_settings"] });
  };

  const handleProfileUpload = async (url: string) => {
    if (!profile?.id) {
      return;
    }

    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(language === "sw" ? "Picha imebadilishwa!" : "Profile photo updated!");
  };

  const handleConnectPrinter = () => {
    setPrinterConnected((current) => !current);
    toast.success(
      language === "sw"
        ? "Utatumia printa ya mfumo. Chagua printa yako wakati wa kuchapisha risiti."
        : "Using your system printer. Choose your printer when printing a receipt.",
    );
  };

  const handleConnectScanner = async () => {
    try {
      if ("serial" in navigator) {
        const serialNavigator = navigator as Navigator & {
          serial: {
            requestPort: () => Promise<{ open: (config: { baudRate: number }) => Promise<void>; close: () => Promise<void> }>;
          };
        };
        const port = await serialNavigator.serial.requestPort();
        const baudRates = [9600, 115200, 19200, 38400, 57600];
        let opened = false;

        for (const baudRate of baudRates) {
          try {
            await port.open({ baudRate });
            opened = true;
            break;
          } catch {
            try {
              await port.close();
            } catch {
              // ignore close errors while probing baud rates
            }
          }
        }

        if (!opened) {
          throw new Error("Could not open serial port");
        }
      }

      setScannerConnected(true);
      toast.success(
        language === "sw"
          ? "Skana iko tayari kutumika. Weka utafutaji kwenye focus kisha scan."
          : "Scanner is ready. Focus the search field and start scanning.",
      );
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === "NotFoundError") {
        return;
      }

      setScannerConnected(true);
      toast.success(
        language === "sw"
          ? "Skana nyingi za USB hutumia keyboard mode. Weka utafutaji kwenye focus kisha scan."
          : "Most USB scanners use keyboard mode. Focus the search field and scan.",
      );
    }
  };

  const settingsCards = [
    {
      label: language === "sw" ? "Lugha ya mfumo" : "App language",
      value: language === "sw" ? "Kiswahili" : "English",
    },
    {
      label: language === "sw" ? "Arifa za stok chini" : "Low-stock alerts",
      value: enableLowStockAlerts ? (language === "sw" ? "Wazi" : "On") : language === "sw" ? "Zimezimwa" : "Off",
    },
    {
      label: language === "sw" ? "Kuchapisha risiti" : "Receipt printing",
      value: autoPrintReceipt ? (language === "sw" ? "Otomatiki" : "Automatic") : language === "sw" ? "Manual" : "Manual",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={t("settings.title")}
        subtitle={
          language === "sw"
            ? "Dhibiti taarifa za duka, mapendeleo ya timu, na vifaa vinavyotumika kwenye biashara."
            : "Manage shop details, team preferences, and the hardware used across your business."
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {settingsCards.map((card) => (
          <Card key={card.label} className="section-shell">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="section-shell xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {language === "sw" ? "Uzoefu wa programu" : "App experience"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "sw" ? "Usakinishaji" : "Installation"}</p>
                  <p className="mt-2 text-xl font-semibold">
                    {isInstalled || isStandalone
                      ? language === "sw"
                        ? "Imewekwa kwenye kifaa"
                        : "Installed on this device"
                      : language === "sw"
                        ? "Tayari kusakinishwa"
                        : "Ready to install"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {language === "sw"
                      ? "Weka app kwenye simu au kompyuta ili ifunguke kama programu kamili yenye offline cache na launch ya haraka."
                      : "Install the app on phone or desktop for a full-screen experience, offline caching, and faster launch."}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Download className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => void install()} disabled={!canInstall}>
                  {isInstalled || isStandalone
                    ? language === "sw"
                      ? "Tayari imewekwa"
                      : "Already installed"
                    : language === "sw"
                      ? "Sakinisha app"
                      : "Install app"}
                </Button>
                <div className="rounded-full border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                  {language === "sw" ? "Desktop, Android, iPhone" : "Desktop, Android, iPhone"}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "sw" ? "Arifa za kifaa" : "Device notifications"}</p>
                  <p className="mt-2 text-xl font-semibold">
                    {!supportsNativeNotifications
                      ? language === "sw"
                        ? "Hazipatikani"
                        : "Not supported"
                      : permission === "granted"
                        ? language === "sw"
                          ? "Zimewashwa"
                          : "Enabled"
                        : permission === "denied"
                          ? language === "sw"
                            ? "Zimezuiwa"
                            : "Blocked"
                          : language === "sw"
                            ? "Hazijawashwa"
                            : "Not enabled"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {language === "sw"
                      ? "Arifa mpya zinaweza kuonekana kwenye kifaa chako wakati app iko wazi au imewekwa."
                      : "New activity alerts can appear on the device while the app is open and after installation."}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void requestPermission()} disabled={!supportsNativeNotifications || permission === "granted"}>
                  {permission === "granted"
                    ? language === "sw"
                      ? "Arifa zimewashwa"
                      : "Notifications enabled"
                    : language === "sw"
                      ? "Washa arifa"
                      : "Enable notifications"}
                </Button>
                <div className="rounded-full border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                  {language === "sw" ? "In-app na native alerts" : "In-app and native alerts"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={() => void (pushSubscribed ? unsubscribeFromPush() : subscribeToPush())}
                  disabled={!pushSupported || pushLoading || permission !== "granted"}
                >
                  {pushSubscribed
                    ? language === "sw"
                      ? "Zima push"
                      : "Disable push"
                    : language === "sw"
                      ? "Washa push ya background"
                      : "Enable background push"}
                </Button>
                <div className="rounded-full border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                  {!pushSupported
                    ? language === "sw"
                      ? "Kifaa hiki hakiungi mkono Web Push"
                      : "This device does not support Web Push"
                    : pushSubscribed
                      ? language === "sw"
                        ? "Push imeunganishwa"
                        : "Push connected"
                      : language === "sw"
                        ? "Push haijaunganishwa"
                        : "Push not connected"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {language === "sw" ? "Wasifu" : "Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <ImageUpload
              currentUrl={profile?.avatar_url}
              bucket="avatars"
              folder={shopId || "default"}
              onUpload={handleProfileUpload}
              variant="avatar"
            />
            <div className="text-center sm:text-left">
              <p className="text-xl font-semibold">{profile?.full_name || (language === "sw" ? "Mtumiaji" : "User")}</p>
              <p className="text-sm text-muted-foreground">
                {language === "sw"
                  ? "Badilisha picha yako ya wasifu ili timu yako ikutambue kwa haraka."
                  : "Update your profile photo so the rest of the team can recognize you quickly."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {t("settings.shopDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("settings.shopName")}</Label>
                <Input value={shopForm.shop_name} onChange={(event) => setShopForm({ ...shopForm, shop_name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.phoneNumber")}</Label>
                <Input value={shopForm.phone} onChange={(event) => setShopForm({ ...shopForm, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.location")}</Label>
                <Input value={shopForm.address} onChange={(event) => setShopForm({ ...shopForm, address: event.target.value })} />
              </div>
            </div>
            <Button onClick={handleSaveShop} disabled={updateSettings.isPending} className="gap-2">
              {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("settings.saveChanges")}
            </Button>
          </CardContent>
        </Card>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("settings.languagePrefs")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <Select value={language} onValueChange={(value: "en" | "sw") => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Kiswahili</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div>
                <p className="font-medium">{t("settings.lowStockAlerts")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.notifyLow")}</p>
              </div>
              <Switch
                checked={enableLowStockAlerts}
                onCheckedChange={(value) => {
                  setEnableLowStockAlerts(value);
                  updatePreferences.mutate({ enable_low_stock_alerts: value });
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div>
                <p className="font-medium">{t("settings.autoPrint")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.printAfterSale")}</p>
              </div>
              <Switch
                checked={autoPrintReceipt}
                onCheckedChange={(value) => {
                  setAutoPrintReceipt(value);
                  updatePreferences.mutate({ auto_print_receipt: value });
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              {t("settings.receiptCustomization")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("settings.receiptHeader")}</Label>
                <Textarea
                  rows={3}
                  className="resize-none"
                  placeholder={language === "sw" ? "Maandishi yatakayoonekana juu ya risiti" : "Text that appears at the top of the receipt"}
                  value={receiptForm.receipt_header}
                  onChange={(event) => setReceiptForm({ ...receiptForm, receipt_header: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.receiptFooter")}</Label>
                <Textarea
                  rows={3}
                  className="resize-none"
                  placeholder={language === "sw" ? "Asante kwa kununua. Karibu tena." : "Thanks for shopping with us. Please come again."}
                  value={receiptForm.receipt_footer}
                  onChange={(event) => setReceiptForm({ ...receiptForm, receipt_footer: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <ImageUpload
                currentUrl={receiptForm.logo_url || null}
                bucket="avatars"
                folder={shopId ? `shops/${shopId}` : "shops"}
                onUpload={(url) => setReceiptForm((current) => ({ ...current, logo_url: url }))}
                variant="product"
              />
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>{t("settings.logo")}</Label>
                  <Input
                    placeholder={language === "sw" ? "Au bandika kiungo cha picha" : "Or paste an image URL"}
                    value={receiptForm.logo_url}
                    onChange={(event) => setReceiptForm({ ...receiptForm, logo_url: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.taxRate")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={receiptForm.tax_rate}
                    onChange={(event) => setReceiptForm({ ...receiptForm, tax_rate: event.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveReceipt} disabled={updateSettings.isPending} className="gap-2">
              {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("settings.saveReceiptSettings")}
            </Button>
          </CardContent>
        </Card>

        <Card className="section-shell">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarcodeIcon className="h-5 w-5 text-primary" />
              {language === "sw" ? "Printa na barcode" : "Printer and barcode"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Upana wa risiti" : "Receipt width"}</Label>
              <Select defaultValue="80mm">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "sw" ? "Ukubwa wa lebo" : "Label size"}</Label>
              <Select defaultValue="50x30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="40x20">40 x 20 mm</SelectItem>
                  <SelectItem value="50x30">50 x 30 mm</SelectItem>
                  <SelectItem value="60x40">60 x 40 mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "sw" ? "Muundo wa barcode" : "Barcode format"}</Label>
              <Select defaultValue="code128">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code128">Code 128</SelectItem>
                  <SelectItem value="ean13">EAN-13</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="section-shell xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Usb className="h-5 w-5 text-primary" />
              {language === "sw" ? "Vifaa vya biashara" : "Business hardware"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[1.5rem] border-dashed bg-background/70 shadow-none">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className={`rounded-2xl p-3 ${printerConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    <Printer className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-medium">{language === "sw" ? "Printa ya risiti" : "Receipt printer"}</p>
                    <p className="text-sm text-muted-foreground">
                      {printerConnected ? (language === "sw" ? "Imeunganishwa" : "Connected") : language === "sw" ? "Haijaunganishwa" : "Not connected"}
                    </p>
                  </div>
                  <Button variant={printerConnected ? "outline" : "default"} size="sm" className="gap-2" onClick={handleConnectPrinter}>
                    <Wifi className="h-4 w-4" />
                    {printerConnected ? (language === "sw" ? "Ondoa" : "Disconnect") : language === "sw" ? "Unganisha" : "Connect"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] border-dashed bg-background/70 shadow-none">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className={`rounded-2xl p-3 ${scannerConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    <BarcodeIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-medium">{language === "sw" ? "Skana ya barcode" : "Barcode scanner"}</p>
                    <p className="text-sm text-muted-foreground">
                      {scannerConnected ? (language === "sw" ? "Imeunganishwa" : "Connected") : language === "sw" ? "Haijaunganishwa" : "Not connected"}
                    </p>
                  </div>
                  <Button variant={scannerConnected ? "outline" : "default"} size="sm" className="gap-2" onClick={handleConnectScanner}>
                    <Usb className="h-4 w-4" />
                    {scannerConnected ? (language === "sw" ? "Ondoa" : "Disconnect") : language === "sw" ? "Unganisha" : "Connect"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] border-dashed bg-background/70 shadow-none">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-medium">{language === "sw" ? "Kifaa cha POS" : "POS device"}</p>
                    <p className="text-sm text-muted-foreground">{language === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}</p>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => toast.info(language === "sw" ? "Huduma hii inakuja hivi karibuni" : "This is coming soon")}>
                    <Wifi className="h-4 w-4" />
                    {language === "sw" ? "Fuatilia" : "Stay tuned"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-muted-foreground">
              {language === "sw"
                ? "Kuchapisha risiti hutumia printa ya mfumo. Skana nyingi za USB hufanya kazi kwa keyboard mode, hivyo utafutaji ukiwa kwenye focus unaweza kuscan moja kwa moja."
                : "Receipt printing uses your system printer. Most USB scanners work in keyboard mode, so scanning works best when a search field is focused."}
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
