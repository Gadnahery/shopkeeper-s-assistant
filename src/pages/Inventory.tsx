import { useState, useEffect } from "react";
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
import { Search, Download, Plus, Pencil, Trash2, AlertTriangle, Loader2, QrCode, Package, FolderTree } from "lucide-react";
import { useProducts, useDeleteProduct, useUpdateProduct } from "@/hooks/useProducts";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { EmptyState } from "@/components/EmptyState";
import { exportToCSV } from "@/utils/exportData";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/sounds";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function Inventory() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
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

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
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

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const isLowStock = (stock: number, alert: number) => stock <= alert;
  const getProductName = (product: typeof filteredProducts[0]) => language === "sw" && product.name_sw ? product.name_sw : product.name;

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
        <>
        <div className="flex min-w-0 w-full flex-wrap gap-2 xl:w-auto xl:flex-nowrap">
          <div className="relative w-full sm:max-w-sm xl:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
            <Input placeholder={t("inventory.searchPlaceholder")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" autoFocus />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={language === "sw" ? "Kategoria" : "Category"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{language === "sw" && c.name_sw ? c.name_sw : c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(v: "all" | "in-stock" | "low" | "out") => setStockFilter(v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={language === "sw" ? "Stoki" : "Stock"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
              <SelectItem value="in-stock">{language === "sw" ? "Ipo stoki" : "In Stock"}</SelectItem>
              <SelectItem value="low">{language === "sw" ? "Stoki kidogo" : "Low Stock"}</SelectItem>
              <SelectItem value="out">{language === "sw" ? "Hakuna stoki" : "Out of Stock"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full flex-wrap gap-2 md:gap-3 xl:w-auto xl:justify-end">
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="py-1.5 px-2 gap-1">
              <Package className="h-3.5 w-3" />
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
          <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={() => { playSound("click"); navigate("/inventory/add"); }}>
            <Plus className="h-4 w-4" />{t("inventory.addProduct")}
          </Button>
          <Button variant="outline" className="gap-2 hover:border-blue-500/30 dark:hover:border-blue-400/40" onClick={() => { playSound("click"); navigate("/inventory/receive"); }}>
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {language === "sw" ? "Pokea Stoki" : "Receive Stock"}
          </Button>
        </div>
        </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="section-shell border-primary/20">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("inventory.totalStockValue")}</p>
              <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">Tsh {formatNumber(totalStockValue)}</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Bidhaa za low stock" : "Low stock items"}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{lowStockCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{language === "sw" ? "Hazina stoki" : "Out of stock"}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{outOfStockCount}</p>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-500">
              <Trash2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
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
            <div className="grid gap-3 p-4 md:hidden">
              {filteredProducts.length === 0 ? (
                <EmptyState
                  title={products?.length === 0 ? (language === "sw" ? "Hakuna bidhaa bado" : "No products yet") : (language === "sw" ? "Hakuna matokeo" : "No matching products")}
                  description={products?.length === 0 ? (language === "sw" ? "Ongeza bidhaa mpya ili kuanza kusimamia stoki." : "Add your first product to start managing stock.") : (language === "sw" ? "Badilisha vichujio au tafuta kwa jina/kodi nyingine." : "Try changing filters or searching another product name/code.")}
                  icon={<Package className="h-8 w-8" />}
                  actionLabel={products?.length === 0 ? t("inventory.addProduct") : undefined}
                  onAction={products?.length === 0 ? () => navigate("/inventory/add") : undefined}
                />
              ) : (
                filteredProducts.map((product) => (
                  <Card key={product.id} className="border-border/70 bg-background/60">
                    <CardContent className="space-y-3 p-4">
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
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("inventory.stock")}</span>
                        <span className={isLowStock(product.stock, product.low_stock_alert) ? "font-semibold text-destructive" : "font-semibold"}>{product.stock}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("inventory.priceCol")}</span>
                        <span className="font-semibold">{formatNumber(product.selling_price)}</span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
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
