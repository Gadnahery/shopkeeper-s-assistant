import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Barcode, Search, CheckCircle, Printer, Save, Minus, Plus, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateSale } from "@/hooks/useSales";
import { useShopSettings } from "@/hooks/useShopSettings";
import { Receipt } from "@/components/Receipt";
import { format } from "date-fns";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
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
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const { data: shopSettings } = useShopSettings();
  const createSale = useCreateSale();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = parseInt(discountAmount) || Math.round(subtotal * (parseInt(discountPercent) || 0) / 100);
  const total = subtotal - discount;

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const addToCart = (product: NonNullable<typeof products>[0]) => {
    const existing = cartItems.find((item) => item.product_id === product.id);
    if (existing) {
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
        },
      ]);
    }
    setSearchTerm("");
  };

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
  ) || [];

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) return;

    const paymentMethod = parseFloat(mpesaAmount) > 0 ? "M-Pesa" : "Cash";
    const customerId = selectedCustomer === "walk-in" ? null : selectedCustomer;

    const sale = await createSale.mutateAsync({
      customer_id: customerId,
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

    const customerName = selectedCustomer === "walk-in" 
      ? t("sales.walkIn") 
      : customers?.find(c => c.id === selectedCustomer)?.name || t("sales.walkIn");

    setLastSale({
      invoiceNumber: sale.invoice_number,
      date: format(new Date(), "dd MMM yyyy, hh:mm a"),
      customerName,
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
      shopName: shopSettings?.shop_name || "Hardware Shop",
      shopPhone: shopSettings?.phone || undefined,
      shopAddress: shopSettings?.address || undefined,
    });

    setShowReceipt(true);
    
    // Clear cart
    setCartItems([]);
    setDiscountAmount("0");
    setDiscountPercent("0");
    setCashAmount("");
    setMpesaAmount("");
    setMpesaCode("");
  };

  const invoiceNumber = `INV-${format(new Date(), "yyyyMMdd")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Left Side - Main POS Area */}
      <div className="space-y-6 lg:col-span-3">
        {/* Customer & Phone Section */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("sales.customer")}</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("sales.selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">{t("sales.walkIn")}</SelectItem>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("sales.phone")}</Label>
                <Input 
                  placeholder={t("sales.enterPhone")} 
                  className="h-12"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search / Barcode Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex h-16 items-center gap-3 p-4">
              <Barcode className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("sales.scanBarcode")}</span>
            </CardContent>
          </Card>
          <Card className="relative">
            <CardContent className="flex h-16 items-center gap-3 p-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder={t("sales.searchProducts")} 
                className="border-0 bg-transparent p-0 focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
            {/* Search Results Dropdown */}
            {searchTerm && filteredProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-card shadow-lg">
                {filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted"
                    onClick={() => addToCart(product)}
                  >
                    <div>
                      <p className="font-medium">{language === "sw" && product.name_sw ? product.name_sw : product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
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

        {/* Cart */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("sales.cart")}</h3>
              <span className="text-sm text-muted-foreground">
                {t("sales.barcodeOrSearch")}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t("sales.qty")}</TableHead>
                  <TableHead>{t("sales.product")}</TableHead>
                  <TableHead className="text-right">{t("sales.price")}</TableHead>
                  <TableHead className="text-right">{t("sales.subtotal")}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t("sales.barcodeOrSearch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(item.price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(item.price * item.quantity)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Subtotal & Discount */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("sales.subtotal")}</span>
                  <span className="font-medium">{formatNumber(subtotal)}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("sales.discount")}</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={discountAmount}
                        onChange={(e) => {
                          setDiscountAmount(e.target.value);
                          setDiscountPercent("0");
                        }}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Tsh
                      </span>
                    </div>
                    <span className="flex items-center text-muted-foreground">{t("common.or")}</span>
                    <div className="relative flex-1">
                      <Input
                        value={discountPercent}
                        onChange={(e) => {
                          setDiscountPercent(e.target.value);
                          setDiscountAmount("0");
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center">
                <span className="text-lg text-muted-foreground">{t("sales.total")}</span>
                <span className="text-3xl font-bold">{formatNumber(total)}</span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("sales.cash")}</Label>
                <Input
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={formatNumber(total)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("sales.mpesa")}</Label>
                <Input
                  value={mpesaAmount}
                  onChange={(e) => setMpesaAmount(e.target.value)}
                  placeholder={t("sales.enterAmount")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("sales.mpesaCode")}</Label>
                <Input
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  placeholder={t("sales.transactionCode")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button 
                className="flex-1 gap-2 bg-secondary hover:bg-secondary/90 md:flex-none md:px-8"
                onClick={handleCompleteSale}
                disabled={cartItems.length === 0 || createSale.isPending}
              >
                {createSale.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {t("sales.completeSale")}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 md:flex-none md:px-8"
                onClick={() => lastSale && setShowReceipt(true)}
                disabled={!lastSale}
              >
                <Printer className="h-4 w-4" />
                {t("sales.printReceipt")}
              </Button>
              <Button variant="outline" className="flex-1 gap-2 md:flex-none md:px-8">
                <Save className="h-4 w-4" />
                {t("sales.saveAsDraft")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Invoice Info */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">{t("sales.invoice")}</Label>
                <p className="text-2xl font-bold">{invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{t("sales.autoGenerated")}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("sales.dateTime")}</Label>
                <p className="font-medium">{format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt data={lastSale} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}
