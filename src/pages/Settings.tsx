import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Users,
  Globe,
  Database,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopSettings, useUpdateShopSettings } from "@/hooks/useShopSettings";

const users = [
  { id: "1", name: "Alex Johnson", role: "Manager", phone: "0755 123 456", status: "Active" },
  { id: "2", name: "Mary Swai", role: "Cashier", phone: "0712 456 789", status: "Active" },
  { id: "3", name: "John Mwamba", role: "Cashier", phone: "0688 111 222", status: "Inactive" },
];

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { data: shopSettings, isLoading } = useShopSettings();
  const updateSettings = useUpdateShopSettings();

  const [shopForm, setShopForm] = useState({
    shop_name: "",
    phone: "",
    address: "",
  });

  // Update form when settings load
  if (shopSettings && !shopForm.shop_name) {
    setShopForm({
      shop_name: shopSettings.shop_name || "",
      phone: shopSettings.phone || "",
      address: shopSettings.address || "",
    });
  }

  const handleSaveShop = async () => {
    if (!shopSettings?.id) return;
    await updateSettings.mutateAsync({
      id: shopSettings.id,
      ...shopForm,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shop Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {t("settings.shopDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t("settings.shopName")}</Label>
                  <Input 
                    value={shopForm.shop_name}
                    onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.phoneNumber")}</Label>
                  <Input 
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.location")}</Label>
                  <Input 
                    value={shopForm.address}
                    onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  />
                </div>
                <Button 
                  className="mt-2" 
                  onClick={handleSaveShop}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("settings.saveChanges")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Language & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("settings.languagePrefs")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <Select value={language} onValueChange={(v: "en" | "sw") => setLanguage(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 {t("settings.english")}</SelectItem>
                  <SelectItem value="sw">🇹🇿 {t("settings.swahili")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.lowStockAlerts")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.notifyLow")}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("settings.autoPrint")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.printAfterSale")}</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {t("settings.backupRestore")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.backupDesc")}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {t("settings.createBackup")}
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                {t("settings.restoreBackup")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.lastBackup")}: 23 Oct 2024, 11:30 AM
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t("settings.userManagement")}
          </CardTitle>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("settings.addUser")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>{t("settings.role")}</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "Active" ? "default" : "secondary"}
                      className={
                        user.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : ""
                      }
                    >
                      {user.status === "Active" ? t("settings.active") : t("settings.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
