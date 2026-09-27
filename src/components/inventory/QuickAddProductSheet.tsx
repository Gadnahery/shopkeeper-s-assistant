import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateProduct } from "@/hooks/useProducts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (product: unknown) => void;
};

export function QuickAddProductSheet({ open, onOpenChange, onCreated }: Props) {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const { shopId } = useAuth();
  const createProduct = useCreateProduct();

  const [name, setName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [trackStock, setTrackStock] = useState(true);
  const [stock, setStock] = useState("0");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [buyingPrice, setBuyingPrice] = useState("");
  const [barcode, setBarcode] = useState("");

  const reset = () => {
    setName("");
    setSellingPrice("");
    setTrackStock(true);
    setStock("0");
    setShowAdvanced(false);
    setBuyingPrice("");
    setBarcode("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(isSw ? "Weka jina la bidhaa" : "Enter product name");
      return;
    }
    const price = parseFloat(sellingPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error(isSw ? "Weka bei sahihi" : "Enter a valid price");
      return;
    }
    if (!shopId) {
      toast.error(isSw ? "Duka halijapatikana" : "Shop not found");
      return;
    }

    try {
      const sku = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
      const codeVal = barcode.trim() || sku;
      const product = await createProduct.mutateAsync({
        shop_id: shopId,
        name: name.trim(),
        selling_price: price,
        buying_price: buyingPrice ? parseFloat(buyingPrice) || 0 : 0,
        stock: trackStock ? parseInt(stock) || 0 : 0,
        low_stock_alert: 5,
        track_inventory: trackStock,
        barcode: codeVal,
        sku: codeVal,
        code: codeVal,
        category_id: null,
        item_type: "product",
      } as any);

      toast.success(isSw ? "Bidhaa imeongezwa" : "Product added");
      onCreated?.(product);
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message || (isSw ? "Imeshindikana" : "Failed to add product"));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <SheetContent side="bottom" className="rounded-t-[24px] px-5 pb-8 pt-4 sm:max-w-lg sm:mx-auto">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="text-lg font-semibold text-[#1A1D29]">
            {isSw ? "Ongeza bidhaa" : "Add product"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {isSw ? "Jina na bei tu — maelezo zaidi baadaye." : "Name and price — more details later."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isSw ? "Jina" : "Name"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isSw ? "mf. Mchele 25kg" : "e.g. Rice 25kg"}
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{isSw ? "Bei ya kuuza (TZS)" : "Selling price (TZS)"}</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0"
              className="h-11 rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={() => setTrackStock((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-3 text-sm"
          >
            <span className="font-medium">{isSw ? "Fuatilia stoki?" : "Track stock?"}</span>
            <span className={`text-xs font-semibold ${trackStock ? "text-[#D99A4E]" : "text-muted-foreground"}`}>
              {trackStock ? (isSw ? "Ndiyo" : "Yes") : (isSw ? "Hapana" : "No")}
            </span>
          </button>

          {trackStock && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isSw ? "Idadi ya sasa" : "Current quantity"}</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
          >
            {isSw ? "Maelezo zaidi" : "Advanced details"}
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isSw ? "Bei ya kununua" : "Cost price"}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Barcode / SKU</Label>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={createProduct.isPending}
            className="h-12 w-full rounded-xl bg-[#1A1D29] text-white hover:bg-[#2a2e3d]"
          >
            {createProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSw ? "Hifadhi bidhaa" : "Save product"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
