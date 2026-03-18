import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Search, Download, Upload, Plus, Pencil, Trash2, AlertTriangle, Loader2, QrCode, Package, FolderTree } from "lucide-react";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/useProducts";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { EmptyState } from "@/components/EmptyState";
import { exportToCSV, parseCSV } from "@/utils/exportData";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/sounds";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

export default function Inventory() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isMobile } = useAdaptiveLayout();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBarcode, setShowBarcode] = useState<string | null>(null);
  const [barcodeType, setBarcodeType] = useState<"barcode" | "qr">("barcode");
  const [editProduct, setEditProduct] = useState<Record<string, unknown> | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  if (products === undefined || isLoading) {
    return <PageLoader message="Loading inventory..." messageSw="Inapakia hesabu..." language={language} />;
  }

  const filteredProducts =
    products?.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name_sw && p.name_sw.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
      const lowAlert = p.low_stock_alert ?? 5;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && p.stock > lowAlert) ||
        (stockFilter === "low" && p.stock > 0 && p.stock <= lowAlert) ||
        (stockFilter === "out" && p.stock <= 0);
      return matchesSearch && matchesCategory && matchesStock;
    }) ?? [];
  const mobileVisibleProducts = isMobile ? filteredProducts.slice(0, searchTerm ? 10 : 8) : filteredProducts;

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const isLowStock = (stock: number, alert: number) => stock <= alert;
  const getProductName = (product: typeof filteredProducts[0]) => language === "sw" && product.name_sw ? product.name_sw : product.name;
  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, language === "sw" && category.name_sw ? category.name_sw : category.name]));

  const totalStockValue = filteredProducts.reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.buying_price) || 0),
    0
  );
  const lowStockCount = filteredProducts.filter((p) => p.stock > 0 && p.stock <= (p.low_stock_alert ?? 5)).length;
  const outOfStockCount = filteredProducts.filter((p) => p.stock <= 0).length;
  const profitFor = (p: typeof filteredProducts[0]) => {
    const buy = Number(p.buying_price) || 0;
    const sell = Number(p.selling_price) || 0;
    const profit = sell - buy;
    const pct = buy > 0 ? (profit / buy) * 100 : 0;
    return { profit, pct };
  };

  const inventoryStats = [
    {
      label: t("inventory.totalStockValue"),
      value: `Tsh ${formatNumber(totalStockValue)}`,
      icon: Package,
      iconClass: "text-primary",
      shellClass: "border-primary/20",
    },
    {
      label: language === "sw" ? "Bidhaa za low stock" : "Low stock items",
      value: `${lowStockCount}`,
      icon: AlertTriangle,
      iconClass: "text-amber-600",
      shellClass: "",
    },
    {
      label: language === "sw" ? "Hazina stoki" : "Out of stock",
      value: `${outOfStockCount}`,
      icon: Trash2,
      iconClass: "text-red-500",
      shellClass: "",
    },
    {
      label: language === "sw" ? "Bidhaa zinazoonekana" : "Visible products",
      value: `${filteredProducts.length}`,
      icon: FolderTree,
      iconClass: "text-blue-600",
      shellClass: "",
    },
  ];
  const visibleInventoryStats = isMobile ? [inventoryStats[0], inventoryStats[1], inventoryStats[3]] : inventoryStats;

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? filteredProducts.filter((p) => selectedIds.has(p.id))
      : filteredProducts;
    if (!toExport.length) return;
    exportToCSV(
      toExport.map((p) => ({
        Code: p.code,
        Name: p.name,
        Stock: p.stock,
        "Buying Price": p.buying_price,
        "Selling Price": p.selling_price,
        Barcode: p.barcode ?? "",
      })),
      "inventory"
    );
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      const rows = parseCSV(content);
      if (!rows.length) throw new Error(language === "sw" ? "CSV haina data." : "CSV has no rows.");

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error(language === "sw" ? "Ingia tena ili kuendelea." : "Please sign in again.");

      const { data: profile } = await supabase.from("profiles").select("shop_id").eq("user_id", userId).maybeSingle();
      const shopId = profile?.shop_id;
      if (!shopId) throw new Error(language === "sw" ? "Duka halijapatikana." : "No shop found.");

      const existingByCode = new Map(products.map((product) => [product.code.toLowerCase(), product]));
      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const code = (row.Code || row.code || "").trim();
        const name = (row.Name || row.name || "").trim();
        if (!code || !name) continue;

        const payload = {
          code,
          name,
          name_sw: row["Name Sw"] || row.name_sw || name,
          stock: Number(row.Stock || row.stock || 0),
          buying_price: Number(row["Buying Price"] || row.buying_price || 0),
          selling_price: Number(row["Selling Price"] || row.selling_price || 0),
          barcode: (row.Barcode || row.barcode || "").trim() || null,
          low_stock_alert: Number(row["Low Stock Alert"] || row.low_stock_alert || 5),
          shop_id: shopId,
        };

        const existing = existingByCode.get(code.toLowerCase());
        if (existing) {
          await updateProduct.mutateAsync({ id: existing.id, ...payload });
          updated += 1;
        } else {
          await createProduct.mutateAsync(payload);
          created += 1;
        }
      }

      toast.success(
        language === "sw"
          ? `Uingizaji umekamilika. Zimeongezwa ${created}, zimeboreshwa ${updated}.`
          : `Import complete. Created ${created}, updated ${updated}.`
      );
      playSound("success");
    } catch (error: any) {
      toast.error(error?.message || (language === "sw" ? "Uingizaji umeshindikana." : "Import failed."));
    } finally {
      event.target.value = "";
      setIsImporting(false);
    }
  };

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

  const handleBulkDelete = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => deleteProduct.mutateAsync(id)));
    playSound("success");
    setSelectedIds(new Set());
    setShowBulkDelete(false);
  };

  const handleBulkChangeCategory = async () => {
    if (!bulkCategoryId) return;
    await Promise.all(Array.from(selectedIds).map((id) => updateProduct.mutateAsync({ id, category_id: bulkCategoryId })));
    playSound("success");
    setSelectedIds(new Set());
    setShowBulkCategory(false);
    setBulkCategoryId("");
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    await updateProduct.mutateAsync({
      id: editProduct.id, name: editProduct.name, name_sw: editProduct.name_sw || null,
      buying_price: parseFloat(editProduct.buying_price) || 0, selling_price: parseFloat(editProduct.selling_price) || 0,
      stock: parseInt(editProduct.stock) || 0, low_stock_alert: parseInt(editProduct.low_stock_alert) || 5,
      category_id: editProduct.category_id || null, barcode: editProduct.barcode || null,
    });
    playSound("success");
    setEditProduct(null);
  };

  const handleGenerateBarcode = (product: (typeof filteredProducts)[0]) => {
    if (!product.barcode) {
      // Auto-generate barcode from code
      const barcode = product.code;
      updateProduct.mutate({ id: product.id, barcode });
    }
    setShowBarcode(product.id);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Hesabu" : "Inventory"}
        subtitle={language === "sw" ? "Dhibiti bidhaa, stoki, na bei kwa urahisi" : "Manage products, stock levels, and pricing"}
        actions={
          isMobile ? (
            <>
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="gap-1 px-2 py-1.5">
                  <Package className="h-3.5 w-3.5" />
                  {selectedIds.size} {language === "sw" ? "zimechaguliwa" : "selected"}
                </Badge>
              )}
              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30"
                  onClick={() => {
                    playSound("click");
                    navigate("/inventory/add");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("inventory.addProduct")}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40"
                  onClick={() => {
                    playSound("click");
                    navigate("/inventory/receive");
                  }}
                >
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {language === "sw" ? "Pokea" : "Receive"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 w-full flex-col gap-2 xl:w-auto">
                <div className="relative w-full xl:w-[24rem]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                  <Input placeholder={t("inventory.searchPlaceholder")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-11 pl-10" autoFocus />
                </div>
                <div className="flex w-full flex-wrap gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11 w-full sm:w-44"><SelectValue placeholder={language === "sw" ? "Kategoria" : "Category"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{language === "sw" && c.name_sw ? c.name_sw : c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={stockFilter} onValueChange={(v: "all" | "in-stock" | "low" | "out") => setStockFilter(v)}>
                    <SelectTrigger className="h-11 w-full sm:w-40"><SelectValue placeholder={language === "sw" ? "Stoki" : "Stock"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
                      <SelectItem value="in-stock">{language === "sw" ? "Ipo stoki" : "In Stock"}</SelectItem>
                      <SelectItem value="low">{language === "sw" ? "Stoki kidogo" : "Low Stock"}</SelectItem>
                      <SelectItem value="out">{language === "sw" ? "Hakuna stoki" : "Out of Stock"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-2 md:gap-3 xl:w-auto xl:justify-end">
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1.5">
                    <Package className="h-3.5 w-3.5" />
                    {selectedIds.size} {language === "sw" ? "zimechaguliwa" : "selected"}
                  </Badge>
                )}
                {selectedIds.size > 0 && (
                  <>
                    <Button variant="outline" size="sm" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={() => setShowBulkCategory(true)} disabled={updateProduct.isPending}>
                      <FolderTree className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                      {t("inventory.changeCategory")}
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={() => setShowBulkDelete(true)} disabled={deleteProduct.isPending}>
                      <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                      {t("inventory.deleteSelected")}
                    </Button>
                  </>
                )}
                <Button variant="outline" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={handleExport} disabled={filteredProducts.length === 0}>
                  <Download className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" /><span className="hidden md:inline">{selectedIds.size > 0 ? t("inventory.exportSelected") : t("inventory.export")}</span>
                </Button>
                <Button variant="outline" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={() => importInputRef.current?.click()} disabled={isImporting}>
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" /> : <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  <span className="hidden md:inline">{language === "sw" ? "Ingiza CSV" : "Import CSV"}</span>
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={() => { playSound("click"); navigate("/inventory/add"); }}>
                  <Plus className="h-4 w-4" />{t("inventory.addProduct")}
                </Button>
                <Button variant="outline" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={() => { playSound("click"); navigate("/inventory/receive"); }}>
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {language === "sw" ? "Pokea Stoki" : "Receive Stock"}
                </Button>
              </div>
            </>
          )
        }
      />
      <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />

      {isMobile && (
        <Card className="section-shell">
          <CardContent className="space-y-4 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" />
              <Input
                placeholder={t("inventory.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11"><SelectValue placeholder={language === "sw" ? "Kategoria" : "Category"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {language === "sw" && category.name_sw ? category.name_sw : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={(value: "all" | "in-stock" | "low" | "out") => setStockFilter(value)}>
                <SelectTrigger className="h-11"><SelectValue placeholder={language === "sw" ? "Stoki" : "Stock"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
                  <SelectItem value="in-stock">{language === "sw" ? "Ipo stoki" : "In Stock"}</SelectItem>
                  <SelectItem value="low">{language === "sw" ? "Stoki kidogo" : "Low Stock"}</SelectItem>
                  <SelectItem value="out">{language === "sw" ? "Hakuna stoki" : "Out of Stock"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowBulkCategory(true)} disabled={updateProduct.isPending}>
                  <FolderTree className="h-4 w-4 text-blue-600" />
                  {t("inventory.changeCategory")}
                </Button>
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => setShowBulkDelete(true)} disabled={deleteProduct.isPending}>
                  <Trash2 className="h-4 w-4" />
                  {t("inventory.deleteSelected")}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExport} disabled={filteredProducts.length === 0}>
                <Download className="h-4 w-4 text-blue-600" />
                {selectedIds.size > 0 ? (language === "sw" ? "Pakua chaguo" : "Export picks") : t("inventory.export")}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => importInputRef.current?.click()} disabled={isImporting}>
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <Upload className="h-4 w-4 text-blue-600" />}
                {language === "sw" ? "Ingiza CSV" : "Import CSV"}
              </Button>
            </div>

            <div className="rounded-[1.1rem] border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {language === "sw" ? "Mwonekano wa bidhaa" : "Product preview"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "sw"
                      ? "Telezesha kushoto au kulia kuona bidhaa moja baada ya nyingine."
                      : "Swipe left or right to review one product at a time."}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {mobileVisibleProducts.length}/{filteredProducts.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleInventoryStats.map((stat) => (
          <Card key={stat.label} className={`section-shell ${stat.shellClass}`}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{stat.value}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/65 p-3">
                <stat.icon className={`h-5 w-5 ${stat.iconClass}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("common.edit")} {language === "sw" ? "Bidhaa" : "Product"}</DialogTitle></DialogHeader>
          {editProduct && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("addProduct.productName")}</Label><Input value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value, name_sw: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("addProduct.buyingPrice")}</Label><Input type="number" value={editProduct.buying_price} onChange={e => setEditProduct({ ...editProduct, buying_price: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("addProduct.sellingPrice")}</Label><Input type="number" value={editProduct.selling_price} onChange={e => setEditProduct({ ...editProduct, selling_price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("addProduct.initialStock")}</Label><Input type="number" value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("addProduct.lowStockAlert")}</Label><Input type="number" value={editProduct.low_stock_alert} onChange={e => setEditProduct({ ...editProduct, low_stock_alert: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>{t("addProduct.barcode")}</Label><Input value={editProduct.barcode || ""} onChange={e => setEditProduct({ ...editProduct, barcode: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>{t("addProduct.category")}</Label>
                <Select value={editProduct.category_id || ""} onValueChange={v => setEditProduct({ ...editProduct, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t("addProduct.selectCategory")} /></SelectTrigger>
                  <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{language === "sw" && c.name_sw ? c.name_sw : c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handleSaveEdit} 
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Change Category Dialog */}
      <Dialog open={showBulkCategory} onOpenChange={setShowBulkCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("inventory.changeCategory")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t("inventory.newCategory")}</Label>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger><SelectValue placeholder={t("inventory.selectCategory")} /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{language === "sw" && c.name_sw ? c.name_sw : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} {t("inventory.productsWillBeUpdated")}
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
              onClick={handleBulkChangeCategory} 
              disabled={!bulkCategoryId || updateProduct.isPending}
            >
              {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("inventory.applyCategory")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "sw" ? "Futa bidhaa zilizochaguliwa?" : "Delete selected products?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "sw"
                ? `Una uhakika unataka kufuta bidhaa ${selectedIds.size}? Kitendo hiki hakiwezi kufutwa.`
                : `Are you sure you want to delete ${selectedIds.size} products? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "sw" ? "Ghairi" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Futa" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single product delete confirmation */}
      <AlertDialog open={!!productToDeleteId} onOpenChange={(open) => !open && setProductToDeleteId(null)}>
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
              {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode Dialog */}
      <Dialog open={!!showBarcode} onOpenChange={(o) => !o && setShowBarcode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === "sw" ? "Barcode ya Bidhaa" : "Product Barcode"}</DialogTitle></DialogHeader>
          {showBarcode && (() => {
            const product = products?.find(p => p.id === showBarcode);
            if (!product) return null;
            return (
              <div className="space-y-4 pt-4">
                <div className="flex gap-2 justify-center">
                  <Button variant={barcodeType === "barcode" ? "default" : "outline"} size="sm" onClick={() => setBarcodeType("barcode")}>Barcode</Button>
                  <Button variant={barcodeType === "qr" ? "default" : "outline"} size="sm" onClick={() => setBarcodeType("qr")}><QrCode className="h-4 w-4 mr-1" />QR Code</Button>
                </div>
                <BarcodeGenerator value={product.barcode || product.code} productId={product.id} productName={getProductName(product)} price={product.selling_price} format={barcodeType === "qr" ? "qr" : "code128"} />
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Card className="section-shell overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
            <div className="hidden max-w-full overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>{t("inventory.code")}</TableHead>
                    <TableHead>{t("inventory.name")}</TableHead>
                    <TableHead>{t("inventory.stock")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("inventory.priceCol")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("inventory.profitPercent")}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t("inventory.profit")}</TableHead>
                    <TableHead className="text-right">{t("inventory.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8">
                        <EmptyState
                          title={products?.length === 0 ? (language === "sw" ? "Hakuna bidhaa bado" : "No products yet") : (language === "sw" ? "Hakuna matokeo" : "No matching products")}
                          description={products?.length === 0 ? (language === "sw" ? "Ongeza bidhaa mpya ili kuanza kusimamia stoki." : "Add your first product to start managing stock.") : (language === "sw" ? "Badilisha vichujio au tafuta kwa jina/kodi nyingine." : "Try changing filters or searching another product name/code.")}
                          icon={<Package className="h-8 w-8" />}
                          actionLabel={products?.length === 0 ? t("inventory.addProduct") : undefined}
                          onAction={products?.length === 0 ? () => navigate("/inventory/add") : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">{product.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isLowStock(product.stock, product.low_stock_alert) && (
                            <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />{t("inventory.low")}</Badge>
                          )}
                          <span className={isLowStock(product.stock, product.low_stock_alert) ? "text-destructive" : ""}>{getProductName(product)}</span>
                        </div>
                      </TableCell>
                      <TableCell className={isLowStock(product.stock, product.low_stock_alert) ? "text-destructive font-medium" : ""}>{product.stock}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatNumber(product.selling_price)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        {profitFor(product).pct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        {formatNumber(profitFor(product).profit)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleGenerateBarcode(product)} title="Barcode">
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct({ ...product })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setProductToDeleteId(product.id)} disabled={deleteProduct.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-4 md:hidden">
              {filteredProducts.length === 0 ? (
                <EmptyState
                  title={products?.length === 0 ? (language === "sw" ? "Hakuna bidhaa bado" : "No products yet") : (language === "sw" ? "Hakuna matokeo" : "No matching products")}
                  description={products?.length === 0 ? (language === "sw" ? "Ongeza bidhaa mpya ili kuanza kusimamia stoki." : "Add your first product to start managing stock.") : (language === "sw" ? "Badilisha vichujio au tafuta kwa jina/kodi nyingine." : "Try changing filters or searching another product name/code.")}
                  icon={<Package className="h-8 w-8" />}
                  actionLabel={products?.length === 0 ? t("inventory.addProduct") : undefined}
                  onAction={products?.length === 0 ? () => navigate("/inventory/add") : undefined}
                />
              ) : (
                mobileVisibleProducts.map((product) => (
                  <Card key={product.id} className="min-w-full snap-center border-border/70 bg-background/65 shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{getProductName(product)}</p>
                          <p className="text-xs text-muted-foreground">{product.code}</p>
                        </div>
                        <Checkbox
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.category_id && (
                          <Badge variant="secondary" className="rounded-full">
                            {categoryNameById.get(product.category_id) || (language === "sw" ? "Kategoria" : "Category")}
                          </Badge>
                        )}
                        {product.stock <= 0 ? (
                          <Badge variant="destructive" className="rounded-full">
                            {language === "sw" ? "Hakuna stoki" : "Out of stock"}
                          </Badge>
                        ) : isLowStock(product.stock, product.low_stock_alert) ? (
                          <Badge variant="destructive" className="rounded-full gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {t("inventory.low")}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-3 gap-3 rounded-[1rem] border border-border/70 bg-background/80 p-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("inventory.stock")}</p>
                          <p className={isLowStock(product.stock, product.low_stock_alert) ? "mt-1 font-semibold text-destructive" : "mt-1 font-semibold"}>
                            {product.stock}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Bei" : "Price"}</p>
                          <p className="mt-1 font-semibold">{formatNumber(product.selling_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Faida %" : "Margin"}</p>
                          <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">{profitFor(product).pct.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" className="h-10 gap-1 px-2" onClick={() => handleGenerateBarcode(product)} title="Barcode">
                          <QrCode className="h-4 w-4" />
                          <span className="text-xs">{language === "sw" ? "Kodi" : "Code"}</span>
                        </Button>
                        <Button variant="outline" className="h-10 gap-1 px-2" onClick={() => setEditProduct({ ...product })}>
                          <Pencil className="h-4 w-4" />
                          <span className="text-xs">{t("common.edit")}</span>
                        </Button>
                        <Button variant="outline" className="h-10 gap-1 px-2 text-destructive hover:text-destructive" onClick={() => setProductToDeleteId(product.id)} disabled={deleteProduct.isPending}>
                          <Trash2 className="h-4 w-4" />
                          <span className="text-xs">{t("common.delete")}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
