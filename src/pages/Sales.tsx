import { useState, useRef } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, Printer, Minus, Plus, X, Loader2, ScanLine, Monitor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSale, useDraftSales, useSaveDraftSale, useCompleteDraftSale, useDeleteDraftSale } from "@/hooks/useSales";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt } from "@/components/Receipt";
import { PageLoader } from "@/components/PageLoader";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function Sales() {
  const navigate = useNavigate();
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: shopSettings, isLoading: settingsLoading } = useShopSettings();
  const { profile } = useAuth();
  const { data: drafts, isLoading: draftsLoading } = useDraftSales();

  const initialLoading =
    (productsLoading && !products) ||
    (customersLoading && !customers) ||
    (settingsLoading && !shopSettings) ||
    (draftsLoading && !drafts);

  const createSale = useCreateSale();
  const saveDraft = useSaveDraftSale();
  const completeDraft = useCompleteDraftSale();
  const deleteDraft = useDeleteDraftSale();

  if (initialLoading) {
    return <PageLoader message="Loading sales..." messageSw="Inapakia mauzo..." language={language} />;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = parseInt(discountAmount) || Math.round(subtotal * (parseInt(discountPercent) || 0) / 100);
  const total = subtotal - discount;

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(items => items.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(1, Math.min(item.maxStock, item.quantity + delta));
      return { ...item, quantity: newQty };
    }));
  };

  const removeItem = (id: string) => setCartItems(items => items.filter(item => item.id !== id));

  const addToCart = (product: NonNullable<typeof products>[0]) => {
    if (product.stock <= 0) {
      toast.error(language === "sw" ? "Bidhaa hii haina stoki" : "Product out of stock");
      return;
    }
    const existing = cartItems.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(language === "sw" ? "Stoki haitoshi" : "Not enough stock");
        return;
      }
      updateQuantity(existing.id, 1);
    } else {
      setCartItems([...cartItems, {
        id: `cart-${Date.now()}`, product_id: product.id,
        name: language === "sw" && product.name_sw ? product.name_sw : product.name,
        price: product.selling_price, quantity: 1, maxStock: product.stock,
      }]);
    }
    setSearchTerm("");
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find(p => p.barcode === barcode || p.code === barcode);
    if (product) addToCart(product);
    else { setSearchTerm(barcode); toast.error(language === "sw" ? "Bidhaa haipatikani" : "Product not found"); }
  };

  const filteredProducts = products?.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm))
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }
    const paymentMethod = parseFloat(mpesaAmount) > 0 ? "M-Pesa" : "Cash";
    const customerId = selectedCustomer === "walk-in" ? null : selectedCustomer;
    const custName = selectedCustomer === "walk-in" ? (customerName.trim() || null) : (customers?.find(c => c.id === selectedCustomer)?.name || customerName || null);

    try {
      const sale = await createSale.mutateAsync({
        customer_id: customerId, customer_name: custName, payment_method: paymentMethod,
        mpesa_code: mpesaCode || null, discount_amount: discount,
        discount_percent: parseInt(discountPercent) || 0,
        items: cartItems.map(item => ({ product_id: item.product_id, product_name: item.name, unit_price: item.price, quantity: item.quantity })),
      });

      const receiptCustomerName = custName || (selectedCustomer === "walk-in" ? t("sales.walkIn") : customers?.find(c => c.id === selectedCustomer)?.name || t("sales.walkIn"));

      setLastSale({
        invoiceNumber: sale.invoice_number,
        date: format(new Date(), "dd MMM yyyy, hh:mm a"),
        customerName: receiptCustomerName,
        cashier: profile?.full_name || undefined,
        items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price, total: item.price * item.quantity })),
        subtotal, discount, total, paymentMethod,
        mpesaCode: mpesaCode || undefined,
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
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 md:gap-6 lg:grid-cols-4">
        <div className="space-y-4 md:space-y-6 lg:col-span-3">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("sales.customer")}</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-11 md:h-12"><SelectValue placeholder={t("sales.selectCustomer")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">{t("sales.walkIn")}</SelectItem>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("sales.customerName")}</Label>
                  <Input placeholder={language === "sw" ? "Jina la mteja (si lazima)" : "Customer name (optional)"} className="h-11 md:h-12" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("sales.phone")}</Label>
                  <Input placeholder={t("sales.enterPhone")} className="h-11 md:h-12" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
              </div>
              {drafts && drafts.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Rasimu" : "Drafts"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {drafts.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                        <span>{d.invoice_number} - {formatNumber(Number(d.total))}</span>
                        <Button variant="outline" size="sm" onClick={() => {
                          const items = (d.sale_items || []).map((si: any) => ({
                            id: `cart-${Date.now()}-${si.product_id}`,
                            product_id: si.product_id,
                            name: si.product_name,
                            price: si.unit_price,
                            quantity: si.quantity,
                            maxStock: products?.find(p => p.id === si.product_id)?.stock || 999,
                          }));
                          setCartItems(items);
                          setSelectedCustomer("walk-in");
                          setCustomerName(d.customer_name || "");
                          deleteDraft.mutate(d.id);
                        }}>{language === "sw" ? "Endelea" : "Resume"}</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDraftToDeleteId(d.id)}>{language === "sw" ? "Futa" : "Delete"}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/sales/terminal")}>
            <CardContent className="flex h-14 md:h-16 items-center gap-3 p-4">
              <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{language === "sw" ? "Hali ya Terminal" : "Terminal Mode"}</span>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => searchInputRef.current?.focus()} title={language === "sw" ? "Lenga mstari wa utafutaji na uscan na skana ya USB" : "Focus search field to scan with USB barcode scanner"}>
              <CardContent className="flex h-14 md:h-16 items-center gap-3 p-4">
                <ScanLine className="h-5 w-5 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{t("sales.scanBarcode")}</span>
              </CardContent>
            </Card>
            <Card className="relative">
              <CardContent className="flex h-14 md:h-16 items-center gap-3 p-4">
                <Search className="h-5 w-5 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)] shrink-0" />
                <Input
                  ref={searchInputRef}
                  placeholder={t("sales.searchOrScan")}
                  className="border-0 bg-transparent p-0 focus-visible:ring-0"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchTerm.trim()) {
                      e.preventDefault();
                      handleBarcodeScan(searchTerm.trim());
                    }
                  }}
                  autoFocus
                  autoComplete="off"
                />
              </CardContent>
              {searchTerm && filteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-card shadow-lg">
                  {filteredProducts.slice(0, 10).map(product => (
                    <button key={product.id} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted" onClick={() => addToCart(product)}>
                      <div>
                        <p className="font-medium">{language === "sw" && product.name_sw ? product.name_sw : product.name}</p>
                        <p className="text-sm text-foreground/70 dark:text-foreground/80">{product.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(product.selling_price)}</p>
                        <p className="text-sm text-muted-foreground">{t("inventory.stock")}: {product.stock}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("sales.cart")}</h3>
                <span className="text-sm text-foreground/70 dark:text-foreground/80">{cartItems.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-20">{t("sales.qty")}</TableHead>
                    <TableHead>{t("sales.product")}</TableHead>
                    <TableHead className="text-right">{t("sales.price")}</TableHead>
                    <TableHead className="text-right">{t("sales.subtotal")}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {cartItems.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-foreground/70 dark:text-foreground/80">{t("sales.barcodeOrSearch")}</TableCell></TableRow>
                    ) : cartItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(item.price * item.quantity)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-foreground/70 dark:text-foreground/80">{t("sales.subtotal")}</span><span className="font-medium text-foreground dark:text-foreground">{formatNumber(subtotal)}</span></div>
                  <div className="space-y-2">
                    <Label className="text-foreground/70 dark:text-foreground/80">{t("sales.discount")}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1"><Input value={discountAmount} onChange={e => { setDiscountAmount(e.target.value); setDiscountPercent("0"); }} className="pr-12" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Tsh</span></div>
                      <span className="flex items-center text-foreground/70 dark:text-foreground/80">{t("common.or")}</span>
                      <div className="relative flex-1"><Input value={discountPercent} onChange={e => { setDiscountPercent(e.target.value); setDiscountAmount("0"); }} className="pr-8" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <span className="text-lg text-foreground/70 dark:text-foreground/80">{t("sales.total")}</span>
                  <span className="text-3xl font-bold">{formatNumber(total)}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="space-y-2"><Label className="text-foreground/70 dark:text-foreground/80">{t("sales.cash")}</Label><Input value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder={formatNumber(total)} /></div>
                <div className="space-y-2"><Label className="text-foreground/70 dark:text-foreground/80">{t("sales.mpesa")}</Label><Input value={mpesaAmount} onChange={e => setMpesaAmount(e.target.value)} placeholder={t("sales.enterAmount")} /></div>
                <div className="space-y-2"><Label className="text-foreground/70 dark:text-foreground/80">{t("sales.mpesaCode")}</Label><Input value={mpesaCode} onChange={e => setMpesaCode(e.target.value)} placeholder={t("sales.transactionCode")} /></div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button 
                  className="flex-1 gap-2 md:flex-none md:px-8 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                  onClick={handleCompleteSale} 
                  disabled={cartItems.length === 0 || createSale.isPending}
                >
                  {createSale.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {t("sales.completeSale")}
                </Button>
                <Button variant="outline" className="flex-1 gap-2 md:flex-none md:px-8" onClick={async () => {
                  if (cartItems.length === 0) { toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty"); return; }
                  await saveDraft.mutateAsync({
                    customer_id: selectedCustomer === "walk-in" ? null : selectedCustomer,
                    customer_name: customerName.trim() || null,
                    payment_method: "Cash",
                    discount_amount: discount,
                    discount_percent: parseInt(discountPercent) || 0,
                    items: cartItems.map(item => ({ product_id: item.product_id, product_name: item.name, unit_price: item.price, quantity: item.quantity })),
                  });
                  setCartItems([]);
                  setCustomerName("");
                }} disabled={cartItems.length === 0 || saveDraft.isPending}>
                  {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("sales.saveAsDraft")}
                </Button>
                <Button variant="outline" className="flex-1 gap-2 md:flex-none md:px-8" onClick={() => lastSale && setShowReceipt(true)} disabled={!lastSale}>
                  <Printer className="h-4 w-4" />{t("sales.printReceipt")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div>
                <Label className="text-foreground/70 dark:text-foreground/80">{t("sales.invoice")}</Label>
                <p className="text-xl md:text-2xl font-bold text-foreground dark:text-foreground">{`INV-${format(new Date(), "yyyyMMdd")}`}</p>
                <p className="text-sm text-foreground/70 dark:text-foreground/80">{t("sales.autoGenerated")}</p>
              </div>
              <div>
                <Label className="text-foreground/70 dark:text-foreground/80">{t("sales.dateTime")}</Label>
                <p className="font-medium">{format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {showReceipt && lastSale && <Receipt data={lastSale} onClose={() => setShowReceipt(false)} />}
      </motion.div>
  );
}
