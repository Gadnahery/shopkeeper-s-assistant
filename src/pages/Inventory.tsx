import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Upload, Plus, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { exportToCSV } from "@/utils/exportData";
import { motion } from "framer-motion";

export default function Inventory() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [showBarcode, setShowBarcode] = useState<string | null>(null);

  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products?.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.name_sw && p.name_sw.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const isLowStock = (stock: number, alert: number) => stock <= alert;
  const getProductName = (product: typeof filteredProducts[0]) => language === "sw" && product.name_sw ? product.name_sw : product.name;

  const handleExport = () => {
    if (!products?.length) return;
    exportToCSV(products.map(p => ({
      Code: p.code, Name: p.name, Stock: p.stock,
      "Buying Price": p.buying_price, "Selling Price": p.selling_price,
      Category: (p.categories as any)?.name || "",
      Barcode: p.barcode || "",
    })), "inventory");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("inventory.searchPlaceholder")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 md:gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">{t("inventory.export")}</span>
          </Button>
          <Button className="gap-2" onClick={() => navigate("/inventory/add")}>
            <Plus className="h-4 w-4" />
            {t("inventory.addProduct")}
          </Button>
        </div>
      </div>

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
                      {products?.length === 0 ? "No products yet. Add your first product!" : "No products match your search."}
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
                        {showBarcode === product.id && product.barcode && (
                          <div className="mt-2">
                            <BarcodeGenerator value={product.barcode} productName={product.name} price={product.selling_price} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className={isLowStock(product.stock, product.low_stock_alert) ? "text-destructive font-medium" : ""}>{product.stock}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatNumber(product.selling_price)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {product.barcode && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBarcode(showBarcode === product.id ? null : product.id)} title="Barcode">
                              <span className="text-xs font-bold">BC</span>
                            </Button>
                          )}
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