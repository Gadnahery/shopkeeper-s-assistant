import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  History,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";

export default function Inventory() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.name_sw && product.name_sw.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const isLowStock = (stock: number, alert: number) => stock <= alert;

  const getProductName = (product: typeof filteredProducts[0]) => {
    return language === "sw" && product.name_sw ? product.name_sw : product.name;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("inventory.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t("inventory.import")}
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {t("inventory.export")}
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate("/inventory/add")}
          >
            <Plus className="h-4 w-4" />
            {t("inventory.addProduct")}
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.code")}</TableHead>
                  <TableHead>{t("inventory.name")}</TableHead>
                  <TableHead>{t("inventory.stock")}</TableHead>
                  <TableHead>{t("inventory.priceCol")}</TableHead>
                  <TableHead className="text-right">{t("inventory.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {products?.length === 0 ? "No products yet. Add your first product!" : "No products match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {product.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isLowStock(product.stock, product.low_stock_alert) && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              {t("inventory.low")}
                            </Badge>
                          )}
                          <span className={isLowStock(product.stock, product.low_stock_alert) ? "text-destructive" : ""}>
                            {getProductName(product)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={isLowStock(product.stock, product.low_stock_alert) ? "text-destructive font-medium" : ""}>
                        {product.stock}
                      </TableCell>
                      <TableCell>{formatNumber(product.selling_price)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => navigate(`/inventory/edit/${product.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteProduct.mutate(product.id)}
                            disabled={deleteProduct.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
