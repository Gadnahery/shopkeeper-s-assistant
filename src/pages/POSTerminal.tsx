import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, Minus, Plus, X, Camera, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCreateSale } from "@/hooks/useSales";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Receipt } from "@/components/Receipt";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function POSTerminal() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const { data: products } = useProducts();
  const { data: shopSettings } = useShopSettings();
  const { profile } = useAuth();
  const createSale = useCreateSale();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

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
      toast.error(language === "sw" ? "Bidhaa haina stoki" : "Out of stock");
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
    setShowScanner(false);
    const product = products?.find((p) => p.barcode === barcode || p.code === barcode);
    if (product) addToCart(product);
    else {
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

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const handleComplete = async () => {
    if (cartItems.length === 0) {
      toast.error(language === "sw" ? "Kikapu ni tupu" : "Cart is empty");
      return;
    }
    try {
      const sale = await createSale.mutateAsync({
        customer_id: null,
        payment_method: "Cash",
        items: cartItems.map((item) => ({ product_id: item.product_id, product_name: item.name, unit_price: item.price, quantity: item.quantity })),
      });
      setLastSale({
        invoiceNumber: sale.invoice_number,
        date: format(new Date(), "dd MMM yyyy, hh:mm a"),
        customerName: t("sales.walkIn"),
        cashier: profile?.full_name,
        items: cartItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, total: item.price * item.quantity })),
        subtotal,
        discount: 0,
        total,
        paymentMethod: "Cash",
        shopName: shopSettings?.shop_name || "",
        shopPhone: shopSettings?.phone,
        shopAddress: shopSettings?.address,
      });
      setShowReceipt(true);
      setCartItems([]);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold">{shopSettings?.shop_name || "POS"}</span>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="mb-4 flex gap-2">
            <Card
              className="flex-1 cursor-pointer border-2 border-primary/30 p-4"
              onClick={() => setShowScanner(true)}
            >
              <CardContent className="flex items-center gap-3 p-0">
                <Camera className="h-8 w-8 text-primary" />
                <span className="text-lg font-semibold text-primary">{t("sales.scanBarcode")}</span>
              </CardContent>
            </Card>
            <div className="flex flex-1 items-center rounded-lg border bg-muted/50 px-4">
              <Search className="h-6 w-6 text-muted-foreground" />
              <Input
                placeholder={t("sales.searchProducts")}
                className="border-0 bg-transparent text-lg focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-1 flex-wrap gap-2 overflow-y-auto">
            {searchTerm && filteredProducts.length > 0
              ? filteredProducts.slice(0, 20).map((product) => (
                  <Button
                    key={product.id}
                    size="lg"
                    variant="outline"
                    className="h-24 min-w-[140px] flex-col gap-1 text-base"
                    onClick={() => addToCart(product)}
                  >
                    <span className="line-clamp-2 text-center">{language === "sw" && product.name_sw ? product.name_sw : product.name}</span>
                    <span className="font-bold text-primary">{formatNumber(product.selling_price)}</span>
                  </Button>
                ))
              : products?.slice(0, 24).map((product) => (
                  <Button
                    key={product.id}
                    size="lg"
                    variant="outline"
                    className="h-24 min-w-[140px] flex-col gap-1 text-base"
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    <span className="line-clamp-2 text-center">{language === "sw" && product.name_sw ? product.name_sw : product.name}</span>
                    <span className="font-bold text-primary">{formatNumber(product.selling_price)}</span>
                  </Button>
                ))}
          </div>
        </div>

        <div className="flex w-full flex-col border-l bg-muted/30 md:w-[400px]">
          <div className="flex-1 overflow-auto p-4">
            <h3 className="mb-4 text-xl font-bold">{t("sales.cart")}</h3>
            {cartItems.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t("sales.barcodeOrSearch")}</p>
            ) : (
              <Table>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-lg font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 font-medium">{item.name}</TableCell>
                      <TableCell className="py-2 text-right text-lg font-bold">{formatNumber(item.price * item.quantity)}</TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => removeItem(item.id)}>
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
            <div className="mb-4 flex justify-between text-2xl font-bold">
              <span>{t("sales.total")}</span>
              <span>Tsh {formatNumber(total)}</span>
            </div>
            <Button
              size="lg"
              className="h-16 w-full text-xl"
              onClick={handleComplete}
              disabled={cartItems.length === 0 || createSale.isPending}
            >
              <CheckCircle className="mr-2 h-6 w-6" />
              {t("sales.completeSale")}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
      </AnimatePresence>
      {showReceipt && lastSale && <Receipt data={lastSale} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
