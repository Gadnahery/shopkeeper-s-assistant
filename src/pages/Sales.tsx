import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CheckCircle,
  Loader2,
  Minus,
  Plus,
  Printer,
  ScanLine,
  Search,
  ShoppingBag,
  Wallet,
  X,
  TimerReset,
  ReceiptText,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSale, useDeleteDraftSale, useDraftSales, useSaveDraftSale } from "@/hooks/useSales";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt } from "@/components/Receipt";
import { PageLoader } from "@/components/PageLoader";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function Sales() {
  const { t, language } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [cashAmount, setCashAmount] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("walk-in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [draftToDeleteId, setDraftToDeleteId] = useState<string | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousAutoCashRef = useRef("");

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customers } = useCustomers();
  const { data: shopSettings, isLoading: settingsLoading } = useShopSettings();
  const { profile } = useAuth();
  const { data: drafts, isLoading: draftsLoading } = useDraftSales();

  const initialLoading =
    products === undefined ||
    shopSettings === undefined ||
    drafts === undefined ||
    productsLoading ||
    settingsLoading ||
    draftsLoading;

  const createSale = useCreateSale();
  const saveDraft = useSaveDraftSale();
  const deleteDraft = useDeleteDraftSale();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = parseInt(discountAmount) || Math.round(subtotal * (parseInt(discountPercent) || 0) / 100);
  const total = subtotal - discount;
  const cashPaid = parseFloat(cashAmount) || 0;
  const mpesaPaid = parseFloat(mpesaAmount) || 0;
  const totalPaid = cashPaid + mpesaPaid;
  const changeDue = Math.max(0, totalPaid - total);

  useEffect(() => {
    const nextAutoCash = total > 0 ? String(total) : "";
    const shouldAutoFillCash =
      mpesaAmount.trim() === "" &&
      (cashAmount.trim() === "" || cashAmount === previousAutoCashRef.current);

    if (shouldAutoFillCash && cashAmount !== nextAutoCash) {
      setCashAmount(nextAutoCash);
    }

    previousAutoCashRef.current = nextAutoCash;
  }, [total, cashAmount, mpesaAmount]);

  if (initialLoading) {
    return <PageLoader message="Loading sales..." messageSw="Inapakia mauzo..." language={language} />;
  }

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, Math.min(item.maxStock, item.quantity + delta));
        return { ...item, quantity: newQty };
      })
    );
  };

  const removeItem = (id: string) => setCartItems((items) => items.filter((item) => item.id !== id));

  const addToCart = (product: NonNullable<typeof products>[0]) => {
    if (product.stock <= 0) {
      toast.error(language === "sw" ? "Bidhaa hii haina stoki" : "Product out of stock");
      return;
    }

    const existing = cartItems.find((item) => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(language === "sw" ? "Stoki haitoshi" : "Not enough stock");
        return;
      }
      updateQuantity(existing.id, 1);
    } else {
      setCartItems([
        ...cartItems,
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

    setSearchTerm("");
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find((p) => p.barcode === barcode || p.code === barcode);
    if (product) {
      addToCart(product);
    } else {
      setSearchTerm(barcode);
      toast.error(language === "sw" ? "Bidhaa haipatikani" : "Product not found");
    }
  };

  const filteredProducts =
    products?.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    ) || [];

  const featuredProducts = filteredProducts.slice(0, searchTerm ? 12 : 8);

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const saleStats = [
    {
      label: language === "sw" ? "Bidhaa kwenye kikapu" : "Items in cart",
      value: `${cartItems.length}`,
      tone: "text-foreground",
      icon: ShoppingBag,
    },
    {
      label: language === "sw" ? "Jumla ya malipo" : "Checkout total",
      value: formatNumber(total),
      tone: "text-primary",
      icon: Wallet,
    },
    {
      label: language === "sw" ? "Chenji" : "Change due",
      value: formatNumber(changeDue),
      tone: "text-foreground",
      icon: ReceiptText,
    },
  ];

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }
    if (total <= 0) {
      toast.error(language === "sw" ? "Jumla ya mauzo si sahihi" : "Sale total is invalid");
      return;
    }
    if (totalPaid <= 0) {
      toast.error(language === "sw" ? "Weka kiasi cha malipo" : "Enter a payment amount");
      return;
    }
    if (totalPaid < total) {
      toast.error(language === "sw" ? "Malipo hayatoshi kukamilisha mauzo" : "Payment is not enough to complete this sale");
      return;
    }
    if (mpesaPaid > 0 && !mpesaCode.trim()) {
      toast.error(language === "sw" ? "Weka namba ya muamala wa M-Pesa" : "Enter the M-Pesa transaction code");
      return;
    }

    const paymentMethod = cashPaid > 0 && mpesaPaid > 0 ? "Split" : mpesaPaid > 0 ? "M-Pesa" : "Cash";
    const customerId = selectedCustomer === "walk-in" ? null : selectedCustomer;
    const custName =
      selectedCustomer === "walk-in"
        ? customerName.trim() || null
        : customers?.find((c) => c.id === selectedCustomer)?.name || customerName || null;

    try {
      const sale = await createSale.mutateAsync({
        customer_id: customerId,
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

      const receiptCustomerName =
        custName ||
        (selectedCustomer === "walk-in"
          ? t("sales.walkIn")
          : customers?.find((c) => c.id === selectedCustomer)?.name || t("sales.walkIn"));

      setLastSale({
        invoiceNumber: sale.invoice_number,
        date: format(new Date(), "dd MMM yyyy, hh:mm a"),
        customerName: receiptCustomerName,
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
        shopName: shopSettings?.shop_name || "",
        shopPhone: shopSettings?.phone || undefined,
        shopAddress: shopSettings?.address || undefined,
        receiptHeader: (shopSettings as { receipt_header?: string | null })?.receipt_header,
        receiptFooter: (shopSettings as { receipt_footer?: string | null })?.receipt_footer,
        logoUrl: (shopSettings as { logo_url?: string | null })?.logo_url,
      });

      setShowReceipt(true);
      setCartItems([]);
      setDiscountAmount("0");
      setDiscountPercent("0");
      setCashAmount("");
      setMpesaAmount("");
      setMpesaCode("");
      setSelectedCustomer("walk-in");
      setCustomerName("");
      setCustomerPhone("");
      previousAutoCashRef.current = "";

      if (activeDraftId) {
        try {
          await deleteDraft.mutateAsync(activeDraftId);
        } catch {
          toast.error(language === "sw" ? "Mauzo yamekamilika lakini rasimu ya zamani haikufutika." : "Sale completed, but the original draft could not be removed.");
        } finally {
          setActiveDraftId(null);
        }
      }
    } catch (error) {
      // Handled inside mutation.
    }
  };

  const handleSaveDraft = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }

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
    setCustomerName("");
    setCashAmount("");
    setMpesaAmount("");
    setMpesaCode("");
    previousAutoCashRef.current = "";

    if (activeDraftId) {
      try {
        await deleteDraft.mutateAsync(activeDraftId);
      } catch {
        toast.error(language === "sw" ? "Rasimu mpya imehifadhiwa lakini rasimu ya zamani bado ipo." : "New draft saved, but the old draft is still there.");
      } finally {
        setActiveDraftId(null);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={language === "sw" ? "Mauzo" : "Sales"}
        subtitle={
          language === "sw"
            ? "POS mpya iliyorahisishwa kwa kuuza kwa haraka, kutafuta bidhaa kwa urahisi, na kukamilisha malipo bila msongamano."
            : "A cleaner POS flow for quick product search, faster checkout, and easier daily selling."
        }
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={handleSaveDraft} disabled={cartItems.length === 0 || saveDraft.isPending}>
              {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              {t("sales.saveAsDraft")}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => lastSale && setShowReceipt(true)} disabled={!lastSale}>
              <Printer className="h-4 w-4" />
              {t("sales.printReceipt")}
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-4">
          <Card className="section-shell overflow-hidden">
            <CardContent className="p-5 md:p-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                      <ScanLine className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {language === "sw" ? "Tafuta au scan bidhaa" : "Search or scan products"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === "sw"
                          ? "Andika jina, code, au barcode. Bidhaa maarufu zinaonekana chini."
                          : "Type a name, code, or barcode. Matching products appear instantly below."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--background)/0.8),hsl(var(--background)/0.58))] p-3 shadow-inner">
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder={t("sales.searchOrScan")}
                        className="border-0 bg-transparent p-0 text-base focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && searchTerm.trim()) {
                            e.preventDefault();
                            handleBarcodeScan(searchTerm.trim());
                          }
                        }}
                        autoFocus
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {saleStats.map((stat) => (
                      <div key={stat.label} className="rounded-[1.35rem] border border-border/70 bg-background/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</span>
                          <stat.icon className="h-4 w-4 text-primary/80" />
                        </div>
                        <p className={`mt-4 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {featuredProducts.length === 0 ? (
                      <div className="col-span-full rounded-[1.35rem] border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center text-sm text-muted-foreground">
                        {language === "sw" ? "Hakuna bidhaa zinazolingana na utafutaji huu." : "No products match this search yet."}
                      </div>
                    ) : (
                      featuredProducts.map((product) => {
                        const productName = language === "sw" && product.name_sw ? product.name_sw : product.name;
                        const outOfStock = product.stock <= 0;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={outOfStock}
                            className="group rounded-[1.45rem] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--background)/0.7),hsl(var(--background)/0.56))] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background/80 disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">{productName}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{product.code}</p>
                              </div>
                              <Badge variant={outOfStock ? "destructive" : "secondary"} className="shrink-0 rounded-full">
                                {outOfStock ? (language === "sw" ? "Imeisha" : "Out") : `${product.stock}`}
                              </Badge>
                            </div>
                            <div className="mt-5 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">{language === "sw" ? "Bei ya kuuza" : "Sell price"}</p>
                                <p className="text-lg font-bold text-foreground">{formatNumber(product.selling_price)}</p>
                              </div>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{language === "sw" ? "Ongeza" : "Add"}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[1.45rem] border border-primary/15 bg-[linear-gradient(145deg,hsl(var(--primary)/0.14),transparent_55%)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {language === "sw" ? "Kituo cha checkout" : "Checkout lane"}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-foreground">
                          {language === "sw" ? "Tayari kwa malipo ya haraka" : "Ready for fast payment"}
                        </p>
                      </div>
                      <TimerReset className="h-5 w-5 text-primary" />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                      <div className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {language === "sw" ? "Miamala ya sasa" : "Current invoice"}
                        </p>
                        <p className="mt-3 text-lg font-bold text-foreground">{`INV-${format(new Date(), "yyyyMMdd")}`}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-border/70 bg-background/45 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{language === "sw" ? "Hifadhi ya kazi" : "Work in progress"}</p>
                      <Badge variant="secondary" className="rounded-full">
                        {drafts?.length || 0}
                      </Badge>
                    </div>
                    {(drafts && drafts.length > 0) ? (
                      <div className="mt-3 space-y-2">
                        {drafts.slice(0, 4).map((d: any) => (
                          <div key={d.id} className="rounded-2xl border border-border/70 bg-background/65 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground">{d.invoice_number}</p>
                                <p className="text-sm text-muted-foreground">{formatNumber(Number(d.total))}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const items = (d.sale_items || []).map((si: any) => ({
                                      id: `cart-${Date.now()}-${si.product_id}`,
                                      product_id: si.product_id,
                                      name: si.product_name,
                                      price: si.unit_price,
                                      quantity: si.quantity,
                                      maxStock: products?.find((p) => p.id === si.product_id)?.stock || 999,
                                    }));
                                    setCartItems(items);
                                    setDiscountAmount(String(d.discount_amount || 0));
                                    setDiscountPercent(String(d.discount_percent || 0));
                                    setCashAmount("");
                                    setMpesaAmount("");
                                    setMpesaCode(d.mpesa_code || "");
                                    setSelectedCustomer("walk-in");
                                    setCustomerName(d.customer_name || "");
                                    setActiveDraftId(d.id);
                                  }}
                                >
                                  {language === "sw" ? "Endelea" : "Resume"}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDraftToDeleteId(d.id)}>
                                  {language === "sw" ? "Futa" : "Delete"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {language === "sw" ? "Hakuna rasimu zilizohifadhiwa kwa sasa." : "No saved drafts at the moment."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="section-shell">
            <CardContent className="p-5 md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{language === "sw" ? "Kikapu cha sasa" : "Current cart"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {language === "sw"
                      ? "Badili kiasi au futa bidhaa kabla ya kukamilisha mauzo."
                      : "Adjust quantity or remove products before finishing checkout."}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {cartItems.length} {language === "sw" ? "bidhaa" : "items"}
                </Badge>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">{t("sales.qty")}</TableHead>
                      <TableHead>{t("sales.product")}</TableHead>
                      <TableHead className="text-right">{t("sales.price")}</TableHead>
                      <TableHead className="text-right">{t("sales.subtotal")}</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          {t("sales.barcodeOrSearch")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      cartItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.price)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatNumber(item.price * item.quantity)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {cartItems.length === 0 ? (
                  <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    {t("sales.barcodeOrSearch")}
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="rounded-[1.35rem] border border-border/70 bg-background/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{formatNumber(item.price)} each</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-lg font-bold text-foreground">{formatNumber(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="section-shell xl:sticky xl:top-24">
            <CardContent className="space-y-6 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{language === "sw" ? "Malipo" : "Checkout"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {language === "sw"
                      ? "Hakiki mteja, punguzo, na malipo kabla ya kukamilisha."
                      : "Review customer, discount, and payment before completing the sale."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("sales.customer")}</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t("sales.selectCustomer")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">{t("sales.walkIn")}</SelectItem>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <Label>{t("sales.customerName")}</Label>
                    <Input
                      placeholder={language === "sw" ? "Jina la mteja (si lazima)" : "Customer name (optional)"}
                      className="h-12"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("sales.phone")}</Label>
                    <Input placeholder={t("sales.enterPhone")} className="h-12" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.45rem] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--background)/0.7),hsl(var(--background)/0.55))] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("sales.subtotal")}</span>
                  <span className="font-semibold text-foreground">{formatNumber(subtotal)}</span>
                </div>

                <div className="mt-4 space-y-2">
                  <Label className="text-muted-foreground">{t("sales.discount")}</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <Input
                        value={discountAmount}
                        onChange={(e) => {
                          setDiscountAmount(e.target.value);
                          setDiscountPercent("0");
                        }}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Tsh</span>
                    </div>
                    <div className="relative">
                      <Input
                        value={discountPercent}
                        onChange={(e) => {
                          setDiscountPercent(e.target.value);
                          setDiscountAmount("0");
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
                  <span className="text-base font-medium text-muted-foreground">{t("sales.total")}</span>
                  <span className="text-3xl font-bold text-foreground">{formatNumber(total)}</span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>{t("sales.cash")}</Label>
                  <Input value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder={formatNumber(total)} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>{t("sales.mpesa")}</Label>
                  <Input value={mpesaAmount} onChange={(e) => setMpesaAmount(e.target.value)} placeholder={t("sales.enterAmount")} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>{t("sales.mpesaCode")}</Label>
                  <Input value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value)} placeholder={t("sales.transactionCode")} className="h-12" />
                </div>
              </div>

              <div className="rounded-[1.45rem] border border-primary/15 bg-gradient-to-br from-primary/12 to-blue-500/8 p-4">
                <p className="text-sm font-semibold text-foreground">{language === "sw" ? "Muhtasari wa malipo" : "Payment summary"}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "sw" ? "Imelipwa" : "Paid"}</span>
                    <span className="font-semibold text-foreground">{formatNumber(totalPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "sw" ? "Salio" : "Remaining"}</span>
                    <span className={`font-semibold ${totalPaid < total ? "text-destructive" : "text-foreground"}`}>
                      {formatNumber(Math.max(total - totalPaid, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "sw" ? "Chenji" : "Change"}</span>
                    <span className="font-semibold text-primary">{formatNumber(changeDue)}</span>
                  </div>
                </div>
              </div>

              <Button
                className="h-12 w-full gap-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/20 hover:from-teal-600 hover:to-blue-700"
                onClick={handleCompleteSale}
                disabled={cartItems.length === 0 || createSale.isPending}
              >
                {createSale.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {t("sales.completeSale")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <AlertDialog open={!!draftToDeleteId} onOpenChange={(open) => !open && setDraftToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa rasimu hii?" : "Delete this draft?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => draftToDeleteId && deleteDraft.mutate(draftToDeleteId, { onSettled: () => setDraftToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showReceipt && lastSale ? <Receipt data={lastSale} onClose={() => setShowReceipt(false)} /> : null}
    </motion.div>
  );
}
