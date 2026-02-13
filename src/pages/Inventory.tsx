import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Plus, Pencil, Trash2, AlertTriangle, Loader2, QrCode } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts, useDeleteProduct, useUpdateProduct } from "@/hooks/useProducts";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { exportToCSV } from "@/utils/exportData";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";

export default function Inventory() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showBarcode, setShowBarcode] = useState<string | null>(null);
  const [barcodeType, setBarcodeType] = useState<"barcode" | "qr">("barcode");
  const [editProduct, setEditProduct] = useState<any>(null);

  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const filteredProducts = products?.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name_sw && p.name_sw.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (categoryFilter === "all" || p.category_id === categoryFilter)
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const isLowStock = (stock: number, alert: number) => stock <= alert;
  const getProductName = (product: typeof filteredProducts[0]) => language === "sw" && product.name_sw ? product.name_sw : product.name;

  const handleExport = () => {
    if (!products?.length) return;
    exportToCSV(products.map(p => ({ Code: p.code, Name: p.name, Stock: p.stock, "Buying Price": p.buying_price, "Selling Price": p.selling_price, Barcode: p.barcode || "" })), "inventory");
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    await updateProduct.mutateAsync({
      id: editProduct.id, name: editProduct.name, name_sw: editProduct.name_sw || null,
      buying_price: parseFloat(editProduct.buying_price) || 0, selling_price: parseFloat(editProduct.selling_price) || 0,
      stock: parseInt(editProduct.stock) || 0, low_stock_alert: parseInt(editProduct.low_stock_alert) || 5,
      category_id: editProduct.category_id || null, barcode: editProduct.barcode || null,
    });
    setEditProduct(null);
  };

  const handleGenerateBarcode = (product: any) => {
    if (!product.barcode) {
      // Auto-generate barcode from code
      const barcode = product.code;
      updateProduct.mutate({ id: product.id, barcode });
    }
    setShowBarcode(product.id);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t("inventory.searchPlaceholder")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" autoFocus />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder={language === "sw" ? "Kategoria" : "Category"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "sw" ? "Zote" : "All"}</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{language === "sw" && c.name_sw ? c.name_sw : c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /><span className="hidden md:inline">{t("inventory.export")}</span>
          </Button>
          <Button className="gap-2" onClick={() => navigate("/inventory/add")}>
            <Plus className="h-4 w-4" />{t("inventory.addProduct")}
          </Button>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("common.edit")} {language === "sw" ? "Bidhaa" : "Product"}</DialogTitle></DialogHeader>
          {editProduct && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("addProduct.productName")} (EN)</Label><Input value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("addProduct.productName")} (SW)</Label><Input value={editProduct.name_sw || ""} onChange={e => setEditProduct({ ...editProduct, name_sw: e.target.value })} /></div>
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
              <Button className="w-full" onClick={handleSaveEdit} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.code")}</TableHead>
                    <TableHead>{t("inventory.name")}</TableHead>
                    <TableHead>{t("inventory.stock")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("inventory.priceCol")}</TableHead>
                    <TableHead className="text-right">{t("inventory.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {products?.length === 0 ? (language === "sw" ? "Hakuna bidhaa bado." : "No products yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}
                    </TableCell></TableRow>
                  ) : filteredProducts.map(product => (
                    <TableRow key={product.id}>
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
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleGenerateBarcode(product)} title="Barcode">
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct({ ...product })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct.mutate(product.id)} disabled={deleteProduct.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
