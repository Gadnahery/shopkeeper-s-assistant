import { useState, useEffect } from "react";
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
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import {
  StockReceivedRecord,
  useCorrectStockReceived,
} from "@/hooks/useStockReceived";

interface CorrectStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: StockReceivedRecord | null;
}

export function CorrectStockDialog({
  open,
  onOpenChange,
  record,
}: CorrectStockDialogProps) {
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const correctMutation = useCorrectStockReceived();

  const [itemsData, setItemsData] = useState<
    {
      item_id: string;
      product_id: string;
      product_name: string;
      current_stock: number;
      old_quantity: number;
      quantity: number;
      buying_price: number;
    }[]
  >([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (record) {
      setItemsData(
        record.items.map((item) => ({
          item_id: item.id,
          product_id: item.product_id,
          product_name: item.product?.name || "Product",
          current_stock: Number(item.product?.stock || 0),
          old_quantity: item.quantity,
          quantity: item.quantity,
          buying_price: item.buying_price !== null ? item.buying_price : 0,
        }))
      );
      setNotes(record.notes || "");
      setReason("");
    }
  }, [record]);

  if (!record) return null;

  const handleQuantityChange = (index: number, val: string) => {
    const nextVal = Math.max(0, Number(val) || 0);
    setItemsData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: nextVal };
      return updated;
    });
  };

  const handlePriceChange = (index: number, val: string) => {
    const nextVal = Math.max(0, Number(val) || 0);
    setItemsData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], buying_price: nextVal };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    try {
      await correctMutation.mutateAsync({
        stockReceivedId: record.id,
        items: itemsData.map((item) => ({
          item_id: item.item_id,
          product_id: item.product_id,
          quantity: item.quantity,
          buying_price: item.buying_price || null,
        })),
        notes: notes.trim() || null,
        reason: reason.trim() || (language === "sw" ? "Marekebisho ya stoki iliyopokewa" : "Correction of received stock"),
      });

      toast.success(
        language === "sw"
          ? "Stoki iliyopokewa imesahihishwa kikamilifu."
          : "Stock received entry corrected successfully."
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to correct stock received");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {language === "sw"
              ? "Sahihisha Stoki Iliyopokewa"
              : "Correct Received Stock Entry"}
          </DialogTitle>
          <DialogDescription>
            {language === "sw"
              ? "Rekebisha idadi au bei iliyoingizwa kimakosa (mfano: 4000 badala ya 400). Stoki ya sasa itabadilika moja kwa moja kulingana na tofauti."
              : "Fix mistakenly entered quantities or prices (e.g., 4000 instead of 400). Current product stock will adjust automatically by the difference."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              {language === "sw"
                ? "Kubadilisha idadi kutahesabu kiotomatiki tofauti (mpya - ya zamani) na kusasisha stoki ya bidhaa, pamoja na kuweka kumbukumbu kwenye historia ya stoki."
                : "Changing quantities will compute the delta (new - previous) and adjust product inventory accordingly, with an audit log and stock history entry."}
            </div>
          </div>

          <div className="space-y-4 divide-y divide-border">
            {itemsData.map((item, idx) => {
              const delta = item.quantity - item.old_quantity;
              return (
                <div key={item.item_id || idx} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>{item.product_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {language === "sw" ? "Stoki ya sasa:" : "Current stock:"}{" "}
                      {item.current_stock}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {language === "sw" ? "Idadi Iliyopokewa" : "Received Quantity"}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        required
                      />
                      {delta !== 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          {language === "sw" ? "Mabadiliko ya stoki: " : "Stock change: "}
                          <span
                            className={
                              delta > 0
                                ? "text-emerald-600 font-semibold"
                                : "text-rose-600 font-semibold"
                            }
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">
                        {language === "sw" ? "Bei ya Kununua" : "Buying Price"}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.buying_price}
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {language === "sw" ? "Jumla mpya: " : "New item total: "}
                        {formatMoney(item.quantity * item.buying_price)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1 pt-2">
            <Label className="text-xs">
              {language === "sw" ? "Sababu ya Marekebisho" : "Reason for Correction"}
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                language === "sw"
                  ? "Mfano: Kuingiza kimakosa idadi ya 4000 badala ya 400"
                  : "e.g. Typo: entered 4000 instead of 400"
              }
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              {language === "sw" ? "Maelezo / Nambari ya Risiti" : "Notes / Reference"}
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Invoice / delivery note..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {language === "sw" ? "Ghairi" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={correctMutation.isPending}
            >
              {correctMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {language === "sw" ? "Hifadhi Marekebisho" : "Save Correction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
