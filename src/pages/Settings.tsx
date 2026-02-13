import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Globe, Printer, Barcode as BarcodeIcon, Loader2, Camera, Usb, Wifi, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopSettings, useUpdateShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { data: shopSettings, isLoading } = useShopSettings();
  const updateSettings = useUpdateShopSettings();
  const { profile, shopId } = useAuth();

  const [shopForm, setShopForm] = useState({ shop_name: "", phone: "", address: "" });
  const [printerConnected, setPrinterConnected] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);

  if (shopSettings && !shopForm.shop_name) {
    setShopForm({
      shop_name: shopSettings.shop_name || "",
      phone: shopSettings.phone || "",
      address: shopSettings.address || "",
    });
  }

  const handleSaveShop = async () => {
    if (!shopId) return;
    await supabase.from("shops").update({ name: shopForm.shop_name, phone: shopForm.phone, address: shopForm.address }).eq("id", shopId);
    await updateSettings.mutateAsync({ id: shopSettings?.id || undefined, ...shopForm });
  };

  const handleProfileUpload = async (url: string) => {
    if (!profile?.id) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    if (error) toast.error(error.message);
    else toast.success(language === "sw" ? "Picha imebadilishwa!" : "Profile photo updated!");
  };

  const handleConnectPrinter = () => {
    setPrinterConnected(true);
    toast.success(language === "sw" ? "Utatumia printa ya mfumo. Chagua printa yako pale utakapochapisha risiti." : "Using system printer. Select your printer when printing receipts.");
  };

  const handleConnectScanner = async () => {
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        const baudRates = [9600, 115200, 19200, 38400, 57600];
        let opened = false;
        for (const rate of baudRates) {
          try {
            await port.open({ baudRate: rate });
            opened = true;
            break;
          } catch {
            try { await port.close(); } catch { /* ignore */ }
          }
        }
        if (opened) {
          setScannerConnected(true);
          toast.success(language === "sw" ? "Skana imeunganishwa!" : "Barcode scanner connected!");
        } else throw new Error("Could not open serial port");
      } else {
        setScannerConnected(true);
        toast.success(language === "sw" ? "Skana ya kibodi inafanya kazi. Weka mstari wa utafutaji ukiwa na uzani na uscan." : "Keyboard-mode scanners work automatically. Focus the search field and scan.");
      }
    } catch (err: any) {
      if (err.name === "NotFoundError") return;
      setScannerConnected(true);
      toast.success(language === "sw" ? "Skana ya kibodi inafanya kazi. Weka mstari wa utafutaji ukiwa na uzani na uscan." : "Using keyboard mode. Focus the search field and scan—most USB scanners work this way.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" />{language === "sw" ? "Wasifu" : "Profile"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ImageUpload currentUrl={profile?.avatar_url} bucket="avatars" folder={shopId || "default"} onUpload={handleProfileUpload} variant="avatar" />
            <p className="font-medium">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{language === "sw" ? "Mmiliki" : "Owner"}</p>
          </CardContent>
        </Card>

        {/* Shop Details */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" />{t("settings.shopDetails")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
              <>
                <div className="space-y-2"><Label>{t("settings.shopName")}</Label><Input value={shopForm.shop_name} onChange={e => setShopForm({ ...shopForm, shop_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("settings.phoneNumber")}</Label><Input value={shopForm.phone} onChange={e => setShopForm({ ...shopForm, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("settings.location")}</Label><Input value={shopForm.address} onChange={e => setShopForm({ ...shopForm, address: e.target.value })} /></div>
                <Button onClick={handleSaveShop} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("settings.saveChanges")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Language & Preferences */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />{t("settings.languagePrefs")}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <Select value={language} onValueChange={(v: "en" | "sw") => setLanguage(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 {t("settings.english")}</SelectItem>
                  <SelectItem value="sw">🇹🇿 {t("settings.swahili")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-medium">{t("settings.lowStockAlerts")}</p><p className="text-sm text-muted-foreground">{t("settings.notifyLow")}</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-medium">{t("settings.autoPrint")}</p><p className="text-sm text-muted-foreground">{t("settings.printAfterSale")}</p></div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Printer & Barcode Settings */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader><CardTitle className="flex items-center gap-2"><Printer className="h-5 w-5 text-primary" />{language === "sw" ? "Printa na Barcode" : "Printer & Barcode"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>{language === "sw" ? "Upana wa Risiti" : "Receipt Width"}</Label>
              <Select defaultValue="80mm"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="58mm">58mm (Small)</SelectItem><SelectItem value="80mm">80mm (Standard)</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>{language === "sw" ? "Ukubwa wa Lebo" : "Barcode Label Size"}</Label>
              <Select defaultValue="50x30"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="40x20">40 × 20 mm</SelectItem><SelectItem value="50x30">50 × 30 mm</SelectItem><SelectItem value="60x40">60 × 40 mm</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>{language === "sw" ? "Aina ya Barcode" : "Barcode Format"}</Label>
              <Select defaultValue="code128"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="code128">Code 128</SelectItem><SelectItem value="ean13">EAN-13</SelectItem><SelectItem value="qr">QR Code</SelectItem></SelectContent></Select>
            </div>
          </CardContent>
        </Card>

        {/* Hardware Devices */}
        <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Usb className="h-5 w-5 text-primary" />{language === "sw" ? "Vifaa vya Biashara" : "Hardware Devices"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <div className={`rounded-xl p-3 ${printerConnected ? "bg-success/10" : "bg-muted"}`}>
                    <Printer className={`h-8 w-8 ${printerConnected ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{language === "sw" ? "Printa ya Risiti" : "Receipt Printer"}</p>
                    <p className="text-sm text-muted-foreground">{printerConnected ? (language === "sw" ? "Imeunganishwa" : "Connected") : (language === "sw" ? "Haijaunganishwa" : "Not connected")}</p>
                  </div>
                  <Button variant={printerConnected ? "outline" : "default"} size="sm" onClick={handleConnectPrinter} className="gap-2">
                    <Wifi className="h-4 w-4" />{printerConnected ? (language === "sw" ? "Ondoa" : "Disconnect") : (language === "sw" ? "Unganisha" : "Connect")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <div className={`rounded-xl p-3 ${scannerConnected ? "bg-success/10" : "bg-muted"}`}>
                    <BarcodeIcon className={`h-8 w-8 ${scannerConnected ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{language === "sw" ? "Skana ya Barcode" : "Barcode Scanner"}</p>
                    <p className="text-sm text-muted-foreground">{scannerConnected ? (language === "sw" ? "Imeunganishwa" : "Connected") : (language === "sw" ? "Haijaunganishwa" : "Not connected")}</p>
                  </div>
                  <Button variant={scannerConnected ? "outline" : "default"} size="sm" onClick={handleConnectScanner} className="gap-2">
                    <Usb className="h-4 w-4" />{scannerConnected ? (language === "sw" ? "Ondoa" : "Disconnect") : (language === "sw" ? "Unganisha" : "Connect")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 p-6">
                  <div className="rounded-xl p-3 bg-muted">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{language === "sw" ? "POS Terminal" : "POS Terminal"}</p>
                    <p className="text-sm text-muted-foreground">{language === "sw" ? "Haijaunganishwa" : "Not connected"}</p>
                  </div>
                  <Button variant="default" size="sm" className="gap-2" onClick={() => toast.info(language === "sw" ? "Inakuja hivi karibuni" : "Coming soon")}>
                    <Wifi className="h-4 w-4" />{language === "sw" ? "Unganisha" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {language === "sw" ? "Printa ya risiti hutumia printa ya mfumo—chagua printa yako pale utakapochapisha. Skana nyingi za USB zinatumia kibodi—weka mstari wa utafutaji ukiwa na uzani na uscan." : "Receipt printing uses your system printer—select it in the print dialog. Most USB barcode scanners use keyboard mode—focus the search field and scan."}
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
