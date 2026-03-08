import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Minus,
  Plus,
  X,
  ArrowLeft,
  User,
  Percent,
  CreditCard,
  Smartphone,
  Banknote,
  Gift,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSale } from "@/hooks/useSales";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt } from "@/components/Receipt";
import { BarcodeScannerInput } from "@/components/common/BarcodeScanner";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { scannerManager } from "@/lib/hardware/barcode-scanner";
import { playSound } from "@/lib/sounds";
import { PageLoader } from "@/components/PageLoader";

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
  discount?: number;
}

interface Payment {
  method: "Cash" | "Card" | "M-Pesa" | "Bank Transfer" | "Gift Card" | "Credit";
  amount: number;
  reference?: string;
}

export default function POSTerminal() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: shopSettings, isLoading: settingsLoading } = useShopSettings();
  const { profile } = useAuth();
  const createSale = useCreateSale();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Record<string, unknown> | null>(null);
  const [parkedSales, setParkedSales] = useState<
    Array<{ id: string; items: CartItem[]; customer?: string }>
  >([]);

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const onScanRef = useRef<(barcode: string) => void>(() => {});

  const subtotal = cartItems.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = item.discount ?? 0;
    return sum + itemTotal - itemDiscount;
  }, 0);

  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : discountType === "fixed" ? discountValue : 0;
  const taxRate = (shopSettings as { tax_rate?: number } | undefined)?.tax_rate ?? 0;
  const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
  const total = subtotal - discountAmount + taxAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = total - totalPaid;

  useEffect(() => {
    const id = setTimeout(() => scannerInputRef.current?.focus(), 100);
    return () => clearTimeout(id);
  }, [cartItems.length]);

  useEffect(() => {
    let mounted = true;
    scannerManager.initialize().then((scanner) => {
      if (mounted) scanner.onScan((b) => onScanRef.current(b));
    });
    return () => {
      mounted = false;
      scannerManager.disconnect();
    };
  }, []);

  const initialLoading =
    products === undefined ||
    shopSettings === undefined ||
    productsLoading ||
    settingsLoading;

  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find(
      (p) =>
        p.barcode === barcode ||
        p.code === barcode ||
        (p as { sku?: string }).sku === barcode
    );
    if (product) {
      playSound("add");
      addToCart(product as Parameters<typeof addToCart>[0]);
    } else {
      setSearchTerm(barcode);
      playSound("error");
      toast.error(language === "sw" ? "Bidhaa haipatikani" : "Product not found");
    }
    scannerInputRef.current?.focus();
  };
  onScanRef.current = handleBarcodeScan;

  const addToCart = (product: { id: string; name: string; name_sw?: string | null; selling_price: number; stock: number }, _variant?: unknown) => {
    if (product.stock <= 0) {
      playSound("error");
      toast.error(language === "sw" ? "Bidhaa haina stoki" : "Out of stock");
      return;
    }
    const existing = cartItems.find((i) => i.product_id === product.id && !i.variant_id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        playSound("error");
        toast.error(language === "sw" ? "Stoki haitoshi" : "Not enough stock");
        return;
      }
      setCartItems((items) =>
        items.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems((items) => [
        ...items,
        {
          id: `cart-${Date.now()}`,
          product_id: product.id,
          name: language === "sw" && product.name_sw ? product.name_sw : product.name,
          price: product.selling_price,
          quantity: 1,
          maxStock: product.stock,
        },
      ]);
    }
    playSound("add");
    setSearchTerm("");
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, Math.min(item.maxStock, item.quantity + delta));
        return { ...item, quantity: newQty };
      })
    );
  };

  const removeItem = (id: string) =>
    setCartItems((items) => items.filter((i) => i.id !== id));

  const applyDiscount = (type: "percentage" | "fixed", value: number) => {
    setDiscountType(type);
    setDiscountValue(value);
    setShowDiscountDialog(false);
    toast.success(language === "sw" ? "Punguzo limewekwa" : "Discount applied");
  };

  const addPayment = (
    method: Payment["method"],
    amount: number,
    reference?: string
  ) => {
    if (amount <= 0) {
      toast.error(
        language === "sw" ? "Kiasi lazima kiwe zaidi ya 0" : "Amount must be greater than 0"
      );
      return;
    }
    if (totalPaid + amount > total) {
      toast.error(
        language === "sw" ? "Malipo yamezidi jumla" : "Payment exceeds total"
      );
      return;
    }
    setPayments((p) => [...p, { method, amount, reference }]);
    if (totalPaid + amount >= total) setShowPaymentDialog(false);
  };

  const handleComplete = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }
    if (amountDue > 0.01) {
      toast.error(
        language === "sw" ? "Malipo hayajatimia" : "Payment not complete"
      );
      return;
    }
    try {
      const paymentMethod =
        payments.length > 0 ? payments[0].method : "Cash";
      const sale = await createSale.mutateAsync({
        customer_id: selectedCustomer ?? null,
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        discount_percent: discountType === "percentage" ? discountValue : 0,
        tax_amount: taxAmount,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
        })),
      });
      const customer = customers?.find((c) => c.id === selectedCustomer);
      setLastSale({
        invoiceNumber: sale.invoice_number,
        date: format(new Date(), "dd MMM yyyy, hh:mm a"),
        customerName: customer?.name ?? t("sales.walkIn"),
        cashier: profile?.full_name,
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod:
          payments.length > 0
            ? payments.map((p) => `${p.method}: ${formatCurrency(p.amount)}`).join(", ")
            : "Cash",
        shopName: shopSettings?.shop_name ?? "",
        shopPhone: (shopSettings as { phone?: string })?.phone,
        shopAddress: (shopSettings as { address?: string })?.address,
        receiptHeader: (shopSettings as { receipt_header?: string | null })?.receipt_header,
        receiptFooter: (shopSettings as { receipt_footer?: string | null })?.receipt_footer,
        logoUrl: (shopSettings as { logo_url?: string | null })?.logo_url,
      });
      setShowReceipt(true);
      setCartItems([]);
      setSelectedCustomer(null);
      setDiscountType("none");
      setDiscountValue(0);
      setPayments([]);
      playSound("success");
      toast.success(
        language === "sw" ? "Mauzo yamehifadhiwa" : "Sale completed"
      );
    } catch (err: unknown) {
      playSound("error");
      toast.error(
        err instanceof Error ? err.message : "Failed to complete sale"
      );
    }
  };

  const parkSale = useCallback(() => {
    if (cartItems.length === 0) return;
    setParkedSales((p) => [
      ...p,
      {
        id: `park-${Date.now()}`,
        items: [...cartItems],
        customer: selectedCustomer ?? undefined,
      },
    ]);
    setCartItems([]);
    setSelectedCustomer(null);
    toast.success(
      language === "sw" ? "Mauzo yamehifadhiwa kwa muda" : "Sale parked"
    );
  }, [cartItems, selectedCustomer, language]);

  const restoreSale = (
    parkedSale: (typeof parkedSales)[0]
  ) => {
    setCartItems(parkedSale.items);
    setSelectedCustomer(parkedSale.customer ?? null);
    setParkedSales((p) => p.filter((x) => x.id !== parkedSale.id));
    toast.success(
      language === "sw" ? "Mauzo yamerejeshwa" : "Sale restored"
    );
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      )
        return;
      if (e.key === "F2") {
        e.preventDefault();
        setShowPaymentDialog(true);
      } else if (e.key === "F3") {
        e.preventDefault();
        setShowCustomerDialog(true);
      } else if (e.key === "F4") {
        e.preventDefault();
        setShowDiscountDialog(true);
      } else if (e.key === "F5") {
        e.preventDefault();
        parkSale();
      } else if (e.key === "Escape") {
        setShowPaymentDialog(false);
        setShowCustomerDialog(false);
        setShowDiscountDialog(false);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [parkSale]);

  const filteredProducts =
    products?.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    ) ?? [];

  if (initialLoading) {
    return <PageLoader message="Loading POS..." messageSw="Inapakia POS..." language={language} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold">
          {shopSettings?.shop_name ?? "POS"}
        </span>
        <Badge variant="outline" className="text-xs">
          F2=Pay | F3=Customer | F4=Discount | F5=Park
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="mb-4">
            <BarcodeScannerInput
              ref={scannerInputRef}
              onScan={handleBarcodeScan}
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={
                language === "sw"
                  ? "Scan au andika barcode..."
                  : "Scan or type barcode..."
              }
              className="h-12 w-full border-2 border-primary/30 font-mono"
            />
          </div>

          <div className="mb-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerDialog(true)}
              className="flex-1"
            >
              <User className="mr-2 h-4 w-4" />
              {selectedCustomer
                ? customers?.find((c) => c.id === selectedCustomer)?.name
                : t("sales.selectCustomer")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscountDialog(true)}
              className="flex-1"
            >
              <Percent className="mr-2 h-4 w-4" />
              {discountType !== "none"
                ? `${formatCurrency(discountAmount)}`
                : t("sales.discount")}
            </Button>
          </div>

          <div className="flex flex-1 flex-wrap gap-2 overflow-y-auto">
            {searchTerm && filteredProducts.length > 0
              ? filteredProducts.slice(0, 20).map((product) => (
                  <Button
                    key={product.id}
                    size="lg"
                    variant="outline"
                    className="h-24 min-w-[140px] flex-col gap-1 text-base"
                    onClick={() =>
                      addToCart(product as Parameters<typeof addToCart>[0])
                    }
                    disabled={product.stock <= 0}
                  >
                    <span className="line-clamp-2 text-center">
                      {language === "sw" && product.name_sw
                        ? product.name_sw
                        : product.name}
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency(product.selling_price)}
                    </span>
                    {product.stock <= (product.low_stock_alert ?? 5) && (
                      <Badge variant="destructive" className="text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </Button>
                ))
              : products?.slice(0, 24).map((product) => (
                  <Button
                    key={product.id}
                    size="lg"
                    variant="outline"
                    className="h-24 min-w-[140px] flex-col gap-1 text-base"
                    onClick={() =>
                      addToCart(product as Parameters<typeof addToCart>[0])
                    }
                    disabled={product.stock <= 0}
                  >
                    <span className="line-clamp-2 text-center">
                      {language === "sw" && product.name_sw
                        ? product.name_sw
                        : product.name}
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency(product.selling_price)}
                    </span>
                    {product.stock <= (product.low_stock_alert ?? 5) && (
                      <Badge variant="destructive" className="text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </Button>
                ))}
          </div>
        </div>

        <div className="flex w-full flex-col border-l bg-muted/30 md:w-[400px]">
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{t("sales.cart")}</h3>
              {cartItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={parkSale}>
                  Park (F5)
                </Button>
              )}
            </div>

            {parkedSales.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium">Parked:</p>
                {parkedSales.map((ps) => (
                  <Button
                    key={ps.id}
                    variant="outline"
                    size="sm"
                    className="mb-2 w-full justify-start"
                    onClick={() => restoreSale(ps)}
                  >
                    {ps.items.length} items
                    {ps.customer &&
                      ` • ${customers?.find((c) => c.id === ps.customer)?.name ?? ""}`}
                  </Button>
                ))}
              </div>
            )}

            {cartItems.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {t("sales.barcodeOrSearch")}
              </p>
            ) : (
              <Table>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-lg font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            @ {formatCurrency(item.price)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right text-lg font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="border-t p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount:</span>
                  <span className="font-medium">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax:</span>
                  <span className="font-medium">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-2xl font-bold">
                <span>{t("sales.total")}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="font-medium">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-destructive">
                    <span>Due:</span>
                    <span>{formatCurrency(amountDue)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {amountDue > 0.01 ? (
                <Button
                  size="lg"
                  className="h-16 w-full text-xl"
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={cartItems.length === 0}
                >
                  <CreditCard className="mr-2 h-6 w-6" />
                  Pay {formatCurrency(amountDue)}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-16 w-full text-xl"
                  onClick={handleComplete}
                  disabled={
                    cartItems.length === 0 || createSale.isPending
                  }
                >
                  <CheckCircle className="mr-2 h-6 w-6" />
                  {t("sales.completeSale")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  method: "Cash" as const,
                  icon: Banknote,
                  color: "bg-green-100 text-green-700",
                },
                {
                  method: "Card" as const,
                  icon: CreditCard,
                  color: "bg-blue-100 text-blue-700",
                },
                {
                  method: "M-Pesa" as const,
                  icon: Smartphone,
                  color: "bg-green-100 text-green-700",
                },
                {
                  method: "Gift Card" as const,
                  icon: Gift,
                  color: "bg-purple-100 text-purple-700",
                },
              ].map(({ method, icon: Icon, color }) => (
                <Button
                  key={method}
                  variant="outline"
                  className={`h-24 flex-col gap-2 ${color}`}
                  onClick={() => addPayment(method, amountDue)}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-semibold">{method}</span>
                </Button>
              ))}
            </div>
            {payments.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Payments:</h4>
                {payments.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm"
                  >
                    <span>{p.method}:</span>
                    <span className="font-medium">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            <Button
              variant={selectedCustomer === null ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                setSelectedCustomer(null);
                setShowCustomerDialog(false);
              }}
            >
              {t("sales.walkIn")}
            </Button>
            {customers?.map((customer) => (
              <Button
                key={customer.id}
                variant={
                  selectedCustomer === customer.id ? "default" : "outline"
                }
                className="w-full justify-start"
                onClick={() => {
                  setSelectedCustomer(customer.id);
                  setShowCustomerDialog(false);
                }}
              >
                {customer.name}
                {(customer as { loyalty_points?: number }).loyalty_points > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {(customer as { loyalty_points?: number }).loyalty_points} pts
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={discountType}
                onValueChange={(v: "none" | "percentage" | "fixed") =>
                  setDiscountType(v)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountType !== "none" && (
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input
                  type="number"
                  placeholder={
                    discountType === "percentage" ? "e.g. 10" : "e.g. 5000"
                  }
                  value={discountValue || ""}
                  onChange={(e) =>
                    setDiscountValue(parseFloat(e.target.value) || 0)
                  }
                  className="mt-2"
                />
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => {
                if (discountType === "none") {
                  setShowDiscountDialog(false);
                } else {
                  applyDiscount(discountType, discountValue);
                }
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showReceipt && lastSale && (
        <Receipt
          data={lastSale as Parameters<typeof Receipt>[0]["data"]}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
