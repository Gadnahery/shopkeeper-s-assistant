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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useEditSale } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any | null;
}

interface EditableItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export function EditSaleDialog({ open, onOpenChange, sale }: EditSaleDialogProps) {
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const editSaleMutation = useEditSale();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const [items, setItems] = useState<EditableItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("none");
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [selectedAddProductId, setSelectedAddProductId] = useState<string>("");

  useEffect(() => {
    if (sale) {
      const initialItems: EditableItem[] = (sale.sale_items || []).map((si: any) => ({
        product_id: si.product_id,
        product_name: si.product_name || "Product",
        unit_price: Number(si.unit_price || 0),
        quantity: Number(si.quantity || 1),
      }));

      setItems(initialItems);
      setCustomerId(sale.customer_id || "none");
      setCustomerName(sale.customer_name || sale.customers?.name || "");
      setPaymentMethod(sale.payment_method || "cash");
      setDiscountAmount(Number(sale.discount_amount || 0));
      setTaxAmount(Number(sale.tax_amount || 0));
      setSelectedAddProductId("");
    }
  }, [sale]);

  if (!sale) return null;

  const handleQuantityChange = (index: number, val: string) => {
    const qty = Math.max(1, Number(val) || 1);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
  };

  const handleUnitPriceChange = (index: number, val: string) => {
    const price = Math.max(0, Number(val) || 0);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unit_price: price };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error(
        language === "sw"
          ? "Mauzo lazima yawe na angalau bidhaa moja."
          : "Sale must have at least one item."
      );
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = (prodId: string) => {
    if (!prodId || prodId === "none") return;
    const prod = products?.find((p) => p.id === prodId);
    if (!prod) return;

    // Check if already in items
    const existingIndex = items.findIndex((i) => i.product_id === prodId);
    if (existingIndex >= 0) {
      setItems((prev) => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      });
    } else {
      setItems((prev) => [
        ...prev,
        {
          product_id: prod.id,
          product_name: prod.name,
          unit_price: Number(prod.selling_price || 0),
          quantity: 1,
        },
      ]);
    }
    setSelectedAddProductId("");
  };

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    if (items.length === 0) {
      toast.error(
        language === "sw"
          ? "Tafadhali weka angalau bidhaa moja."
          : "Please add at least one item."
      );
      return;
    }

    try {
      const targetCustomer = customers?.find((c) => c.id === customerId);
      const custName = customerId !== "none" ? targetCustomer?.name || customerName : null;

      await editSaleMutation.mutateAsync({
        saleId: sale.id,
        items,
        customerId: customerId === "none" ? null : customerId,
        customerName: custName,
        paymentMethod,
        discountAmount,
        discountPercent: subtotal > 0 ? (discountAmount / subtotal) * 100 : 0,
        taxAmount,
      });

      onOpenChange(false);
    } catch (err: any) {
      // toast is already handled in useEditSale onError
    }
  };

  const invoiceLabel = sale.invoice_number || sale.id?.slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {language === "sw"
              ? `Hariri Mauzo #${invoiceLabel}`
              : `Edit Completed Sale #${invoiceLabel}`}
          </DialogTitle>
          <DialogDescription>
            {language === "sw"
              ? "Badilisha idadi ya bidhaa, bei, punguzo au mteja. Stoki itarekebishwa kiotomatiki."
              : "Modify items, quantities, prices, discounts or customer. Inventory will be automatically adjusted."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              {language === "sw"
                ? "Kuhifadhi mabadiliko haya kutarejesha stoki ya awali ya bidhaa zilizouzwa na kutoa idadi mpya. Kama mauzo haya yalikuwa ya deni (credit), deni la mteja litasasishwa."
                : "Saving changes reverses previously deducted stock, deducts newly specified items, updates customer credit balance (if credit sale), and records an audit log."}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {language === "sw" ? "Bidhaa za Mauzo" : "Sale Items"}
              </Label>
              <div className="w-56">
                <Select
                  value={selectedAddProductId}
                  onValueChange={handleAddProduct}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue
                      placeholder={
                        language === "sw" ? "+ Ongeza Bidhaa..." : "+ Add Product..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(products || [])
                      .filter(
                        (p) =>
                          p.item_type !== "service" &&
                          !items.some((i) => i.product_id === p.id)
                      )
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name} ({formatMoney(Number(p.selling_price || 0))})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-md divide-y divide-border">
              {items.map((item, idx) => (
                <div
                  key={item.product_id || idx}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(item.unit_price)} × {item.quantity} ={" "}
                      <span className="font-semibold text-foreground">
                        {formatMoney(item.unit_price * item.quantity)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Label className="text-[10px] text-muted-foreground">
                        {language === "sw" ? "Idadi" : "Qty"}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="any"
                        className="h-8 text-xs"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        required
                      />
                    </div>

                    <div className="w-28">
                      <Label className="text-[10px] text-muted-foreground">
                        {language === "sw" ? "Bei (TSh)" : "Price"}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        className="h-8 text-xs"
                        value={item.unit_price}
                        onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 mt-4"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {language === "sw" ? "Mteja" : "Customer"}
              </Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {language === "sw" ? "Mteja wa Kawaida (Walk-in)" : "Walk-in / Guest"}
                  </SelectItem>
                  {(customers || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {language === "sw" ? "Njia ya Malipo" : "Payment Method"}
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    {language === "sw" ? "Pesa Taslimu (Cash)" : "Cash"}
                  </SelectItem>
                  <SelectItem value="mobile_money">
                    {language === "sw" ? "M-Pesa / Simu" : "Mobile Money"}
                  </SelectItem>
                  <SelectItem value="card">
                    {language === "sw" ? "Kadi ya Benki (Card)" : "Card"}
                  </SelectItem>
                  <SelectItem value="bank">
                    {language === "sw" ? "Benki (Bank Transfer)" : "Bank"}
                  </SelectItem>
                  <SelectItem value="credit">
                    {language === "sw" ? "Deni (Credit)" : "Credit (Deni)"}
                  </SelectItem>
                  <SelectItem value="other">
                    {language === "sw" ? "Nyingine (Other)" : "Other"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Discounts & Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {language === "sw" ? "Punguzo (Discount)" : "Discount Amount"}
              </Label>
              <Input
                type="number"
                min="0"
                step="any"
                className="text-xs"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {language === "sw" ? "Kodi (Tax)" : "Tax Amount"}
              </Label>
              <Input
                type="number"
                min="0"
                step="any"
                className="text-xs"
                value={taxAmount}
                onChange={(e) => setTaxAmount(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {language === "sw" ? "Jumla Ndogo (Subtotal):" : "Subtotal:"}
              </span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>{language === "sw" ? "Punguzo:" : "Discount:"}</span>
                <span>-{formatMoney(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === "sw" ? "Kodi:" : "Tax:"}</span>
                <span>+{formatMoney(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t font-semibold text-sm">
              <span>{language === "sw" ? "Jumla Kuu Mpya:" : "New Total:"}</span>
              <span className="text-primary">{formatMoney(total)}</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {language === "sw" ? "Ghairi" : "Cancel"}
            </Button>
            <Button type="submit" disabled={editSaleMutation.isPending}>
              {editSaleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
