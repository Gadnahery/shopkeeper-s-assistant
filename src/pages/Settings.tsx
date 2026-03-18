import { useCallback, useEffect, useState } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import {
  type CameraPermissionState,
  getCameraPermissionState,
  requestCameraPermission,
} from "@/lib/cameraPermissions";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { isMobile } = useAdaptiveLayout();
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
  const [cameraPermissionState, setCameraPermissionState] = useState<CameraPermissionState>("unknown");
  const [cameraPermissionLoading, setCameraPermissionLoading] = useState(false);

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

  const refreshCameraPermissionState = useCallback(async () => {
    const result = await getCameraPermissionState();
    setCameraPermissionState(result.state);
  }, []);

  useEffect(() => {
    void refreshCameraPermissionState();

    const handleWindowFocus = () => {
      void refreshCameraPermissionState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCameraPermissionState();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshCameraPermissionState]);

  if (shopSettings === undefined || isLoading) {
    return <PageLoader message="Loading settings..." messageSw="Inapakia mipangilio..." language={language} />;
  }

  const handleRequestCameraPermission = async () => {
    setCameraPermissionLoading(true);

    try {
      const result = await requestCameraPermission();
      setCameraPermissionState(result.state);

      if (result.state === "granted") {
        toast.success(language === "sw" ? "Ruhusa ya kamera imewashwa" : "Camera access enabled");
        return;
      }

      if (result.state === "denied") {
        toast.error(
          language === "sw"
            ? "Kamera imezuiwa. Fungua settings za simu au browser na uruhusu kamera."
            : "Camera access is blocked. Open your phone or browser settings and allow camera access.",
        );
        return;
      }

      if (result.state === "insecure") {
        toast.error(
          language === "sw"
            ? "Kamera inahitaji kufungua app kwenye HTTPS."
            : "Camera access requires the app to be opened on HTTPS.",
        );
        return;
      }

      if (result.state === "unsupported") {
        toast.error(
          language === "sw"
            ? "Kifaa au browser hii haiungi mkono kamera ya web app."
            : "This device or browser does not support camera access for the web app.",
        );
        return;
      }

      if (result.state === "unavailable") {
        toast.error(
          language === "sw"
            ? "Kamera haipatikani sasa hivi. Funga app nyingine zinazotumia kamera kisha ujaribu tena."
            : "The camera is not available right now. Close other apps using the camera and try again.",
        );
        return;
      }

      toast.info(language === "sw" ? "Tafadhali jaribu tena kufungua kamera." : "Please try opening the camera again.");
    } finally {
      setCameraPermissionLoading(false);
    }
  };

  const cameraPermissionLabel =
    cameraPermissionState === "granted"
      ? language === "sw"
        ? "Imeruhusiwa"
        : "Allowed"
      : cameraPermissionState === "denied"
        ? language === "sw"
          ? "Imezuiwa"
          : "Blocked"
        : cameraPermissionState === "prompt"
          ? language === "sw"
            ? "Inaomba ruhusa"
            : "Needs permission"
          : cameraPermissionState === "insecure"
            ? language === "sw"
              ? "Inahitaji HTTPS"
              : "Needs HTTPS"
            : cameraPermissionState === "unsupported"
              ? language === "sw"
                ? "Haiungwi mkono"
                : "Not supported"
              : cameraPermissionState === "unavailable"
                ? language === "sw"
                  ? "Haipatikani sasa"
                  : "Unavailable"
                : language === "sw"
                  ? "Haijathibitishwa"
                  : "Not checked yet";

  const cameraPermissionHelp =
    cameraPermissionState === "granted"
      ? language === "sw"
        ? "Unaweza kutumia kamera kuscan QR code na barcode kwenye ukurasa wa mauzo."
        : "You can use the camera to scan QR codes and barcodes on the sales page."
      : cameraPermissionState === "denied"
        ? language === "sw"
          ? "Kama uliikataa mara ya kwanza, fungua settings za simu au browser > Permissions > Camera, kisha weka Allow."
          : "If you denied it before, open your phone or browser settings, then set Camera permission to Allow."
        : cameraPermissionState === "insecure"
          ? language === "sw"
            ? "Fungua app kupitia HTTPS ili browser iruhusu kamera."
            : "Open the app over HTTPS so the browser can allow camera access."
          : cameraPermissionState === "unsupported"
            ? language === "sw"
              ? "Tumia browser mpya kama Chrome, Edge, au Safari ya kisasa."
              : "Use a modern browser such as Chrome, Edge, or a recent Safari version."
            : cameraPermissionState === "unavailable"
              ? language === "sw"
                ? "Kamera inaweza kuwa inatumiwa na app nyingine au kifaa hakina kamera."
                : "The camera may be busy in another app, or this device may not have a camera."
              : language === "sw"
                ? "Bonyeza kitufe hapa chini ili app iombe ruhusa ya kamera."
                : "Tap the button below so the app can request camera permission.";

  const cameraPermissionActionLabel =
    cameraPermissionState === "granted"
      ? language === "sw"
        ? "Kagua tena"
        : "Check again"
      : language === "sw"
        ? "Ruhusu kamera"
        : "Allow camera";

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
      hint: language === "sw" ? "Muonekano wa timu" : "Workspace language",
    },
    {
      label: language === "sw" ? "Notifications za stok chini" : "Low-stock alerts",
      value: enableLowStockAlerts ? (language === "sw" ? "Wazi" : "On") : language === "sw" ? "Zimezimwa" : "Off",
      hint: language === "sw" ? "Tahadhari za bidhaa" : "Inventory safety",
    },
    {
      label: language === "sw" ? "Kuchapisha risiti" : "Receipt printing",
      value: autoPrintReceipt ? (language === "sw" ? "Otomatiki" : "Automatic") : language === "sw" ? "Manual" : "Manual",
      hint: language === "sw" ? "Baada ya mauzo" : "After checkout",
    },
    {
      label: language === "sw" ? "Push ya background" : "Background push",
      value: pushSubscribed ? (language === "sw" ? "Imeunganishwa" : "Connected") : language === "sw" ? "Haijaunganishwa" : "Not connected",
      hint: language === "sw" ? "Notifications za kifaa" : "Device alerts",
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settingsCards.map((card) => (
          <Card key={card.label} className="section-shell">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isMobile && (
        <div className="space-y-4">
          <Card className="section-shell">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <ImageUpload
                  currentUrl={profile?.avatar_url}
                  bucket="avatars"
                  folder={shopId || "default"}
                  onUpload={handleProfileUpload}
                  variant="avatar"
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{profile?.full_name || (language === "sw" ? "Mtumiaji" : "User")}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "sw" ? "Mipangilio muhimu ya biashara na kifaa." : "Important business and device settings."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="shop" className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70 px-0">
              <AccordionTrigger className="px-4 py-4 text-left text-base font-semibold hover:no-underline">
                {language === "sw" ? "Wasifu na duka" : "Profile and shop"}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-4 pb-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
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
                <Button onClick={handleSaveShop} disabled={updateSettings.isPending} className="h-11 w-full gap-2">
                  {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("settings.saveChanges")}
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="prefs" className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70 px-0">
              <AccordionTrigger className="px-4 py-4 text-left text-base font-semibold hover:no-underline">
                {language === "sw" ? "Lugha na notifications" : "Language and alerts"}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-4 pb-4">
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

                <div className="grid gap-3">
                  <Button onClick={() => void requestPermission()} disabled={!supportsNativeNotifications || permission === "granted"} className="h-11 w-full">
                    {permission === "granted"
                      ? language === "sw"
                        ? "Notifications zimewashwa"
                        : "Notifications enabled"
                      : language === "sw"
                        ? "Washa notifications"
                        : "Enable notifications"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void (pushSubscribed ? unsubscribeFromPush() : subscribeToPush())}
                    disabled={!pushSupported || pushLoading || permission !== "granted"}
                    className="h-11 w-full"
                  >
                    {pushSubscribed
                      ? language === "sw"
                        ? "Zima push"
                        : "Disable push"
                      : language === "sw"
                        ? "Washa push ya background"
                        : "Enable background push"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="receipt" className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70 px-0">
              <AccordionTrigger className="px-4 py-4 text-left text-base font-semibold hover:no-underline">
                {language === "sw" ? "Risiti na chapa" : "Receipt and branding"}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-4 pb-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>{t("settings.receiptHeader")}</Label>
                    <Textarea
                      rows={3}
                      className="resize-none"
                      placeholder={language === "sw" ? "Maandishi ya juu ya risiti" : "Text at the top of the receipt"}
                      value={receiptForm.receipt_header}
                      onChange={(event) => setReceiptForm({ ...receiptForm, receipt_header: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.receiptFooter")}</Label>
                    <Textarea
                      rows={3}
                      className="resize-none"
                      placeholder={language === "sw" ? "Asante kwa kununua" : "Thank you for shopping"}
                      value={receiptForm.receipt_footer}
                      onChange={(event) => setReceiptForm({ ...receiptForm, receipt_footer: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.logo")}</Label>
                    <Input
                      placeholder={language === "sw" ? "Bandika kiungo cha nembo" : "Paste logo URL"}
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
                <Button onClick={handleSaveReceipt} disabled={updateSettings.isPending} className="h-11 w-full gap-2">
                  {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("settings.saveReceiptSettings")}
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="devices" className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70 px-0">
              <AccordionTrigger className="px-4 py-4 text-left text-base font-semibold hover:no-underline">
                {language === "sw" ? "Programu na vifaa" : "App and devices"}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-4 pb-4">
                <div className="grid gap-3">
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{language === "sw" ? "Sakinisha app" : "Install app"}</p>
                        <p className="text-sm text-muted-foreground">
                          {isInstalled || isStandalone
                            ? language === "sw"
                              ? "App ipo tayari kwenye kifaa hiki"
                              : "App is already on this device"
                            : language === "sw"
                              ? "Ifungue kama app kamili kwenye simu au kompyuta"
                              : "Use it like a full app on phone or desktop"}
                        </p>
                      </div>
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <Button onClick={() => void install()} disabled={!canInstall} className="mt-3 h-11 w-full">
                      {isInstalled || isStandalone
                        ? language === "sw"
                          ? "Tayari imewekwa"
                          : "Already installed"
                        : language === "sw"
                          ? "Sakinisha app"
                          : "Install app"}
                    </Button>
                  </div>

                  <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{language === "sw" ? "Ruhusa ya kamera" : "Camera access"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{cameraPermissionLabel}</p>
                      </div>
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{cameraPermissionHelp}</p>
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => void handleRequestCameraPermission()} disabled={cameraPermissionLoading || cameraPermissionState === "unsupported"} className="h-10 flex-1 gap-2">
                        {cameraPermissionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        {cameraPermissionActionLabel}
                      </Button>
                      <Button variant="outline" onClick={() => void refreshCameraPermissionState()} className="h-10">
                        {language === "sw" ? "Onyesha hali" : "Refresh"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
                      <p className="font-medium">{language === "sw" ? "Printa ya risiti" : "Receipt printer"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {printerConnected ? (language === "sw" ? "Imeunganishwa" : "Connected") : language === "sw" ? "Haijaunganishwa" : "Not connected"}
                      </p>
                      <Button variant={printerConnected ? "outline" : "default"} className="mt-3 h-10 w-full gap-2" onClick={handleConnectPrinter}>
                        <Wifi className="h-4 w-4" />
                        {printerConnected ? (language === "sw" ? "Ondoa" : "Disconnect") : language === "sw" ? "Unganisha" : "Connect"}
                      </Button>
                    </div>

                    <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
                      <p className="font-medium">{language === "sw" ? "Skana ya barcode" : "Barcode scanner"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {scannerConnected ? (language === "sw" ? "Imeunganishwa" : "Connected") : language === "sw" ? "Haijaunganishwa" : "Not connected"}
                      </p>
                      <Button variant={scannerConnected ? "outline" : "default"} className="mt-3 h-10 w-full gap-2" onClick={handleConnectScanner}>
                        <Usb className="h-4 w-4" />
                        {scannerConnected ? (language === "sw" ? "Ondoa" : "Disconnect") : language === "sw" ? "Unganisha" : "Connect"}
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {!isMobile && (
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
                <Button onClick={() => void install()} disabled={!canInstall} className="h-11">
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
                  <p className="text-sm text-muted-foreground">{language === "sw" ? "Notifications za kifaa" : "Device notifications"}</p>
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
                      ? "Notifications mpya zinaweza kuonekana kwenye kifaa chako wakati app iko wazi au imewekwa."
                      : "New activity alerts can appear on the device while the app is open and after installation."}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void requestPermission()} disabled={!supportsNativeNotifications || permission === "granted"} className="h-11">
                  {permission === "granted"
                    ? language === "sw"
                      ? "Notifications zimewashwa"
                      : "Notifications enabled"
                    : language === "sw"
                      ? "Washa notifications"
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
                  className="h-11"
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

            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "sw" ? "Ruhusa ya kamera" : "Camera access"}</p>
                  <p className="mt-2 text-xl font-semibold">{cameraPermissionLabel}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{cameraPermissionHelp}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant={cameraPermissionState === "granted" ? "outline" : "default"}
                  onClick={() => void handleRequestCameraPermission()}
                  disabled={cameraPermissionLoading || cameraPermissionState === "unsupported"}
                  className="h-11 gap-2"
                >
                  {cameraPermissionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {cameraPermissionActionLabel}
                </Button>
                <Button variant="outline" onClick={() => void refreshCameraPermissionState()} className="h-11">
                  {language === "sw" ? "Onyesha hali" : "Refresh status"}
                </Button>
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
            <Button onClick={handleSaveShop} disabled={updateSettings.isPending} className="h-11 gap-2">
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

            <Button onClick={handleSaveReceipt} disabled={updateSettings.isPending} className="h-11 gap-2">
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
                ? "Kuchapisha risiti hutumia printa ya mfumo. Skana nyingi za USB hufanya kazi kwa keyboard mode, hivyo utafutaji ukiwa kwenye focus unaweza kuscan moja kwa moja. Kwa scan ya kamera kwenye simu, ruhusu Camera kwenye browser au settings za app."
                : "Receipt printing uses your system printer. Most USB scanners work in keyboard mode, so scanning works best when a search field is focused. For camera scanning on phone, allow Camera in your browser or app settings."}
            </p>
          </CardContent>
        </Card>
      </div>
      )}
    </motion.div>
  );
}
