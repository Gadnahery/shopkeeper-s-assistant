import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Sparkles, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: (product: any, autoAddToCart: boolean) => void;
}

export function AddProductModal({
  open,
  onOpenChange,
  onProductCreated,
}: AddProductModalProps) {
  const { language } = useLanguage();
  const { shopId } = useAuth();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();

  const [itemType, setItemType] = useState<"product" | "service">("product");
  const [name, setName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [lowStockAlert, setLowStockAlert] = useState("5");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [barcode, setBarcode] = useState("");
  const [autoAddToCart, setAutoAddToCart] = useState(true);

  const resetForm = () => {
    setItemType("product");
    setName("");
    setSellingPrice("");
    setBuyingPrice("");
    setStock("10");
    setLowStockAlert("5");
    setCategoryId("none");
    setBarcode("");
    setAutoAddToCart(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const generateCode = () => {
    const isService = itemType === "service";
    const prefix = isService ? "SRV" : "PRD";
    const cleanName = name.trim().slice(0, 3).toUpperCase() || prefix;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}-${rand}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(language === "sw" ? "Jaza jina la bidhaa au huduma" : "Enter item name");
      return;
    }

    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error(language === "sw" ? "Weka bei halali ya kuuzia" : "Enter a valid selling price");
      return;
    }

    if (!shopId) {
      toast.error("Shop session missing");
      return;
    }

    const codeVal = barcode.trim() || generateCode();
    const isService = itemType === "service";
    const stockNum = isService ? 0 : (parseInt(stock, 10) || 0);
    const buyingNum = isService ? 0 : (parseFloat(buyingPrice) || 0);
    const alertNum = isService ? 0 : (parseInt(lowStockAlert, 10) || 5);

    try {
      const created = await createProduct.mutateAsync({
        shop_id: shopId,
        code: codeVal,
        name: name.trim(),
        barcode: codeVal,
        sku: codeVal,
        item_type: itemType,
        track_inventory: !isService,
        category_id: categoryId === "none" || !categoryId ? null : categoryId,
        buying_price: buyingNum,
        selling_price: priceNum,
        stock: stockNum,
        low_stock_alert: alertNum,
      } as any);

      toast.success(
        isService
          ? (language === "sw" ? "Huduma imeongezwa" : "Service added successfully")
          : (language === "sw" ? "Bidhaa imeongezwa stoo" : "Product added to inventory")
      );

      if (onProductCreated) {
        onProductCreated(created, autoAddToCart);
      }

      handleClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border-border bg-card p-5 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Plus className="h-4 w-4 text-accent" />
            <span>{language === "sw" ? "Ongeza Bidhaa / Huduma Mpya" : "Quick Add Product / Service"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {language === "sw"
              ? "Sajili bidhaa mpya hapa papo hapo bila kuondoka kwenye skrini ya mauzo."
              : "Register a new item instantly without leaving the POS checkout."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Type Toggle: Product vs Service */}
          <div className="flex rounded-xl bg-muted/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setItemType("product")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all",
                itemType === "product"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="h-3.5 w-3.5 text-accent" />
              <span>{language === "sw" ? "Bidhaa (Stoo)" : "Product (Inventory)"}</span>
            </button>
            <button
              type="button"
              onClick={() => setItemType("service")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all",
                itemType === "service"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{language === "sw" ? "Huduma" : "Service"}</span>
            </button>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              {language === "sw" ? "Jina la Bidhaa / Huduma *" : "Item Name *"}
            </Label>
            <Input
              autoFocus
              placeholder={language === "sw" ? "Mf. Unga wa Ngano 2kg, Kukata Nywele..." : "e.g. Wheat Flour 2kg, Haircut..."}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-xl border-border bg-background text-xs"
              required
            />
          </div>

          {/* Selling Price & Cost Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {language === "sw" ? "Bei ya Kuuza (TSH) *" : "Selling Price *"}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="h-9 rounded-xl border-border bg-background text-xs font-semibold"
                required
              />
            </div>

            {itemType === "product" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {language === "sw" ? "Bei ya Kununua (Gharama)" : "Cost / Buying Price"}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                  className="h-9 rounded-xl border-border bg-background text-xs"
                />
              </div>
            )}
          </div>

          {/* Stock & Low Stock Alert (Only for Physical Products) */}
          {itemType === "product" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {language === "sw" ? "Idadi ya Mwanzo Stoo" : "Initial Stock Quantity"}
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="10"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {language === "sw" ? "Tahadhari ya Kuisha" : "Low Stock Alert"}
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="5"
                  value={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.value)}
                  className="h-9 rounded-xl border-border bg-background text-xs"
                />
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              {language === "sw" ? "Kundi la Bidhaa (Hiari)" : "Category (Optional)"}
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                <SelectValue placeholder={language === "sw" ? "Bila Kundi" : "None"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-xs">
                <SelectItem value="none">
                  {language === "sw" ? "Bila Kundi" : "None"}
                </SelectItem>
                {(categories || []).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Barcode / SKU */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>{language === "sw" ? "Barcode / Msimbo (Hiari)" : "Barcode / SKU (Optional)"}</span>
              <span className="text-[10px] text-muted-foreground">
                {language === "sw" ? "Ikiachwa wazi, itatengenezwa kiotomatiki" : "Auto-generated if empty"}
              </span>
            </Label>
            <Input
              placeholder={language === "sw" ? "Weka au scan barcode..." : "Scan or enter barcode..."}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="h-9 rounded-xl border-border bg-background text-xs font-mono"
            />
          </div>

          {/* Auto add to current cart checkbox */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAddToCart}
              onChange={(e) => setAutoAddToCart(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs font-medium text-foreground">
              {language === "sw"
                ? "Ongeza bidhaa hii moja kwa moja kwenye kikapu cha mauzo ya sasa"
                : "Add this item to current sale cart immediately"}
            </span>
          </label>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-9 rounded-xl text-xs"
            >
              {language === "sw" ? "Ghairi" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending}
              className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs gap-1.5"
            >
              {createProduct.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5 text-accent" />
              )}
              <span>{language === "sw" ? "Hifadhi Bidhaa" : "Save Product"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
