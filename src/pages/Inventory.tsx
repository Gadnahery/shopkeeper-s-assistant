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
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Inventory() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isAddingProduct, setIsAddingProduct] = useState(searchParams.get("new") === "true");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);
  const [barcodeType, setBarcodeType] = useState<"barcode" | "qr">("barcode");

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: "",
    name_sw: "",
    code: "",
    category_id: "none",
    buying_price: "",
    selling_price: "",
    stock: "0",
    low_stock_alert: "5",
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
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && (p.track_inventory === false || p.stock > alertLimit)) ||
        (stockFilter === "low" && p.track_inventory !== false && p.stock > 0 && p.stock <= alertLimit) ||
        (stockFilter === "out" && p.track_inventory !== false && p.stock <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

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
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.code.trim()) {
      toast.error(language === "sw" ? "Jaza jina na kodi ya bidhaa" : "Fill in product name and code");
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      const { data: profile } = await supabase.from("profiles").select("shop_id").eq("user_id", userId).maybeSingle();
      const shopId = profile?.shop_id;

      if (!shopId) throw new Error("No shop found");

      const created = await createProduct.mutateAsync({
        shop_id: shopId,
        name: newProduct.name.trim(),
        barcode: newProduct.code.trim() || undefined,
        category_id: newProduct.category_id === "none" ? null : newProduct.category_id,
        buying_price: Number(newProduct.buying_price) || 0,
        selling_price: Number(newProduct.selling_price) || 0,
        stock: Number(newProduct.stock) || 0,
        low_stock_alert: Number(newProduct.low_stock_alert) || 5,
      });

      toast.success(language === "sw" ? "Bidhaa imeongezwa stoo" : "Product added to inventory");
      setIsAddingProduct(false);
      setNewProduct({
        name: "",
        name_sw: "",
        code: "",
        category_id: "none",
        buying_price: "",
        selling_price: "",
        stock: "0",
        low_stock_alert: "5",
      });
      if (created) handleSelectProduct(created);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add product");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editForm) return;
    try {
      await updateProduct.mutateAsync({
        id: editForm.id,
        name: editForm.name,
        barcode: (editForm as any).code || editForm.barcode || undefined,
        category_id: editForm.category_id === "none" ? null : editForm.category_id,
        buying_price: Number(editForm.buying_price) || 0,
        selling_price: Number(editForm.selling_price) || 0,
        stock: Number(editForm.stock) || 0,
        low_stock_alert: Number(editForm.low_stock_alert) || 5,
      });

      toast.success(language === "sw" ? "Bidhaa imesasishwa" : "Product updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update product");
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

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("inventory.totalStockValue")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Package className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(totalStockValue)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{products?.length || 0} {language === "sw" ? "bidhaa zilizopo" : "total catalog items"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Bidhaa Zenye Stoki" : "In Stock"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {(products?.length || 0) - lowStockCount - outOfStockCount}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Kiwango cha kuridhisha" : "Healthy stock levels"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Stoki Ndogo" : "Low Stock Alert"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <AlertTriangle className={cn("h-4 w-4", lowStockCount > 0 ? "text-[var(--warning-text)]" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{lowStockCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Zinahitaji kuagizwa" : "Needs restock"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Zimeisha Kabisa" : "Out of Stock"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <XCircle className={cn("h-4 w-4", outOfStockCount > 0 ? "text-[var(--danger-text)]" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{outOfStockCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "0 units remaining" : "0 units remaining"}</p>
          </div>
        </Card>
      </div>

      {/* 2-Column Master-Detail Layout (NO POPUPS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master Products Table - expands to 12 cols when unselected) */}
        <div className={cn("space-y-4 transition-all duration-200", (isAddingProduct || editForm) ? "lg:col-span-7" : "lg:col-span-12")}>
          <Card className="border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
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
                  onClick={() => {
                    setIsAddingProduct(true);
                    setSelectedProduct(null);
                    setEditForm(null);
                  }}
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
                  onClick={() => {
                    setIsAddingProduct(true);
                    setSelectedProduct(null);
                    setEditForm(null);
                  }}
                  className="mt-3 h-8 rounded-xl text-xs bg-primary text-primary-foreground"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 text-accent" />
                  {t("inventory.addProduct")}
                </Button>
              </div>
            ) : (
              <div className="internal-table-scroll w-full">
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
            )}
          </Card>
        </div>

        {/* Right Column (Inline Detail / Add / Edit Panel - 5 Cols, NO POPUPS) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Case 1: Inline Add Product Form */}
          {isAddingProduct && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" />
                  <span>{t("inventory.addProduct")}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddingProduct(false)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("inventory.name")} *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Twiga Cement 50kg"
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{t("inventory.code")} *</Label>
                    <Input
                      value={newProduct.code}
                      onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                      placeholder="e.g. CEM-01"
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

                <div className="grid grid-cols-2 gap-2">
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
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{t("inventory.sellingPrice")} (TSH)</Label>
                    <Input
                      type="number"
                      value={newProduct.selling_price}
                      onChange={(e) => setNewProduct({ ...newProduct, selling_price: e.target.value })}
                      placeholder="25000"
                      className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                    />
                  </div>
                </div>

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

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAddingProduct(false)} className="h-9 rounded-xl text-xs flex-1">
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleCreateProduct}
                    disabled={createProduct.isPending || !newProduct.name.trim()}
                    className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2]"
                  >
                    {createProduct.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    <span>{language === "sw" ? "Hifadhi Bidhaa" : "Save Product"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 2: Inline Selected Product Details & Edit */}
          {!isAddingProduct && editForm && (
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

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("inventory.name")}</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{t("inventory.code")}</Label>
                    <Input
                      value={editForm.barcode || editForm.sku || ""}
                      onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
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

                <div className="pt-2">
                  <Button
                    onClick={handleUpdateProduct}
                    disabled={updateProduct.isPending}
                    className="h-9 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    {updateProduct.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 text-accent mr-1" />}
                    <span>{language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
