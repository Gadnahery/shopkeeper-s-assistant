import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DollarSign,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Calendar,
  FileText,
  Loader2,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers, useCreateSupplier, type Supplier } from "@/hooks/useSuppliers";
import { usePurchases, useCreatePurchase, type PurchaseOrder, type PurchaseItem } from "@/hooks/usePurchases";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

interface FormItem {
  productId: string;
  quantity: string;
  buyingPrice: string;
}

export default function Purchases() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(searchParams.get("new") === "true");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });

  // New Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("none");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [itemsList, setItemsList] = useState<FormItem[]>([
    { productId: "", quantity: "1", buyingPrice: "" },
  ]);

  // Data Hooks
  const { data: purchases, isLoading: purchasesLoading } = usePurchases();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const createPurchase = useCreatePurchase();
  const createSupplier = useCreateSupplier();

  // Listen to header action
  useEffect(() => {
    const handleOpen = () => {
      setIsCreatingPurchase(true);
      setSelectedOrder(null);
    };
    window.addEventListener("open-new-purchase", handleOpen);
    return () => window.removeEventListener("open-new-purchase", handleOpen);
  }, []);

  // Sync URL query
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreatingPurchase(true);
      setSelectedOrder(null);
    }
  }, [searchParams]);

  // Auto-select first order if none selected and not creating
  useEffect(() => {
    if (purchases && purchases.length > 0 && !selectedOrder && !isCreatingPurchase) {
      setSelectedOrder(purchases[0]);
    }
  }, [purchases]);

  // Handle product selection in purchase item row
  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p) => p.id === productId);
    const updated = [...itemsList];
    updated[index].productId = productId;
    if (product && !updated[index].buyingPrice) {
      updated[index].buyingPrice = String(product.buying_price || "");
    }
    setItemsList(updated);
  };

  const handleQuantityChange = (index: number, val: string) => {
    const updated = [...itemsList];
    updated[index].quantity = val;
    setItemsList(updated);
  };

  const handlePriceChange = (index: number, val: string) => {
    const updated = [...itemsList];
    updated[index].buyingPrice = val;
    setItemsList(updated);
  };

  const addItemRow = () => {
    setItemsList([...itemsList, { productId: "", quantity: "1", buyingPrice: "" }]);
  };

  const removeItemRow = (index: number) => {
    if (itemsList.length <= 1) return;
    setItemsList(itemsList.filter((_, i) => i !== index));
  };

  const totalPurchaseCost = useMemo(() => {
    return itemsList.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.buyingPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [itemsList]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const list = purchases || [];
    const totalAmount = list.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const supplierCount = suppliers?.length || 0;
    const totalOrders = list.length;
    const avgOrder = totalOrders > 0 ? Math.round(totalAmount / totalOrders) : 0;

    return {
      totalAmount,
      totalOrders,
      supplierCount,
      avgOrder,
    };
  }, [purchases, suppliers]);

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    if (!searchTerm.trim()) return purchases;
    const q = searchTerm.toLowerCase();
    return purchases.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.items.some((it) => it.product_name?.toLowerCase().includes(q)),
    );
  }, [purchases, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(q)),
    );
  }, [suppliers, supplierSearch]);

  const handleSavePurchase = async () => {
    const validItems = itemsList.filter((it) => it.productId && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      toast.error(language === "sw" ? "Tafadhali chagua angalau bidhaa moja" : "Please select at least one valid product item");
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplierId: selectedSupplierId === "none" ? null : selectedSupplierId,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          buyingPrice: Number(it.buyingPrice) || 0,
        })),
        notes: purchaseNotes.trim() || undefined,
      });

      toast.success(language === "sw" ? "Stoki imepokelewa na kuongezwa stoo!" : "Stock received and saved successfully!");
      setIsCreatingPurchase(false);
      setItemsList([{ productId: "", quantity: "1", buyingPrice: "" }]);
      setPurchaseNotes("");
      setSelectedSupplierId("none");
      if (searchParams.get("new")) {
        setSearchParams({});
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save purchase");
    }
  };

  const handleSaveSupplier = async () => {
    if (!newSupplier.name.trim()) return;
    try {
      await createSupplier.mutateAsync(newSupplier);
      toast.success(language === "sw" ? "Msambazaji ameongezwa" : "Supplier added");
      setIsAddingSupplier(false);
      setNewSupplier({ name: "", contact_person: "", phone: "", email: "", address: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create supplier");
    }
  };

  if (purchasesLoading || productsLoading || suppliersLoading) {
    return <PageLoader message="Loading purchases..." messageSw="Inapakia manunuzi..." language={language} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("purchases.totalPurchases")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <ShoppingCart className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(kpiStats.totalAmount)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{kpiStats.totalOrders} {language === "sw" ? "maagizo yaliyorekodiwa" : "total orders"}</p>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Idadi ya Manunuzi" : "Total Orders"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Package className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatNumber(kpiStats.totalOrders)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Stoki zilizopokelewa" : "Stock receipts"}</p>
          </div>
        </Card>

        {/* KPI 3 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("purchases.activeSuppliers")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Truck className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{kpiStats.supplierCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Wasambazaji waliosajiliwa" : "Registered suppliers"}</p>
          </div>
        </Card>

        {/* KPI 4 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Wastani wa Agizo" : "Avg. Order Value"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(kpiStats.avgOrder)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Kwa kila ununuzi" : "Per purchase order"}</p>
          </div>
        </Card>
      </div>

      {/* 2-Column Master-Detail Layout (NO POPUPS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master Table - 7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="border border-border bg-card shadow-xs">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="bg-muted p-1 rounded-xl">
                  <TabsTrigger value="orders" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                    {t("purchases.tabOrders")} ({purchases?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="suppliers" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                    {t("purchases.tabSuppliers")} ({suppliers?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  {activeTab === "orders" ? (
                    <>
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={language === "sw" ? "Tafuta..." : "Search..."}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setIsCreatingPurchase(true);
                          setSelectedOrder(null);
                        }}
                        className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        <Plus className="h-3.5 w-3.5 text-accent" />
                        <span>{t("purchases.newPurchase")}</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={language === "sw" ? "Tafuta..." : "Search..."}
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setIsAddingSupplier(true);
                          setSelectedSupplier(null);
                        }}
                        className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        <Plus className="h-3.5 w-3.5 text-accent" />
                        <span>{language === "sw" ? "+ Msambazaji" : "+ Supplier"}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* TAB 1: Purchase Orders Table */}
              <TabsContent value="orders" className="m-0 p-0">
                {filteredPurchases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">{t("purchases.noPurchases")}</p>
                    <Button
                      onClick={() => {
                        setIsCreatingPurchase(true);
                        setSelectedOrder(null);
                      }}
                      className="mt-3 h-8 gap-1.5 rounded-xl bg-primary text-xs text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5 text-accent" />
                      <span>{t("purchases.newPurchase")}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("purchases.date")}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("purchases.supplier")}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("purchases.items")}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("purchases.totalCost")}</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPurchases.map((order) => {
                          const isSelected = selectedOrder?.id === order.id && !isCreatingPurchase;
                          const itemsSummary = order.items.map((it) => `${it.product_name} (x${it.quantity})`).join(", ");

                          return (
                            <TableRow
                              key={order.id}
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsCreatingPurchase(false);
                              }}
                              className={cn(
                                "cursor-pointer border-b border-border/60 transition-colors",
                                isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                              )}
                            >
                              <TableCell className="text-xs font-medium text-foreground">
                                {format(new Date(order.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-foreground">
                                {order.supplier_name || (language === "sw" ? "Moja kwa moja" : "Walk-in")}
                              </TableCell>
                              <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground" title={itemsSummary}>
                                {itemsSummary || `${order.items_count} items`}
                              </TableCell>
                              <TableCell className="text-xs font-bold text-foreground">
                                {formatMoney(order.total_amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected ? "text-accent translate-x-1" : "text-muted-foreground")} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: Suppliers Table */}
              <TabsContent value="suppliers" className="m-0 p-0">
                {filteredSuppliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {language === "sw" ? "Hakuna wasambazaji waliopatikana" : "No suppliers found"}
                    </p>
                    <Button
                      onClick={() => {
                        setIsAddingSupplier(true);
                        setSelectedSupplier(null);
                      }}
                      className="mt-3 h-8 rounded-xl text-xs bg-primary text-primary-foreground"
                    >
                      {language === "sw" ? "+ Ongeza Msambazaji" : "+ Add Supplier"}
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Msambazaji" : "Supplier"}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Simu" : "Phone"}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Deni" : "Balance"}</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((s) => {
                          const isSelected = selectedSupplier?.id === s.id && !isAddingSupplier;
                          return (
                            <TableRow
                              key={s.id}
                              onClick={() => {
                                setSelectedSupplier(s);
                                setIsAddingSupplier(false);
                              }}
                              className={cn(
                                "cursor-pointer border-b border-border/60 transition-colors",
                                isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                              )}
                            >
                              <TableCell className="text-xs font-semibold text-foreground">
                                {s.name}
                              </TableCell>
                              <TableCell className="text-xs text-foreground">
                                {s.phone || "-"}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-foreground">
                                {Number(s.pending_payment) > 0 ? (
                                  <span className="inline-flex rounded-full bg-[var(--warning-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--warning-text)]">
                                    {formatMoney(s.pending_payment)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">{formatMoney(0)}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected ? "text-accent translate-x-1" : "text-muted-foreground")} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column (Inline Detail / Create Panel - 5 Cols, NO POPUPS) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Case 1: Inline "New Purchase" Create Panel */}
          {isCreatingPurchase && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-accent" />
                  <span>{t("purchases.newPurchase")}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreatingPurchase(false)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Supplier Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">{t("purchases.supplier")}</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("suppliers");
                        setIsAddingSupplier(true);
                      }}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      {language === "sw" ? "+ Msambazaji Mpya" : "+ Add New"}
                    </button>
                  </div>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                      <SelectValue placeholder={t("purchases.selectSupplier")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover text-xs">
                      <SelectItem value="none">{t("purchases.noSupplier")}</SelectItem>
                      {(suppliers || []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.phone ? `(${s.phone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products Repeater */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold text-foreground">{t("purchases.items")}</Label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {itemsList.map((item, index) => {
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.buyingPrice) || 0);
                      return (
                        <div key={index} className="rounded-xl border border-border bg-muted/20 p-2.5 space-y-2">
                          <Select
                            value={item.productId}
                            onValueChange={(val) => handleProductChange(index, val)}
                          >
                            <SelectTrigger className="h-8 rounded-lg border-border bg-background text-xs">
                              <SelectValue placeholder={t("purchases.selectProduct")} />
                            </SelectTrigger>
                            <SelectContent className="max-h-52 rounded-xl border-border bg-popover text-xs">
                              {(products || []).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({p.code}) — Stk: {p.stock}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1">
                              <Input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="h-8 w-16 rounded-lg border-border bg-background text-xs text-center font-semibold"
                              />
                              <Input
                                type="number"
                                placeholder="Price"
                                value={item.buyingPrice}
                                onChange={(e) => handlePriceChange(index, e.target.value)}
                                className="h-8 flex-1 rounded-lg border-border bg-background text-xs"
                              />
                            </div>

                            <span className="text-xs font-bold text-foreground min-w-[70px] text-right">
                              {formatMoney(lineTotal)}
                            </span>

                            {itemsList.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItemRow(index)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItemRow}
                    className="h-8 w-full gap-1.5 rounded-xl border-dashed border-border text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent" />
                    <span>{t("purchases.addItem")}</span>
                  </Button>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">{t("purchases.notes")}</Label>
                  <Input
                    placeholder="Invoice # or delivery note..."
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>

                {/* Total Cost */}
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <span className="text-xs font-semibold text-foreground">{t("purchases.totalCost")}</span>
                  <span className="text-base font-bold text-foreground">{formatMoney(totalPurchaseCost)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatingPurchase(false)}
                    className="h-9 rounded-xl text-xs flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSavePurchase}
                    disabled={createPurchase.isPending || totalPurchaseCost <= 0}
                    className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2] shadow-xs hover:bg-primary/90"
                  >
                    {createPurchase.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                    <span>{t("purchases.completePurchase")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 2: Inline Selected Purchase Order Details */}
          {!isCreatingPurchase && activeTab === "orders" && selectedOrder && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <span>{language === "sw" ? "Maelezo ya Agizo" : "Order Summary"}</span>
                </CardTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--success-text)]">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("purchases.received")}
                </span>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t("purchases.supplier")}:</span>
                    <p className="font-semibold text-foreground">{selectedOrder.supplier_name || "Direct / Walk-in"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("purchases.date")}:</span>
                    <p className="font-semibold text-foreground">{format(new Date(selectedOrder.created_at), "PPpp")}</p>
                  </div>
                  {selectedOrder.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t("purchases.notes")}:</span>
                      <p className="text-foreground">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">{t("purchases.items")} ({selectedOrder.items.length})</span>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead>{t("sales.product")}</TableHead>
                          <TableHead className="text-center">{t("purchases.quantity")}</TableHead>
                          <TableHead className="text-right">{t("sales.total")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((it, idx) => (
                          <TableRow key={idx} className="text-xs">
                            <TableCell className="font-medium text-foreground">{it.product_name}</TableCell>
                            <TableCell className="text-center">{it.quantity}</TableCell>
                            <TableCell className="text-right font-bold text-foreground">
                              {formatMoney((it.quantity || 0) * (it.buying_price || 0))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-semibold text-foreground">{t("purchases.totalCost")}</span>
                  <span className="text-lg font-bold text-foreground">{formatMoney(selectedOrder.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 3: Inline Add Supplier Panel */}
          {isAddingSupplier && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-accent" />
                  <span>{language === "sw" ? "Ongeza Msambazaji" : "Add Supplier"}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddingSupplier(false)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Kampuni *" : "Company Name *"}</Label>
                  <Input
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="e.g. Simba Cement Co."
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{language === "sw" ? "Mawasiliano" : "Contact"}</Label>
                    <Input
                      value={newSupplier.contact_person}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                      placeholder="e.g. John"
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">{language === "sw" ? "Simu" : "Phone"}</Label>
                    <Input
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder="0712345678"
                      className="h-9 rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{language === "sw" ? "Mahali / Anwani" : "Location"}</Label>
                  <Input
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    placeholder="Kariakoo, DSM"
                    className="h-9 rounded-xl border-border bg-background text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAddingSupplier(false)} className="h-9 rounded-xl text-xs flex-1">
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleSaveSupplier}
                    disabled={createSupplier.isPending || !newSupplier.name.trim()}
                    className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2]"
                  >
                    {createSupplier.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    <span>{language === "sw" ? "Hifadhi Msambazaji" : "Save Supplier"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 4: Inline Selected Supplier Details */}
          {!isAddingSupplier && activeTab === "suppliers" && selectedSupplier && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-accent" />
                  <span>{selectedSupplier.name}</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingPurchase(true);
                    setSelectedSupplierId(selectedSupplier.id);
                    setActiveTab("orders");
                  }}
                  className="h-7 text-xs rounded-lg gap-1"
                >
                  <Plus className="h-3 w-3 text-accent" />
                  <span>{language === "sw" ? "Agiza Stoki" : "Order Stock"}</span>
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3">
                  <div>
                    <span className="text-muted-foreground">{language === "sw" ? "Mtu wa Mawasiliano" : "Contact Person"}:</span>
                    <p className="font-semibold text-foreground">{selectedSupplier.contact_person || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{language === "sw" ? "Nambari ya Simu" : "Phone"}:</span>
                    <p className="font-semibold text-foreground">{selectedSupplier.phone || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{language === "sw" ? "Mahali / Anwani" : "Address"}:</span>
                    <p className="font-semibold text-foreground">{selectedSupplier.address || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                  <span className="font-semibold text-foreground">{language === "sw" ? "Deni Linalosubiri" : "Pending Balance"}</span>
                  <span className="font-bold text-foreground">{formatMoney(selectedSupplier.pending_payment || 0)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
