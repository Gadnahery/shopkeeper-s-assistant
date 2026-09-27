import { useEffect, useRef, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  CheckCircle,
  History,
  Loader2,
  Package,
  Plus,
  ScanLine,
  Search,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  LayoutList,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSale, useDeleteDraftSale, useDraftSales, useSaveDraftSale } from "@/hooks/useSales";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt } from "@/components/Receipt";
import { PageLoader } from "@/components/PageLoader";
import { MobileCameraScanner } from "@/components/common/MobileCameraScanner";
import { AddProductModal } from "./AddProductModal";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
  trackInventory: boolean;
}

interface POSSaleViewProps {
  onBackToHistory: () => void;
}

export function POSSaleView({ onBackToHistory }: POSSaleViewProps) {
  const { t, language } = useLanguage();
  const { formatMoney } = useShopFormatting();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [cashAmount, setCashAmount] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState("");
  const [cashOverridden, setCashOverridden] = useState(false);
  const [paymentType, setPaymentType] = useState<"Cash" | "M-Pesa" | "Split" | "Credit">("Cash");
  const [mpesaCode, setMpesaCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("walk-in");
  const [customerMode, setCustomerMode] = useState<"walk-in" | "existing" | "custom">("walk-in");
  const [customerName, setCustomerName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [itemTypeFilter, setItemTypeFilter] = useState<"all" | "product" | "service">("all");
  const [catalogViewMode, setCatalogViewMode] = useState<"rows" | "grid">("rows");
  const [showReceipt, setShowReceipt] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: customers } = useCustomers();
  const { data: shopSettings } = useShopSettings();
  const { profile } = useAuth();
  const { data: drafts } = useDraftSales();

  const createSale = useCreateSale();
  const saveDraft = useSaveDraftSale();
  const deleteDraft = useDeleteDraftSale();

  const filteredProducts = (products || []).filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q));
    const matchesCategory =
      selectedCategory === "all" || p.category_id === selectedCategory;
    const isService = p.item_type === "service" || p.track_inventory === false;
    const matchesType =
      itemTypeFilter === "all"
        ? true
        : itemTypeFilter === "service"
        ? isService
        : !isService;
    return matchesSearch && matchesCategory && matchesType;
  });

  const addToCart = (product: any) => {
    const isService = product.item_type === "service" || product.track_inventory === false;
    const trackInventory = !isService;
    if (trackInventory && product.stock <= 0) {
      toast.error(language === "sw" ? "Bidhaa hii haina stoki" : "This product is out of stock");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (trackInventory && existing.quantity >= product.stock) {
          toast.warning(language === "sw" ? "Ukomo wa stoki umefikiwa" : "Stock limit reached");
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          name: product.name,
          price: Number(product.selling_price) || 0,
          quantity: 1,
          maxStock: trackInventory ? product.stock : Number.POSITIVE_INFINITY,
          trackInventory,
        },
      ];
    });
    playSound("click");
  };

  const handleProductCreated = (newProd: any, autoAddToCart: boolean) => {
    if (autoAddToCart && newProd) {
      addToCart({
        id: newProd.id,
        name: newProd.name,
        selling_price: Number(newProd.selling_price || 0),
        stock: Number(newProd.stock || 0),
        track_inventory: newProd.track_inventory ?? (newProd.item_type !== "service"),
        item_type: newProd.item_type || "product",
      } as any);
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          if (item.trackInventory && qty > item.maxStock) {
            toast.warning(language === "sw" ? "Ukomo wa stoki umefikiwa" : "Stock limit reached");
            return { ...item, quantity: item.maxStock };
          }
          return { ...item, quantity: qty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const discount = useMemo(() => {
    const directAmt = parseFloat(discountAmount) || 0;
    const pct = parseFloat(discountPercent) || 0;
    if (pct > 0) return Math.round((subtotal * pct) / 100);
    return directAmt;
  }, [subtotal, discountAmount, discountPercent]);

  const total = Math.max(0, subtotal - discount);

  const cashPaid = parseFloat(cashAmount) || 0;
  const mpesaPaid = parseFloat(mpesaAmount) || 0;
  const totalPaid = cashPaid + mpesaPaid;
  const changeDue = Math.max(0, totalPaid - total);

  // Auto-sync cash to match cart total unless user has manually overridden
  useEffect(() => {
    if (!cashOverridden && !mpesaAmount) {
      setCashAmount(total > 0 ? String(total) : "");
    } else if (!cashOverridden && mpesaAmount) {
      const remainder = total - (parseFloat(mpesaAmount) || 0);
      setCashAmount(remainder > 0 ? String(remainder) : "");
    }
  }, [total, cashOverridden, mpesaAmount]);

  if (products === undefined || productsLoading) {
    return <PageLoader message="Loading POS..." messageSw="Inapakia mfumo wa mauzo..." language={language} />;
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }

    const custId =
      customerMode === "existing" && selectedCustomer !== "walk-in"
        ? selectedCustomer
        : null;
    const custName =
      customerMode === "walk-in"
        ? null
        : customerMode === "existing"
        ? customers?.find((c) => c.id === selectedCustomer)?.name || null
        : customerName.trim() || null;

    if (paymentType === "Credit") {
      if (!custId && !custName) {
        toast.error(
          language === "sw"
            ? "Mauzo ya mkopo yanahitaji kumchagua mteja au kuandika jina la mteja"
            : "Credit sales require selecting a customer or entering a customer name"
        );
        return;
      }
    } else {
      if (totalPaid < total) {
        toast.error(language === "sw" ? "Kiasi cha malipo hakitoshi" : "Payment amount is less than total");
        return;
      }
    }

    const paymentMethod = paymentType;
    let finalCashAmount = 0;
    let finalMpesaAmount = 0;

    if (paymentMethod === "Cash") {
      finalCashAmount = total;
    } else if (paymentMethod === "M-Pesa") {
      finalMpesaAmount = total;
    } else if (paymentMethod === "Split") {
      finalCashAmount = cashPaid;
      finalMpesaAmount = mpesaPaid;
    } else if (paymentMethod === "Credit") {
      finalCashAmount = 0;
      finalMpesaAmount = 0;
    }

    try {
      const sale = await createSale.mutateAsync({
        customer_id: custId,
        customer_name: custName,
        payment_method: paymentMethod,
        mpesa_code: mpesaCode || null,
        discount_amount: discount,
        discount_percent: parseInt(discountPercent) || 0,
        cash_amount: finalCashAmount,
        mpesa_amount: finalMpesaAmount,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
        })),
      });

      setLastSale({
        invoiceNumber: sale.invoice_number,
        date: format(new Date(), "dd MMM yyyy, hh:mm a"),
        customerName: custName || t("sales.walkIn"),
        cashier: profile?.full_name || undefined,
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        discount,
        total,
        paymentMethod,
        mpesaCode: mpesaCode || undefined,
        cashAmount: cashPaid || undefined,
        mpesaAmount: mpesaPaid || undefined,
        changeDue: changeDue || undefined,
        shopName: (shopSettings as any)?.shop_name || "",
        shopPhone: (shopSettings as any)?.phone || undefined,
        shopAddress: (shopSettings as any)?.address || undefined,
        isOfflinePending: (sale as any)?.is_offline_pending || false,
      });

      setShowReceipt(true);
      setMobileCartOpen(false);
      setCartItems([]);
      setDiscountAmount("0");
      setDiscountPercent("0");
      setCashAmount("");
      setMpesaAmount("");
      setMpesaCode("");
      setCashOverridden(false);
      setSelectedCustomer("walk-in");
      setCustomerName("");

      if (activeDraftId) {
        deleteDraft.mutate(activeDraftId);
        setActiveDraftId(null);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to complete sale");
    }
  };

  const handleHoldDraft = async () => {
    if (cartItems.length === 0) return;
    try {
      await saveDraft.mutateAsync({
        customer_id: selectedCustomer === "walk-in" ? null : selectedCustomer,
        customer_name: customerName.trim() || null,
        payment_method: "Cash",
        discount_amount: discount,
        discount_percent: parseInt(discountPercent) || 0,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
        })),
      });

      setCartItems([]);
      setMobileCartOpen(false);
      setCustomerName("");
      setCashAmount("");
      setMpesaAmount("");
      toast.success(language === "sw" ? "Rasimu imehifadhiwa" : "Draft saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save draft");
    }
  };

  const restoreDraft = (draft: any) => {
    const items = (draft.items || []).map((it: any) => {
      const prod = products?.find((p) => p.id === it.product_id);
      return {
        id: crypto.randomUUID(),
        product_id: it.product_id,
        name: it.product_name,
        price: Number(it.unit_price || 0),
        quantity: Number(it.quantity || 1),
        maxStock: prod?.stock || 999,
        trackInventory: prod?.item_type !== "service" && prod?.track_inventory !== false,
      };
    });
    setCartItems(items);
    setSelectedCustomer(draft.customer_id || "walk-in");
    setCustomerName(draft.customer_name || "");
    setActiveDraftId(draft.id);
    toast.info(language === "sw" ? "Rasimu imerejeshwa kwenye kikapu" : "Draft restored to cart");
  };

  const renderCartCard = () => (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-accent" />
          <span>{t("sales.cart")} ({cartItems.reduce((sum, it) => sum + it.quantity, 0)})</span>
        </CardTitle>
        {cartItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCartItems([])}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            <span>{language === "sw" ? "Futa Yote" : "Clear"}</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Customer Selector */}
        <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground">{t("sales.customer")}</Label>
            <div className="flex rounded-lg bg-muted p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setCustomerMode("walk-in")}
                className={cn(
                  "rounded-md px-2 py-0.5 transition-colors",
                  customerMode === "walk-in" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {language === "sw" ? "Mteja wa Kawaida" : "Walk-in"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode("existing");
                  if (customers && customers.length > 0 && selectedCustomer === "walk-in") {
                    setSelectedCustomer(customers[0].id);
                  }
                }}
                className={cn(
                  "rounded-md px-2 py-0.5 transition-colors",
                  customerMode === "existing" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {language === "sw" ? "Mteja Aliyepo" : "Existing"}
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode("custom")}
                className={cn(
                  "rounded-md px-2 py-0.5 transition-colors",
                  customerMode === "custom" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {language === "sw" ? "Mteja Mpya" : "New / Name"}
              </button>
            </div>
          </div>

          {customerMode === "existing" && (
            <div className="space-y-1 pt-1">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                {(customers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {customerMode === "custom" && (
            <div className="space-y-2 pt-1">
              <Input
                placeholder={language === "sw" ? "Jina la mteja..." : "Customer name..."}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 rounded-xl border-border bg-background text-xs"
              />
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto internal-table-scroll pr-1">
          {cartItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <ShoppingCart className="mx-auto mb-1.5 h-6 w-6 opacity-30" />
              <span>{t("sales.emptyCart")}</span>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 p-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatMoney(item.price)} × {item.quantity} ={" "}
                    <span className="font-bold text-foreground">{formatMoney(item.price * item.quantity)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="h-7 w-7 rounded-lg border-border"
                  >
                    -
                  </Button>
                  <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="h-7 w-7 rounded-lg border-border"
                  >
                    +
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFromCart(item.product_id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <Label className="text-xs font-semibold text-foreground shrink-0">{t("sales.discount")}</Label>
          <div className="flex items-center gap-2 max-w-[200px]">
            <div className="relative flex-1">
              <Input
                type="number"
                inputMode="numeric"
                value={discountAmount}
                onChange={(e) => {
                  setDiscountAmount(e.target.value);
                  setDiscountPercent("0");
                }}
                placeholder="0"
                className="h-8 rounded-lg border-border bg-background text-xs text-right pr-2"
              />
            </div>
            <span className="text-xs text-muted-foreground">TSH</span>
          </div>
        </div>

        {/* Total Summary Breakdown */}
        <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("sales.subtotal")}</span>
            <span className="font-semibold text-foreground">{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>{t("sales.discount")}</span>
              <span className="font-semibold">-{formatMoney(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1.5 text-sm font-black text-foreground">
            <span>{t("sales.total")}</span>
            <span className="text-primary text-base">{formatMoney(total)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">{t("sales.paymentMethod")}</Label>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setPaymentType("Cash");
                setCashOverridden(false);
                setMpesaAmount("");
              }}
              className={cn(
                "rounded-lg py-1.5 transition-all text-center",
                paymentType === "Cash" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentType("M-Pesa");
                setCashOverridden(true);
                setCashAmount("");
                setMpesaAmount(String(total));
              }}
              className={cn(
                "rounded-lg py-1.5 transition-all text-center",
                paymentType === "M-Pesa" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              M-Pesa
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentType("Split");
                setCashOverridden(true);
              }}
              className={cn(
                "rounded-lg py-1.5 transition-all text-center",
                paymentType === "Split" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentType("Credit");
                if (customerMode !== "existing") {
                  setCustomerMode("existing");
                  if (customers && customers.length > 0 && selectedCustomer === "walk-in") {
                    setSelectedCustomer(customers[0].id);
                  }
                }
              }}
              className={cn(
                "rounded-lg py-1.5 transition-all text-center",
                paymentType === "Credit" ? "bg-amber-500 text-white shadow-2xs font-bold" : "text-amber-600 hover:text-amber-700"
              )}
            >
              {language === "sw" ? "Mkopo" : "Credit"}
            </button>
          </div>
        </div>

        {/* Payment Amount & Method Inputs */}
        <div className="space-y-2">
          {paymentType === "Credit" ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-100">
                <Users className="h-4 w-4 text-amber-600" />
                <span>{language === "sw" ? "Mauzo ya Mkopo (Deni)" : "Credit Sale (Customer Debt)"}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {language === "sw"
                  ? `Kiasi cha ${formatMoney(total)} kitaongezwa kwenye akaunti ya mteja. Malipo hayahitajiki papo hapo.`
                  : `Amount of ${formatMoney(total)} will be assigned to customer receivable balance. No immediate cash collected.`}
              </p>
              {customerMode === "walk-in" ? (
                <p className="text-[11px] font-bold text-rose-600 pt-0.5">
                  {language === "sw" ? "⚠️ Tafadhali chagua mteja au andika jina la mteja hapo juu." : "⚠️ Please select a customer or type a customer name above."}
                </p>
              ) : customerMode === "custom" && !customerName.trim() ? (
                <p className="text-[11px] font-bold text-rose-600 pt-0.5">
                  {language === "sw" ? "⚠️ Tafadhali andika jina la mteja hapo juu." : "⚠️ Please type a customer name above."}
                </p>
              ) : customerMode === "custom" ? (
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 pt-0.5">
                  {language === "sw"
                    ? `Mteja "${customerName.trim()}" ataongezwa kwenye orodha ya wateja na deni lake kutunzwa.`
                    : `Customer "${customerName.trim()}" will be saved with this credit debt balance.`}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">Cash (TSH)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={cashAmount}
                    onChange={(e) => { setCashOverridden(true); setCashAmount(e.target.value); }}
                    onFocus={(e) => { if (e.target.value === "0") { setCashAmount(""); } }}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) { setCashOverridden(false); }
                    }}
                    placeholder="0"
                    className="h-9 rounded-xl border-border bg-background text-xs font-bold text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">M-Pesa / Mobile (TSH)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    onFocus={(e) => { if (e.target.value === "0") setMpesaAmount(""); }}
                    placeholder="0"
                    className="h-9 rounded-xl border-border bg-background text-xs font-bold text-center"
                  />
                </div>
              </div>

              {changeDue > 0 && (
                <div className="flex justify-between rounded-xl bg-[var(--success-bg)] p-2.5 text-xs font-bold text-[var(--success-text)]">
                  <span>{language === "sw" ? "Chenji ya Mteja" : "Change Due"}</span>
                  <span>{formatMoney(changeDue)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={handleHoldDraft}
            disabled={cartItems.length === 0}
            className="h-10 rounded-xl text-xs flex-1"
          >
            <History className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span>{t("sales.saveAsDraft")}</span>
          </Button>

          <Button
            onClick={handleCompleteSale}
            disabled={cartItems.length === 0 || createSale.isPending}
            className="h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2] shadow-xs hover:bg-primary/90"
          >
            {createSale.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1 text-accent" />}
            <span>{language === "sw" ? "Kamilisha Mauzo" : "Complete Sale"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      {/* Header bar with Back button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-2xl border border-border/80">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToHistory}
            className="h-9 rounded-xl px-3 text-xs font-bold gap-1.5 shadow-xs border-border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{language === "sw" ? "Rudi kwenye Rekodi za Mauzo" : "Back to Sales Records"}</span>
          </Button>
          <div className="hidden sm:block h-5 w-px bg-border" />
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-accent" />
              <span>{language === "sw" ? "Uza Bidhaa / Mauzo Mapya (POS)" : "New Sale / POS Terminal"}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            {cartItems.length} {language === "sw" ? "bidhaa kwenye kikapu" : "items in cart"}
          </span>
        </div>
      </div>

      {/* 2-Column POS Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Columns: Product Catalog & Quick Picker */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={t("sales.searchOrScan")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 rounded-xl border-border bg-background pl-9 text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCameraScannerOpen(true)}
                className="h-10 w-10 rounded-xl border-border shrink-0"
                title="Camera Scanner"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setAddProductModalOpen(true)}
                className="h-10 rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 px-3.5 text-xs font-bold gap-1.5 shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 shrink-0"
                title={language === "sw" ? "Ongeza Bidhaa Mpya" : "Add New Product"}
              >
                <Plus className="h-4 w-4 text-accent" />
                <span className="hidden sm:inline">{language === "sw" ? "Ongeza Bidhaa" : "Add Product"}</span>
                <span className="sm:hidden">{language === "sw" ? "Bidhaa" : "Add"}</span>
              </Button>
            </div>
          </Card>

          {/* Catalog Filter Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Item Type Segmented Filter (All, Products, Services) */}
            <div className="flex items-center rounded-xl bg-muted/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setItemTypeFilter("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  itemTypeFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {language === "sw" ? "Vyote" : "All"} ({products?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter("product")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  itemTypeFilter === "product" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Package className="h-3 w-3 text-accent" />
                <span>{language === "sw" ? "Bidhaa" : "Products"}</span>
              </button>
              <button
                type="button"
                onClick={() => setItemTypeFilter("service")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  itemTypeFilter === "service" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>{language === "sw" ? "Huduma" : "Services"}</span>
              </button>
            </div>

            {/* View Mode Toggle: Rows vs Grid */}
            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setCatalogViewMode("rows")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  catalogViewMode === "rows" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="5 Rows Table View"
              >
                <LayoutList className="h-3.5 w-3.5 text-accent" />
                <span>{language === "sw" ? "Mistari (5)" : "Rows (5)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCatalogViewMode("grid")}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  catalogViewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-accent" />
                <span>{language === "sw" ? "Gridi" : "Grid"}</span>
              </button>
            </div>
          </div>

          {/* Category Chip Scroller */}
          {categories && categories.length > 0 && (
            <div className="category-chips">
              <button
                className={selectedCategory === "all" ? "category-chip-active" : "category-chip"}
                onClick={() => setSelectedCategory("all")}
              >
                {language === "sw" ? "Zote" : "All"}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={selectedCategory === cat.id || selectedCategory === cat.name ? "category-chip-active" : "category-chip"}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Catalog Content: 5 Rows Inward Scroll Table or Grid View */}
          {filteredProducts.length === 0 ? (
            <Card className="border border-border bg-card p-8 text-center shadow-xs">
              <div className="empty-state-icon mx-auto mb-2">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{language === "sw" ? "Hakuna bidhaa au huduma" : "No items found"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "sw" ? "Jaribu kubadilisha kundi au neno la kutafuta." : "Try a different search or category filter."}
              </p>
            </Card>
          ) : catalogViewMode === "rows" ? (
            <Card className="border border-border bg-card shadow-xs overflow-hidden">
              <div className="internal-table-scroll max-h-[315px] overflow-y-auto w-full">
                <Table className="w-full text-xs">
                  <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-xs border-b border-border">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="py-2.5 text-xs font-bold text-muted-foreground w-28">{t("inventory.code")}</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-muted-foreground">{language === "sw" ? "Bidhaa / Huduma" : "Item / Service"}</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-muted-foreground w-24 text-center">{language === "sw" ? "Hali" : "Status"}</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-muted-foreground text-right w-28">{t("inventory.sellingPrice")}</TableHead>
                      <TableHead className="py-2.5 text-xs font-bold text-muted-foreground text-center w-20">{language === "sw" ? "Weka" : "Add"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {filteredProducts.map((product) => {
                      const isService = product.item_type === "service" || product.track_inventory === false;
                      const trackInventory = !isService;
                      const isOut = trackInventory && product.stock <= 0;
                      const isLow = trackInventory && product.stock > 0 && product.stock <= (product.low_stock_alert ?? 5);
                      const cartItem = cartItems.find((ci) => ci.product_id === product.id);

                      return (
                        <TableRow
                          key={product.id}
                          onClick={() => {
                            if (!isOut) addToCart(product);
                          }}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/40 h-[56px]",
                            isOut ? "opacity-50 cursor-not-allowed" : "",
                            cartItem ? "bg-accent/5 font-medium" : ""
                          )}
                        >
                          <TableCell className="py-2 font-mono text-[11px] text-muted-foreground">
                            {product.barcode || product.sku || "PRD"}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">{product.name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {isService ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>{language === "sw" ? "Huduma" : "Service"}</span>
                              </span>
                            ) : isOut ? (
                              <span className="badge-danger text-[10px] px-2 py-0.5">{language === "sw" ? "Imeisha" : "Out"}</span>
                            ) : isLow ? (
                              <span className="badge-warning text-[10px] px-2 py-0.5">{product.stock} pcs</span>
                            ) : (
                              <span className="badge-success text-[10px] px-2 py-0.5">{product.stock} pcs</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-right font-bold text-foreground">
                            {formatMoney(product.selling_price)}
                          </TableCell>
                          <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              disabled={isOut}
                              onClick={() => addToCart(product)}
                              className="h-7 w-7 p-0 rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="product-grid max-h-[480px] overflow-y-auto internal-table-scroll pr-1">
              {filteredProducts.map((product) => {
                const isService = product.item_type === "service" || product.track_inventory === false;
                const trackInventory = !isService;
                const isOut = trackInventory && product.stock <= 0;
                const isLow = trackInventory && product.stock > 0 && product.stock <= (product.low_stock_alert ?? 5);
                const cartItem = cartItems.find((ci) => ci.product_id === product.id);

                return (
                  <button
                    key={product.id}
                    disabled={isOut}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "product-card text-left relative",
                      isOut ? "opacity-50 cursor-not-allowed" : "",
                      cartItem ? "border-foreground ring-1 ring-foreground/20" : ""
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                        {isService ? (language === "sw" ? "Huduma" : "Service") : (product.barcode || product.sku || "PRD")}
                      </span>
                      {isService ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          <Sparkles className="h-2 w-2" />
                          <span>∞</span>
                        </span>
                      ) : isOut ? (
                        <span className="badge-danger shrink-0">{language === "sw" ? "Imeisha" : "Out"}</span>
                      ) : isLow ? (
                        <span className="badge-warning shrink-0">{product.stock}</span>
                      ) : (
                        <span className="badge-neutral shrink-0">{product.stock}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-2 flex-1">
                      {product.name}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs font-bold text-foreground">{formatMoney(product.selling_price)}</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Held Drafts section */}
          {drafts && drafts.length > 0 && (
            <Card className="border border-border bg-card p-4 shadow-xs">
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-accent" />
                <span>{language === "sw" ? "Mauzo Yaliyosimamishwa (Rasimu)" : "Held Drafts"} ({drafts.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {drafts.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => restoreDraft(d)}
                    className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <span>{d.customer_name || "Draft"} · {d.items?.length || 0} items</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), "HH:mm")}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right 5 Columns (Desktop only): Checkout Cart & Summary */}
        <div className="hidden lg:block space-y-4 lg:col-span-5">
          {renderCartCard()}
        </div>
      </div>

      {/* Floating Sticky Cart Bar for Mobile */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.85rem)] inset-x-3 z-40 lg:hidden">
          <div className="flex items-center justify-between rounded-2xl bg-neutral-950 text-white p-3 shadow-2xl border border-neutral-800 dark:bg-card dark:border-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-accent shrink-0">
                <ShoppingCart className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium opacity-85 truncate">
                  {cartItems.reduce((sum, it) => sum + it.quantity, 0)} {language === "sw" ? "bidhaa" : "items"}
                </p>
                <p className="text-sm font-black text-accent truncate">
                  {formatMoney(total)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setMobileCartOpen(true)}
              className="h-10 shrink-0 rounded-xl bg-white text-neutral-950 hover:bg-white/90 dark:bg-white dark:text-neutral-950 px-4 text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <span>{language === "sw" ? "Lipa Sasa" : "Checkout"}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 text-neutral-950" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet */}
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] p-4 safe-bottom">
          <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-border" />
          <SheetHeader className="mb-2 text-left sr-only">
            <SheetTitle>{t("sales.cart")}</SheetTitle>
          </SheetHeader>
          {renderCartCard()}
        </SheetContent>
      </Sheet>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt
          data={lastSale}
          onClose={() => {
            setShowReceipt(false);
            onBackToHistory();
          }}
        />
      )}

      {/* Mobile Camera Scanner */}
      {cameraScannerOpen && (
        <MobileCameraScanner
          open={cameraScannerOpen}
          onOpenChange={setCameraScannerOpen}
          onDetected={(code) => {
            setSearchTerm(code);
            setCameraScannerOpen(false);
          }}
        />
      )}

      {/* Quick Add Product Modal */}
      <AddProductModal
        open={addProductModalOpen}
        onOpenChange={setAddProductModalOpen}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}
