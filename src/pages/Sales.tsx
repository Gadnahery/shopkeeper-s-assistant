import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  CheckCircle,
  ClipboardList,
  CreditCard,
  History,
  Loader2,
  Minus,
  Package,
  Plus,
  Printer,
  ReceiptText,
  ScanLine,
  Search,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  Wallet,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSale, useDeleteDraftSale, useDraftSales, useSaveDraftSale } from "@/hooks/useSales";
import { useOrders } from "@/hooks/useOrders";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt } from "@/components/Receipt";
import { PageLoader } from "@/components/PageLoader";
import { MobileCameraScanner } from "@/components/common/MobileCameraScanner";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { playSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import Orders from "./Orders";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
  trackInventory: boolean;
}

export default function Sales() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [cashAmount, setCashAmount] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("walk-in");
  const [customerMode, setCustomerMode] = useState<"walk-in" | "existing" | "custom">("walk-in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showReceipt, setShowReceipt] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get("tab") === "orders" ? "orders" : "pos";
  const setActiveView = (view: "pos" | "orders") => {
    if (view === "orders") {
      setSearchParams({ tab: "orders" });
    } else {
      setSearchParams({});
    }
  };

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: customers } = useCustomers();
  const { data: shopSettings } = useShopSettings();
  const { profile } = useAuth();
  const { data: drafts } = useDraftSales();
  const { data: orders } = useOrders();

  const pendingOrdersCount = useMemo(() => {
    return (orders || []).filter((o: any) => o.status === "pending" || o.status === "processing").length;
  }, [orders]);

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
      selectedCategory === "all" || p.category_id === selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
          name: language === "sw" && product.name_sw ? product.name_sw : product.name,
          price: Number(product.selling_price) || 0,
          quantity: 1,
          maxStock: trackInventory ? product.stock : Number.POSITIVE_INFINITY,
          trackInventory,
        },
      ];
    });
    playSound("click");
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

  // Auto-fill cash input with exact total if user hasn't typed
  useEffect(() => {
    if (total > 0 && !cashAmount && !mpesaAmount) {
      setCashAmount(String(total));
    }
  }, [total]);

  if (products === undefined || productsLoading) {
    return <PageLoader message="Loading POS..." messageSw="Inapakia mfumo wa mauzo..." language={language} />;
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }
    if (totalPaid < total) {
      toast.error(language === "sw" ? "Kiasi cha malipo hakitoshi" : "Payment amount is less than total");
      return;
    }

    const paymentMethod = cashPaid > 0 && mpesaPaid > 0 ? "Split" : mpesaPaid > 0 ? "M-Pesa" : "Cash";
    const custName =
      customerMode === "walk-in"
        ? null
        : customerMode === "existing"
        ? customers?.find((c) => c.id === selectedCustomer)?.name || null
        : customerName.trim() || null;
    const custId = customerMode === "existing" && selectedCustomer !== "walk-in" ? selectedCustomer : null;

    try {
      const sale = await createSale.mutateAsync({
        customer_id: custId,
        customer_name: custName,
        payment_method: paymentMethod,
        mpesa_code: mpesaCode || null,
        discount_amount: discount,
        discount_percent: parseInt(discountPercent) || 0,
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
      });

      setShowReceipt(true);
      setMobileCartOpen(false);
      setCartItems([]);
      setDiscountAmount("0");
      setDiscountPercent("0");
      setCashAmount("");
      setMpesaAmount("");
      setMpesaCode("");
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
        {/* Flexible Customer Selector */}
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
                {language === "sw" ? "Andika Jina" : "Type Name"}
              </button>
            </div>
          </div>

          {customerMode === "walk-in" && (
            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2 border border-border text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{language === "sw" ? "Mteja wa Kawaida (Walk-in)" : "Walk-in Customer"}</span>
              <span className="text-[10px] text-muted-foreground">{language === "sw" ? "Hakuna deni" : "No credit linked"}</span>
            </div>
          )}

          {customerMode === "existing" && (
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                <SelectValue placeholder={language === "sw" ? "Chagua mteja..." : "Select customer..."} />
              </SelectTrigger>
              <SelectContent className="max-h-56 rounded-xl border-border bg-popover text-xs">
                {(customers || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {customerMode === "custom" && (
            <div className="space-y-1.5">
              <Input
                placeholder={language === "sw" ? "Jina la Mteja (mf. Juma Hamisi)..." : "Customer Name (e.g. John Doe)..."}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 rounded-xl border-border bg-background text-xs font-semibold"
              />
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
              <ShoppingBag className="h-6 w-6 mb-1 text-muted-foreground/60" />
              <span>{language === "sw" ? "Kikapu kiko tupu. Bonyeza bidhaa kuongeza." : "Cart is empty. Tap items to add."}</span>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatMoney(item.price)}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="h-7 w-7 rounded-lg border-border"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="h-7 w-7 rounded-lg border-border"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="w-20 text-right text-xs font-bold text-foreground">
                  {formatMoney(item.price * item.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-1.5 rounded-xl bg-muted/40 p-3 text-xs border border-border/60">
          <div className="flex justify-between text-muted-foreground">
            <span>{t("sales.subtotal")}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[var(--danger-text)] font-semibold">
              <span>{t("sales.discount")}</span>
              <span>-{formatMoney(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
            <span>{t("sales.total")}</span>
            <span className="text-base">{formatMoney(total)}</span>
          </div>
        </div>

        {/* Payment Amount & Method */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground">Cash (TSH)</Label>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0"
                className="h-9 rounded-xl border-border bg-background text-xs font-bold text-center"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground">M-Pesa / Mobile (TSH)</Label>
              <Input
                type="number"
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(e.target.value)}
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
    <div className="space-y-6 pb-12">
      {/* Top Module Sub-Navigation (POS vs Customer Orders) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "pos" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("pos")}
            className="h-8 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <Tag className="h-3.5 w-3.5 text-accent" />
            <span>{language === "sw" ? "POS / Mauzo ya Papo Hapo" : "POS / Instant Sale"}</span>
          </Button>
          <Button
            variant={activeView === "orders" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("orders")}
            className="h-8 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <ClipboardList className="h-3.5 w-3.5 text-accent" />
            <span>{language === "sw" ? "Maagizo ya Wateja" : "Customer Orders"}</span>
            {pendingOrdersCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">
                {pendingOrdersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {activeView === "orders" ? (
        <Orders />
      ) : (
        <>
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
                className="h-10 w-10 rounded-xl border-border"
                title="Camera Scanner"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
          </Card>

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

          {/* Product Grid */}
          <div className="product-grid">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full empty-state py-10">
                <div className="empty-state-icon">
                  <Package className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-foreground">{language === "sw" ? "Hakuna bidhaa" : "No products found"}</p>
                <p className="text-xs text-muted-foreground">{language === "sw" ? "Jaribu kutafuta tena au badilisha aina." : "Try a different search or category."}</p>
              </div>
            ) : (
              filteredProducts.slice(0, 30).map((product) => {
                const isService = product.item_type === "service" || product.track_inventory === false;
                const trackInventory = !isService;
                const isOut = trackInventory && product.stock <= 0;
                const isLow = trackInventory && product.stock > 0 && product.stock <= (product.low_stock_alert ?? 5);
                return (
                  <button
                    key={product.id}
                    disabled={isOut}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "product-card text-left",
                      isOut ? "opacity-50 cursor-not-allowed" : "",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                        {isService ? (language === "sw" ? "Huduma" : "Service") : (product.barcode || product.sku || "PROD")}
                      </span>
                      {isOut ? (
                        <span className="badge-danger shrink-0">{language === "sw" ? "Imeisha" : "Out"}</span>
                      ) : isLow ? (
                        <span className="badge-warning shrink-0">{product.stock}</span>
                      ) : isService ? (
                        <span className="badge-neutral shrink-0">∞</span>
                      ) : (
                        <span className="badge-neutral shrink-0">{product.stock}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-2 flex-1">
                      {product.name}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs font-bold text-foreground">{formatMoney(product.selling_price)}</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

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

      {/* Floating Sticky Cart Bar for Mobile (Above Bottom Nav) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-[74px] inset-x-3 z-30 lg:hidden safe-bottom">
          <div className="flex items-center justify-between rounded-2xl bg-primary text-primary-foreground p-3 shadow-xl border border-primary/20">
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
              className="h-9 shrink-0 rounded-xl bg-accent px-3.5 text-xs font-bold text-primary shadow-xs hover:bg-accent/90"
            >
              <span>{language === "sw" ? "Lipa Sasa" : "Checkout"}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1 text-primary" />
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
      </>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt data={lastSale} onClose={() => setShowReceipt(false)} />
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
    </div>
  );
}
