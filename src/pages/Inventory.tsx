import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Download,
  FolderTree,
  Loader2,
  Package,
  Pencil,
  Plus,
  QrCode,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { exportToCSV, parseCSV } from "@/utils/exportData";
import { supabase } from "@/integrations/supabase/client";
import { playSound } from "@/lib/sounds";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

export default function Inventory() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const { isMobile } = useAdaptiveLayout();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out">("all");
  const [itemTypeFilter, setItemTypeFilter] = useState<"all" | "product" | "service">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobileProductPage, setMobileProductPage] = useState(1);

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isAddingProduct, setIsAddingProduct] = useState(searchParams.get("new") === "true");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);
  const [barcodeType, setBarcodeType] = useState<"barcode" | "qr">("barcode");

  // New Product / Service Form
  const [newProduct, setNewProduct] = useState({
    item_type: "product" as "product" | "service",
    name: "",
    name_sw: "",
    code: "",
    category_id: "none",
    buying_price: "",
    selling_price: "",
    stock: "0",
    low_stock_alert: "5",
    duration_minutes: "",
    description: "",
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState<any>(null);

  // Modals (Destructive confirms only)
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsAddingProduct(true);
      setSelectedProduct(null);
    }
  }, [searchParams]);

  // Auto-select first product if none selected
  useEffect(() => {
    if (products && products.length > 0 && !selectedProduct && !isAddingProduct) {
      const first = products[0];
      setSelectedProduct(first);
      setEditForm({ ...first, category_id: first.category_id || "none" });
    }
  }, [products]);

  const categoryMap = new Map((categories || []).map((c) => [c.id, c.name]));

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
      const alertLimit = p.low_stock_alert ?? 5;
      const tracksInventory = p.track_inventory !== false && p.item_type !== "service";
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && (!tracksInventory || p.stock > alertLimit)) ||
        (stockFilter === "low" && tracksInventory && p.stock > 0 && p.stock <= alertLimit) ||
        (stockFilter === "out" && tracksInventory && p.stock <= 0);

      const matchesType =
        itemTypeFilter === "all" ||
        (itemTypeFilter === "service" && (p.item_type === "service" || p.track_inventory === false)) ||
        (itemTypeFilter === "product" && p.item_type !== "service" && p.track_inventory !== false);

      return matchesSearch && matchesCategory && matchesStock && matchesType;
    });
  }, [products, searchTerm, categoryFilter, stockFilter, itemTypeFilter]);

  const MOBILE_PRODUCT_PAGE_SIZE = 4;
  const totalMobileProductPages = Math.ceil(filteredProducts.length / MOBILE_PRODUCT_PAGE_SIZE) || 1;
  const currentMobileProducts = useMemo(() => {
    const start = (mobileProductPage - 1) * MOBILE_PRODUCT_PAGE_SIZE;
    return filteredProducts.slice(start, start + MOBILE_PRODUCT_PAGE_SIZE);
  }, [filteredProducts, mobileProductPage]);

  useEffect(() => {
    setMobileProductPage(1);
  }, [searchTerm, categoryFilter, stockFilter, itemTypeFilter]);

  const totalStockValue = useMemo(() => {
    return (products || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.buying_price) || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return (products || []).filter((p) => p.track_inventory !== false && p.stock > 0 && p.stock <= (p.low_stock_alert ?? 5)).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return (products || []).filter((p) => p.track_inventory !== false && p.stock <= 0).length;
  }, [products]);

  if (products === undefined || isLoading) {
    return <PageLoader message="Loading inventory..." messageSw="Inapakia hesabu ya stoki..." language={language} />;
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectProduct = (p: any) => {
    setSelectedProduct(p);
    setEditForm({ ...p, category_id: p.category_id || "none" });
    setIsAddingProduct(false);
    setShowBarcodePreview(false);
    if (isMobile) setMobileDrawerOpen(true);
  };

  const handleStartAddProduct = () => {
    setIsAddingProduct(true);
    setSelectedProduct(null);
    setEditForm(null);
    if (isMobile) setMobileDrawerOpen(true);
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) {
      toast.error(language === "sw" ? "Jaza jina la bidhaa au huduma" : "Fill in item name");
      return;
    }
    const isService = newProduct.item_type === "service";
    const codeVal = newProduct.code.trim() || `${isService ? "SRV" : "PRD"}-${Date.now().toString().slice(-6)}`;

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      const { data: profile } = await supabase.from("profiles").select("shop_id").eq("user_id", userId).maybeSingle();
      const shopId = profile?.shop_id;

      if (!shopId) throw new Error("No shop found");

      const created = await createProduct.mutateAsync({
        shop_id: shopId,
        code: codeVal,
        name: newProduct.name.trim(),
        name_sw: newProduct.name_sw.trim() || undefined,
        barcode: codeVal,
        item_type: newProduct.item_type,
        track_inventory: !isService,
        category_id: newProduct.category_id === "none" ? null : newProduct.category_id,
        buying_price: isService ? 0 : (Number(newProduct.buying_price) || 0),
        selling_price: Number(newProduct.selling_price) || 0,
        stock: isService ? 0 : (Number(newProduct.stock) || 0),
        low_stock_alert: isService ? 0 : (Number(newProduct.low_stock_alert) || 5),
        duration_minutes: isService && newProduct.duration_minutes ? parseInt(newProduct.duration_minutes, 10) : null,
        description: newProduct.description.trim() || null,
      } as any);

      toast.success(isService ? (language === "sw" ? "Huduma imeongezwa" : "Service added successfully") : (language === "sw" ? "Bidhaa imeongezwa stoo" : "Product added to inventory"));
      setIsAddingProduct(false);
      setMobileDrawerOpen(false);
      setNewProduct({
        item_type: "product",
        name: "",
        name_sw: "",
        code: "",
        category_id: "none",
        buying_price: "",
        selling_price: "",
        stock: "0",
        low_stock_alert: "5",
        duration_minutes: "",
        description: "",
      });
      if (created) handleSelectProduct(created);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add item");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editForm) return;
    const isService = editForm.item_type === "service";
    const codeVal = editForm.code || editForm.barcode || `PRD-${Date.now().toString().slice(-6)}`;
    try {
      await updateProduct.mutateAsync({
        id: editForm.id,
        code: codeVal,
        name: editForm.name,
        barcode: codeVal,
        item_type: editForm.item_type || "product",
        track_inventory: !isService,
        category_id: editForm.category_id === "none" ? null : editForm.category_id,
        buying_price: isService ? 0 : (Number(editForm.buying_price) || 0),
        selling_price: Number(editForm.selling_price) || 0,
        stock: isService ? 0 : (Number(editForm.stock) || 0),
        low_stock_alert: isService ? 0 : (Number(editForm.low_stock_alert) || 5),
        duration_minutes: isService && editForm.duration_minutes ? parseInt(editForm.duration_minutes, 10) : null,
      } as any);

      toast.success(language === "sw" ? "Imesasishwa kikamilifu" : "Updated successfully");
      setMobileDrawerOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update item");
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteProduct.mutateAsync(id)));
    playSound("success");
    setSelectedIds(new Set());
    setShowBulkDelete(false);
    toast.success(language === "sw" ? "Bidhaa zimefutwa" : "Products deleted");
  };

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? filteredProducts.filter((p) => selectedIds.has(p.id))
      : filteredProducts;

    if (!toExport.length) return;
    exportToCSV(
      toExport.map((p) => ({
        Code: p.barcode || p.sku || "PROD",
        Name: p.name,
        Stock: p.stock,
        "Buying Price": p.buying_price,
        "Selling Price": p.selling_price,
        Barcode: p.barcode ?? "",
      })),
      "inventory",
    );
  };

  const renderAddProductForm = () => {
    const isService = newProduct.item_type === "service";

    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            {isService ? <Sparkles className="h-4 w-4 text-amber-500" /> : <Package className="h-4 w-4 text-accent" />}
            <span>{isService ? (language === "sw" ? "Ongeza Huduma Mpya" : "Add New Service") : t("inventory.addProduct")}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsAddingProduct(false);
              setMobileDrawerOpen(false);
            }}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3.5">
          {/* Item Type Switcher: Physical Product vs Service */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl">
            <button
              type="button"
              onClick={() => setNewProduct((prev) => ({ ...prev, item_type: "product" }))}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                !isService
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="h-3.5 w-3.5" />
              <span>{language === "sw" ? "Bidhaa (Stoo)" : "Physical Product"}</span>
            </button>
            <button
              type="button"
              onClick={() => setNewProduct((prev) => ({ ...prev, item_type: "service" }))}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                isService
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === "sw" ? "Huduma" : "Service"}</span>
            </button>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {isService ? (language === "sw" ? "Jina la Huduma" : "Service Name") : t("inventory.name")} *
            </Label>
            <Input
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder={isService ? "e.g. Haircut & Wash, Car Oil Change, Repair" : "e.g. Twiga Cement 50kg, Coca Cola 500ml"}
              className="h-9 rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {isService ? (language === "sw" ? "Kodi (Hiari)" : "Code / SKU (Optional)") : `${t("inventory.code")} *`}
              </Label>
              <Input
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                placeholder={isService ? "SRV-01 (Auto if blank)" : "e.g. CEM-01"}
                className="h-9 rounded-xl border-border bg-background text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("inventory.category")}</Label>
              <Select
                value={newProduct.category_id}
                onValueChange={(v) => setNewProduct({ ...newProduct, category_id: v })}
              >
                <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-xs">
                  <SelectItem value="none">{language === "sw" ? "Bila Kundi" : "None"}</SelectItem>
                  {(categories || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-2">
            {!isService ? (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("inventory.buyingPrice")} (TSH)</Label>
                <Input
                  type="number"
                  value={newProduct.buying_price}
                  onChange={(e) => setNewProduct({ ...newProduct, buying_price: e.target.value })}
                  placeholder="20000"
                  className="h-9 rounded-xl border-border bg-background text-xs"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{language === "sw" ? "Muda (Dakika)" : "Duration (Mins)"}</Label>
                <Input
                  type="number"
                  value={newProduct.duration_minutes}
                  onChange={(e) => setNewProduct({ ...newProduct, duration_minutes: e.target.value })}
                  placeholder="e.g. 30, 60"
                  className="h-9 rounded-xl border-border bg-background text-xs"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {isService ? (language === "sw" ? "Gharama ya Huduma (TSH) *" : "Service Fee (TSH) *") : `${t("inventory.sellingPrice")} (TSH) *`}
              </Label>
              <Input
                type="number"
                value={newProduct.selling_price}
                onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                placeholder="25000"
                className="h-9 rounded-xl border-border bg-background text-xs font-bold"
              />
            </div>
          </div>

          {/* Physical Inventory Controls (Hidden for Services) */}
          {!isService && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t("inventory.stock")}</Label>
                <Input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="h-9 rounded-xl border-border bg-background text-xs text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{language === "sw" ? "Alert ya Chini" : "Low Alert"}</Label>
                <Input
                  type="number"
                  value={newProduct.low_stock_alert}
                  onChange={(e) => setNewProduct({ ...newProduct, low_stock_alert: e.target.value })}
                  className="h-9 rounded-xl border-border bg-background text-xs text-center"
                />
              </div>
            </div>
          )}

          {isService && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{language === "sw" ? "Maelezo (Hiari)" : "Description (Optional)"}</Label>
              <Input
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder={language === "sw" ? "Maelezo ya kile huduma inajumuisha..." : "Details of what this service covers..."}
                className="h-9 rounded-xl border-border bg-background text-xs"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingProduct(false);
                setMobileDrawerOpen(false);
              }}
              className="h-9 rounded-xl text-xs flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateProduct}
              disabled={createProduct.isPending || !newProduct.name.trim()}
              className="h-9 rounded-xl bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950 shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 flex-[2]"
            >
              {createProduct.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              <span>{isService ? (language === "sw" ? "Hifadhi Huduma" : "Save Service") : (language === "sw" ? "Hifadhi Bidhaa" : "Save Product")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEditProductForm = () => {
    if (!editForm) return null;
    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {editForm.name}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">{editForm.barcode || editForm.sku || "PROD"}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBarcodePreview(!showBarcodePreview)}
              className="h-7 rounded-lg text-xs gap-1"
            >
              <QrCode className="h-3 w-3 text-accent" />
              <span>{showBarcodePreview ? "Hide Code" : "Barcode"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProductToDeleteId(editForm.id)}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditForm(null);
                setSelectedProduct(null);
                setMobileDrawerOpen(false);
              }}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              title={language === "sw" ? "Funga jopo" : "Close panel"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3.5">
          {/* Barcode & QR Code Inline View */}
          {showBarcodePreview && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 p-4 border border-border space-y-2">
              <BarcodeGenerator value={editForm.barcode || editForm.name} type={barcodeType} />
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant={barcodeType === "barcode" ? "default" : "outline"}
                  onClick={() => setBarcodeType("barcode")}
                  className="h-6 rounded-lg text-[11px] px-2.5"
                >
                  Barcode
                </Button>
                <Button
                  size="sm"
                  variant={barcodeType === "qr" ? "default" : "outline"}
                  onClick={() => setBarcodeType("qr")}
                  className="h-6 rounded-lg text-[11px] px-2.5"
                >
                  QR Code
                </Button>
              </div>
            </div>
          )}

          {/* Item Type Switcher for Edit */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl">
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, item_type: "product" })}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
                editForm.item_type !== "service"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="h-3.5 w-3.5" />
              <span>{language === "sw" ? "Bidhaa" : "Product"}</span>
            </button>
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, item_type: "service" })}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
                editForm.item_type === "service"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === "sw" ? "Huduma" : "Service"}</span>
            </button>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {editForm.item_type === "service" ? (language === "sw" ? "Jina la Huduma" : "Service Name") : t("inventory.name")}
            </Label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="h-9 rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {editForm.item_type === "service" ? (language === "sw" ? "Kodi ya Huduma" : "Service Code") : t("inventory.code")}
              </Label>
              <Input
                value={editForm.code || editForm.barcode || editForm.sku || ""}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value, barcode: e.target.value })}
                className="h-9 rounded-xl border-border bg-background text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("inventory.category")}</Label>
              <Select
                value={editForm.category_id || "none"}
                onValueChange={(v) => setEditForm({ ...editForm, category_id: v })}
              >
                <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-xs">
                  <SelectItem value="none">{language === "sw" ? "Bila Kundi" : "None"}</SelectItem>
                  {(categories || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {editForm.item_type === "service" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {language === "sw" ? "Gharama ya Huduma (TSH)" : "Service Fee (TSH)"}
                </Label>
                <Input
                  type="number"
                  value={editForm.selling_price}
                  onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                  className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {language === "sw" ? "Muda (Dakika)" : "Duration (Mins)"}
                </Label>
                <Input
                  type="number"
                  value={editForm.duration_minutes || ""}
                  onChange={(e) => setEditForm({ ...editForm, duration_minutes: e.target.value })}
                  placeholder="30"
                  className="h-9 rounded-xl border-border bg-background text-xs"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("inventory.buyingPrice")}</Label>
                  <Input
                    type="number"
                    value={editForm.buying_price}
                    onChange={(e) => setEditForm({ ...editForm, buying_price: e.target.value })}
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("inventory.sellingPrice")}</Label>
                  <Input
                    type="number"
                    value={editForm.selling_price}
                    onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                    className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("inventory.stock")}</Label>
                  <Input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="h-9 rounded-xl border-border bg-background text-xs font-bold text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Alert ya Chini" : "Low Alert"}</Label>
                  <Input
                    type="number"
                    value={editForm.low_stock_alert}
                    onChange={(e) => setEditForm({ ...editForm, low_stock_alert: e.target.value })}
                    className="h-9 rounded-xl border-border bg-background text-xs text-center"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <Button
              onClick={handleUpdateProduct}
              disabled={updateProduct.isPending}
              className="h-9 w-full rounded-xl bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950 shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200"
            >
              {updateProduct.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 text-accent mr-1" />}
              <span>{language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("inventory.totalStockValue")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalStockValue)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground">{products?.length || 0} {language === "sw" ? "bidhaa zilizopo" : "total items"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zenye Stoki" : "In Stock"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">
              {(products?.length || 0) - lowStockCount - outOfStockCount}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Kiwango safi" : "Healthy levels"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Stoki Ndogo" : "Low Stock"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <AlertTriangle className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", lowStockCount > 0 ? "text-[var(--warning-text)]" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{lowStockCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Agiza haraka" : "Needs restock"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zimeisha" : "Out of Stock"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <XCircle className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", outOfStockCount > 0 ? "text-[var(--danger-text)]" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{outOfStockCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "0 zimebaki" : "0 remaining"}</p>
          </div>
        </Card>
      </div>

      {/* 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Master Products List / Table */}
        <div className={cn("space-y-4 transition-all duration-200", (isAddingProduct || editForm) ? "lg:col-span-7" : "lg:col-span-12")}>
          <Card className="border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "sw" ? "Tafuta jina/kodi..." : "Search..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="all">{language === "sw" ? "Makundi Yote" : "All Categories"}</SelectItem>
                    {(categories || []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={itemTypeFilter} onValueChange={(v: any) => setItemTypeFilter(v)}>
                  <SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-xs">
                    <SelectItem value="all">{language === "sw" ? "Aina Zote" : "All Items"}</SelectItem>
                    <SelectItem value="product">{language === "sw" ? "Bidhaa Pekee" : "Products Only"}</SelectItem>
                    <SelectItem value="service">{language === "sw" ? "Huduma Pekee" : "Services Only"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDelete(true)}
                    className="h-9 rounded-xl text-xs gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>({selectedIds.size})</span>
                  </Button>
                )}

                <Button
                  onClick={handleStartAddProduct}
                  className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  <span>{t("inventory.addProduct")}</span>
                </Button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {language === "sw" ? "Hakuna bidhaa zilizopatikana" : "No products found"}
                </p>
                <Button
                  onClick={handleStartAddProduct}
                  className="mt-3 h-8 rounded-xl text-xs bg-primary text-primary-foreground"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 text-accent" />
                  {t("inventory.addProduct")}
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile View: 4 Compact Cards per page */}
                <div className="md:hidden">
                  <div className="divide-y divide-border/60">
                    {currentMobileProducts.map((p) => {
                      const isSelected = selectedProduct?.id === p.id && !isAddingProduct;
                      const alertLimit = p.low_stock_alert ?? 5;
                      const tracksInventory = p.track_inventory !== false;
                      const isLow = tracksInventory && p.stock > 0 && p.stock <= alertLimit;
                      const isOut = tracksInventory && p.stock <= 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className={cn(
                            "flex items-center justify-between p-3.5 transition-colors active:bg-muted/60 cursor-pointer",
                            isSelected ? "bg-accent/10" : ""
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-semibold text-xs text-foreground truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>{p.barcode || p.sku || "PROD"}</span>
                              <span>•</span>
                              <span className="font-bold text-foreground">{formatMoney(p.selling_price)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {tracksInventory ? (
                              isOut ? (
                                <span className="badge-danger text-[10px] px-2 py-0.5">{language === "sw" ? "Imeisha" : "Out"}</span>
                              ) : isLow ? (
                                <span className="badge-warning text-[10px] px-2 py-0.5">{p.stock} pcs</span>
                              ) : (
                                <span className="badge-success text-[10px] px-2 py-0.5">{p.stock} pcs</span>
                              )
                            ) : (
                              <span className="badge-neutral text-[10px] px-2 py-0.5">{language === "sw" ? "Huduma" : "Service"}</span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalMobileProductPages > 1 && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileProductPage <= 1}
                        onClick={() => setMobileProductPage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {language === "sw" ? "Iliyopita" : "Previous"}
                      </Button>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {mobileProductPage} / {totalMobileProductPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileProductPage >= totalMobileProductPages}
                        onClick={() => setMobileProductPage((p) => Math.min(totalMobileProductPages, p + 1))}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {language === "sw" ? "Inayofuata" : "Next"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop View: Full Table */}
                <div className="internal-table-scroll w-full hidden md:block">
                  <Table className="min-w-[650px] w-full">
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("inventory.code")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("inventory.name")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("inventory.sellingPrice")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("inventory.stock")}</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((p) => {
                        const isSelected = selectedProduct?.id === p.id && !isAddingProduct;
                        const alertLimit = p.low_stock_alert ?? 5;
                        const tracksInventory = p.track_inventory !== false;
                        const isLow = tracksInventory && p.stock > 0 && p.stock <= alertLimit;
                        const isOut = tracksInventory && p.stock <= 0;

                        return (
                          <TableRow
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            className={cn(
                              "cursor-pointer border-b border-border/60 transition-colors",
                              isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                            )}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(p.id)}
                                onCheckedChange={() => toggleSelect(p.id)}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-bold text-foreground">{p.barcode || p.sku || "PROD"}</TableCell>
                            <TableCell className="text-xs font-semibold text-foreground">
                              {p.name}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-foreground">{formatMoney(p.selling_price)}</TableCell>
                            <TableCell>
                              {tracksInventory ? (
                                isOut ? (
                                  <span className="badge-danger">{language === "sw" ? "Imeisha" : "Out"}</span>
                                ) : isLow ? (
                                  <span className="badge-warning">{p.stock} pcs</span>
                                ) : (
                                  <span className="badge-success">{p.stock} pcs</span>
                                )
                              ) : (
                                <span className="badge-neutral">{language === "sw" ? "Huduma" : "Service"}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected ? "text-accent translate-x-1" : "text-muted-foreground")} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Desktop Right Column: Inline Detail / Add / Edit Panel */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {isAddingProduct && renderAddProductForm()}
          {!isAddingProduct && editForm && renderEditProductForm()}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Adding / Editing Product */}
      <Sheet open={Boolean(isMobile && mobileDrawerOpen)} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 border-t border-border bg-card lg:hidden">
          <div className="p-1">
            {isAddingProduct && renderAddProductForm()}
            {!isAddingProduct && editForm && renderEditProductForm()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Product Confirm */}
      <AlertDialog open={!!productToDeleteId} onOpenChange={(o) => !o && setProductToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa bidhaa hii?" : "Delete this product?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDeleteId && deleteProduct.mutate(productToDeleteId, { onSettled: () => setProductToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Futa" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirm */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa bidhaa zote zilizochaguliwa?" : "Delete all selected products?"}</AlertDialogTitle>
            <AlertDialogDescription>{language === "sw" ? `Bidhaa ${selectedIds.size} zitafutwa kabisa.` : `${selectedIds.size} products will be permanently removed.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === "sw" ? "Futa Zote" : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
