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
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import {
  usePurchases,
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase,
  type PurchaseOrder,
  type PurchaseItem,
} from "@/hooks/usePurchases";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
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
  const { isMobile } = useAdaptiveLayout();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mobileOrderPage, setMobileOrderPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(searchParams.get("new") === "true");
  const [isEditingPurchase, setIsEditingPurchase] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });

  // New / Edit Purchase Form
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("none");
  const [purchaseStatus, setPurchaseStatus] = useState<"received" | "pending" | "cancelled">("received");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [itemsList, setItemsList] = useState<FormItem[]>([
    { productId: "", quantity: "1", buyingPrice: "" },
  ]);

  // Data Hooks
  const { data: purchases, isLoading: purchasesLoading } = usePurchases();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const deletePurchase = useDeletePurchase();
  const createSupplier = useCreateSupplier();

  // Listen to header action
  useEffect(() => {
    const handleOpen = () => {
      setIsCreatingPurchase(true);
      setIsEditingPurchase(false);
      setIsConfirmingDelete(false);
      setSelectedOrder(null);
      resetPurchaseForm();
      if (isMobile) setMobileDrawerOpen(true);
    };
    window.addEventListener("open-new-purchase", handleOpen);
    return () => window.removeEventListener("open-new-purchase", handleOpen);
  }, [isMobile]);

  // Sync URL query
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreatingPurchase(true);
      setIsEditingPurchase(false);
      setIsConfirmingDelete(false);
      setSelectedOrder(null);
      resetPurchaseForm();
      if (isMobile) setMobileDrawerOpen(true);
    }
  }, [searchParams, isMobile]);

  // Auto-select first order if none selected and not creating
  useEffect(() => {
    if (!selectedOrder && purchases && purchases.length > 0 && !isCreatingPurchase) {
      setSelectedOrder(purchases[0]);
    }
  }, [purchases, selectedOrder, isCreatingPurchase]);

  // Reset Purchase form
  const resetPurchaseForm = () => {
    setSelectedSupplierId("none");
    setPurchaseStatus("received");
    setPurchaseNotes("");
    setItemsList([{ productId: "", quantity: "1", buyingPrice: "" }]);
  };

  // Populate form for editing
  const startEditPurchase = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsEditingPurchase(true);
    setIsCreatingPurchase(false);
    setIsConfirmingDelete(false);
    setSelectedSupplierId(order.supplier_id || "none");
    setPurchaseStatus(order.status);
    setPurchaseNotes(order.notes || "");
    setItemsList(
      order.items.map((it) => ({
        productId: it.product_id,
        quantity: String(it.quantity),
        buyingPrice: String(it.buying_price),
      })),
    );
  };

  // KPI Calculations
  const totalPurchasesAmount = useMemo(() => {
    return (purchases || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
  }, [purchases]);

  const totalPaidAmount = useMemo(() => {
    return (purchases || []).reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  }, [purchases]);

  const totalOutstanding = useMemo(() => {
    return (purchases || []).reduce((sum, p) => sum + (p.outstanding || 0), 0);
  }, [purchases]);

  const totalReceivedItems = useMemo(() => {
    return (purchases || []).reduce((sum, p) => sum + (p.items_count || 1), 0);
  }, [purchases]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter((p) => {
      const matchSearch =
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  const MOBILE_PURCHASE_PAGE_SIZE = 4;
  const totalMobileOrderPages = Math.ceil(filteredOrders.length / MOBILE_PURCHASE_PAGE_SIZE) || 1;
  const currentMobileOrders = useMemo(() => {
    const start = (mobileOrderPage - 1) * MOBILE_PURCHASE_PAGE_SIZE;
    return filteredOrders.slice(start, start + MOBILE_PURCHASE_PAGE_SIZE);
  }, [filteredOrders, mobileOrderPage]);

  useEffect(() => {
    setMobileOrderPage(1);
  }, [searchTerm, statusFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (s.phone && s.phone.toLowerCase().includes(supplierSearch.toLowerCase())) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(supplierSearch.toLowerCase())),
    );
  }, [suppliers, supplierSearch]);

  // Form helpers
  const handleProductChange = (index: number, productId: string) => {
    const prod = products?.find((p) => p.id === productId);
    const updated = [...itemsList];
    updated[index].productId = productId;
    if (prod && prod.buying_price) {
      updated[index].buyingPrice = String(prod.buying_price);
    }
    setItemsList(updated);
  };

  const handleQuantityChange = (index: number, quantity: string) => {
    const updated = [...itemsList];
    updated[index].quantity = quantity;
    setItemsList(updated);
  };

  const handlePriceChange = (index: number, buyingPrice: string) => {
    const updated = [...itemsList];
    updated[index].buyingPrice = buyingPrice;
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
    return itemsList.reduce((acc, curr) => {
      const q = Number(curr.quantity) || 0;
      const p = Number(curr.buyingPrice) || 0;
      return acc + q * p;
    }, 0);
  }, [itemsList]);

  // Save new purchase
  const handleSavePurchase = async () => {
    const validItems = itemsList.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      toast.error(language === "sw" ? "Tafadhali ongeza angalau bidhaa moja." : "Please add at least one valid item.");
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplierId: selectedSupplierId === "none" ? null : selectedSupplierId,
        status: purchaseStatus,
        notes: purchaseNotes.trim() || undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          buyingPrice: Number(i.buyingPrice) || 0,
        })),
      });

      toast.success(
        language === "sw"
          ? purchaseStatus === "received"
            ? "Mzigo umepokelewa na stoki kuongezwa!"
            : "Agizo la ununuzi limehifadhiwa kama linasubiri!"
          : purchaseStatus === "received"
          ? "Purchase received and inventory updated!"
          : "Purchase order saved as pending!",
      );

      setIsCreatingPurchase(false);
      resetPurchaseForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to record purchase order");
    }
  };

  // Update existing purchase
  const handleUpdatePurchase = async () => {
    if (!selectedOrder) return;
    const validItems = itemsList.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      toast.error(language === "sw" ? "Tafadhali ongeza angalau bidhaa moja." : "Please add at least one valid item.");
      return;
    }

    try {
      await updatePurchase.mutateAsync({
        purchaseId: selectedOrder.id,
        supplierId: selectedSupplierId === "none" ? null : selectedSupplierId,
        status: purchaseStatus,
        notes: purchaseNotes.trim() || undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          buyingPrice: Number(i.buyingPrice) || 0,
        })),
      });

      toast.success(language === "sw" ? "Agizo limesasishwa kikamilifu!" : "Purchase order updated successfully!");
      setIsEditingPurchase(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update purchase order");
    }
  };

  // Mark pending purchase as received
  const handleMarkAsReceived = async (order: PurchaseOrder) => {
    try {
      await updatePurchase.mutateAsync({
        purchaseId: order.id,
        status: "received",
      });
      toast.success(language === "sw" ? "Agizo limewekwa kama limepokelewa na stoki kusasishwa!" : "Purchase marked as received and stock updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as received");
    }
  };

  // Delete purchase
  const handleDeletePurchase = async () => {
    if (!selectedOrder) return;
    try {
      await deletePurchase.mutateAsync(selectedOrder.id);
      toast.success(language === "sw" ? "Agizo limefutwa na stoki kurekebishwa!" : "Purchase deleted and inventory reversed!");
      setIsConfirmingDelete(false);
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete purchase");
    }
  };

  // Save Supplier
  const handleSaveSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast.error(language === "sw" ? "Weka jina la msambazaji." : "Enter supplier name.");
      return;
    }

    try {
      await createSupplier.mutateAsync({
        name: newSupplier.name.trim(),
        contact_person: newSupplier.contact_person.trim() || null,
        phone: newSupplier.phone.trim() || null,
        email: newSupplier.email.trim() || null,
        address: newSupplier.address.trim() || null,
      } as any);

      toast.success(language === "sw" ? "Msambazaji ameongezwa kikamilifu!" : "Supplier added successfully!");
      setNewSupplier({ name: "", contact_person: "", phone: "", email: "", address: "" });
      setIsAddingSupplier(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add supplier");
    }
  };

  if (purchasesLoading || productsLoading || suppliersLoading) {
    return <PageLoader message="Loading purchases..." messageSw="Inapakia manunuzi..." language={language} />;
  }

  const getStatusBadge = (status: "received" | "pending" | "cancelled") => {
    switch (status) {
      case "received":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--success-text)]">
            <CheckCircle2 className="h-3 w-3" />
            {language === "sw" ? "Imepokelewa" : "Received"}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--warning-text)]">
            <Clock className="h-3 w-3" />
            {language === "sw" ? "Inasubiri" : "Pending"}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--danger-text)]">
            <X className="h-3 w-3" />
            {language === "sw" ? "Imeghairiwa" : "Cancelled"}
          </span>
        );
    }
  };

  const renderRightPanel = () => (
    <>

          {/* Case 1: Inline "New Purchase" or "Edit Purchase" Form */}
          {(isCreatingPurchase || isEditingPurchase) && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-accent" />
                  <span>{isEditingPurchase ? (language === "sw" ? "Hariri Agizo la Ununuzi" : "Edit Purchase Order") : t("purchases.newPurchase")}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsCreatingPurchase(false);
                    setIsEditingPurchase(false);
                  }}
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
                        setIsCreatingPurchase(false);
                        setIsEditingPurchase(false);
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

                {/* Status Picker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Hali ya Mzigo" : "Order Status"}</Label>
                  <Select value={purchaseStatus} onValueChange={(val: any) => setPurchaseStatus(val)}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover text-xs">
                      <SelectItem value="received">
                        {language === "sw" ? "✓ Imepokelewa (Ongeza stoki mara moja)" : "✓ Received (Add to stock immediately)"}
                      </SelectItem>
                      <SelectItem value="pending">
                        {language === "sw" ? "⏳ Inasubiri (Bado haijafika stoo)" : "⏳ Pending (Awaiting delivery)"}
                      </SelectItem>
                      <SelectItem value="cancelled">
                        {language === "sw" ? "✕ Imeghairiwa" : "✕ Cancelled"}
                      </SelectItem>
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
                              {(products || [])
                                .filter((p) => p.item_type !== "service" && p.track_inventory !== false)
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} — Stk: {p.stock}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1">
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="h-8 w-16 rounded-lg border-border bg-background text-xs text-center font-semibold"
                              />
                              <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="Price"
                                value={item.buyingPrice}
                                onChange={(e) => handlePriceChange(index, e.target.value)}
                                className="h-8 flex-1 rounded-lg border-border bg-background text-xs font-semibold"
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
                    onClick={() => {
                      setIsCreatingPurchase(false);
                      setIsEditingPurchase(false);
                    }}
                    className="h-9 rounded-xl text-xs flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    onClick={isEditingPurchase ? handleUpdatePurchase : handleSavePurchase}
                    disabled={createPurchase.isPending || updatePurchase.isPending || totalPurchaseCost <= 0}
                    className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2] shadow-xs hover:bg-primary/90"
                  >
                    {(createPurchase.isPending || updatePurchase.isPending) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    )}
                    <span>{isEditingPurchase ? (language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes") : t("purchases.completePurchase")}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 2: Inline Selected Purchase Order Details */}
          {!isCreatingPurchase && !isEditingPurchase && activeTab === "orders" && selectedOrder && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <span>PO-{selectedOrder.id.slice(0, 6).toUpperCase()}</span>
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">{selectedOrder.supplier_name || "Direct / Walk-in"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedOrder(null);
                      setIsConfirmingDelete(false);
                    }}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    title={language === "sw" ? "Funga jopo" : "Close panel"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Inline Delete Confirmation Banner */}
                {isConfirmingDelete ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{language === "sw" ? "Thibitisha kufuta ununuzi huu?" : "Confirm deleting this purchase?"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedOrder.status === "received"
                        ? language === "sw"
                          ? "Kufuta agizo hili kutapunguza stoki zilizoongezwa moja kwa moja kwenye bidhaa."
                          : "Deleting this order will automatically reverse and deduct added inventory quantities."
                        : language === "sw"
                        ? "Agizo hili linaondolewa kwenye rekodi."
                        : "This order will be removed from your records."}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="h-8 rounded-xl text-xs flex-1"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDeletePurchase}
                        disabled={deletePurchase.isPending}
                        className="h-8 rounded-xl bg-destructive text-xs font-bold text-destructive-foreground hover:bg-destructive/90 flex-1"
                      >
                        {deletePurchase.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>{language === "sw" ? "Futa Kabisa" : "Confirm Delete"}</span>
                      </Button>
                    </div>
                  </div>
                ) : null}

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
                            <TableCell className="text-center font-semibold">{it.quantity}</TableCell>
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

                {/* Actions Row */}
                {!isConfirmingDelete && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    {selectedOrder.status === "pending" && (
                      <Button
                        onClick={() => handleMarkAsReceived(selectedOrder)}
                        disabled={updatePurchase.isPending}
                        className="h-9 w-full gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{language === "sw" ? "Weka Kama Imepokelewa (Ongeza Stoki)" : "Mark as Received (Add to Stock)"}</span>
                      </Button>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => startEditPurchase(selectedOrder)}
                        className="h-8 gap-1 rounded-xl text-xs flex-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>{language === "sw" ? "Hariri Agizo" : "Edit Order"}</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="h-8 gap-1 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive flex-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{language === "sw" ? "Futa Agizo" : "Delete Order"}</span>
                      </Button>
                    </div>
                  </div>
                )}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreatingPurchase(true);
                      setIsEditingPurchase(false);
                      setSelectedSupplierId(selectedSupplier.id);
                      setActiveTab("orders");
                    }}
                    className="h-7 text-xs rounded-lg gap-1"
                  >
                    <Plus className="h-3 w-3 text-accent" />
                    <span>{language === "sw" ? "Agiza Stoki" : "Order Stock"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedSupplier(null)}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    title={language === "sw" ? "Funga jopo" : "Close panel"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                  <span className="font-bold text-foreground">{formatMoney((selectedSupplier as any).pending_payment || 0)}</span>
                </div>
              </CardContent>
            </Card>
          )}
    </>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Jumla ya Manunuzi" : "Total Purchases"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 flex-shrink-0">
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalPurchasesAmount)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{purchases?.length || 0} {language === "sw" ? "maagizo yote" : "total orders"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zilizolipwa" : "Total Paid"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalPaidAmount)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-emerald-600 font-medium truncate">{language === "sw" ? "Zilizokamilika" : "Settled"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Madeni ya Wasambazaji" : "Outstanding / Due"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 flex-shrink-0">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalOutstanding)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-amber-600 font-medium truncate">{language === "sw" ? "Inayosubiri kulipwa" : "Pending balance"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Bidhaa Zilizopokelewa" : "Total Received"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 flex-shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{totalReceivedItems}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{suppliers?.length || 0} {language === "sw" ? "wasambazaji hai" : "active suppliers"}</p>
          </div>
        </Card>
      </div>

      {/* Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master List - expands to 12 cols when unselected) */}
        <div className={cn("space-y-4 transition-all duration-200", (isCreatingPurchase || isEditingPurchase || selectedOrder || isAddingSupplier || selectedSupplier) ? "lg:col-span-7" : "lg:col-span-12")}>
          <Card className="border border-border bg-card shadow-xs">
            <Tabs value={activeTab} onValueChange={(val) => {
              setActiveTab(val);
              setIsCreatingPurchase(false);
              setIsEditingPurchase(false);
              setIsConfirmingDelete(false);
            }}>
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
                <TabsList className="h-9 rounded-xl bg-muted/60 p-1">
                  <TabsTrigger value="orders" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                    <span>{language === "sw" ? "Maagizo ya Manunuzi" : "Purchase Orders"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="suppliers" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground">
                    <Truck className="h-3.5 w-3.5 mr-1.5" />
                    <span>{language === "sw" ? "Wasambazaji" : "Suppliers"}</span>
                  </TabsTrigger>
                </TabsList>

                {activeTab === "orders" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={language === "sw" ? "Tafuta ununuzi..." : "Search purchases..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-xl border-border bg-background"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsCreatingPurchase(true);
                        setIsEditingPurchase(false);
                        setIsConfirmingDelete(false);
                        setSelectedOrder(null);
                        resetPurchaseForm();
                        if (isMobile) setMobileDrawerOpen(true);
                      }}
                      className="h-8 gap-1 rounded-xl bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950 shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200"
                    >
                      <Plus className="h-3.5 w-3.5 text-white dark:text-neutral-950" />
                      <span>{t("purchases.newPurchase")}</span>
                    </Button>
                  </div>
                )}

                {activeTab === "suppliers" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={language === "sw" ? "Tafuta msambazaji..." : "Search suppliers..."}
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-xl border-border bg-background"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsAddingSupplier(true);
                        setSelectedSupplier(null);
                        if (isMobile) setMobileDrawerOpen(true);
                      }}
                      className="h-8 gap-1 rounded-xl bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950 shadow-xs hover:bg-neutral-800 dark:hover:bg-neutral-200"
                    >
                      <Plus className="h-3.5 w-3.5 text-white dark:text-neutral-950" />
                      <span>{language === "sw" ? "Msambazaji Mpya" : "New Supplier"}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* TAB 1: PURCHASE ORDERS */}
              <TabsContent value="orders" className="m-0 p-0">
                {/* Mobile View: 4 Compact Cards with Prev/Next Pagination */}
                <div className="md:hidden">
                  <div className="divide-y divide-border/60">
                    {currentMobileOrders.length > 0 ? (
                      currentMobileOrders.map((order) => {
                        const isSelected = selectedOrder?.id === order.id && !isCreatingPurchase && !isEditingPurchase;
                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsCreatingPurchase(false);
                              setIsEditingPurchase(false);
                              setIsConfirmingDelete(false);
                              if (isMobile) setMobileDrawerOpen(true);
                            }}
                            className={cn(
                              "p-3.5 flex items-center justify-between cursor-pointer active:bg-muted/60 transition-colors",
                              isSelected ? "bg-accent/10" : ""
                            )}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground">PO-{order.id.slice(0, 6).toUpperCase()}</span>
                                {getStatusBadge(order.status)}
                              </div>
                              <p className="text-[11px] font-medium text-foreground/90 mt-0.5 truncate">
                                {order.supplier_name || <span className="text-muted-foreground italic">Direct / Walk-in</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {format(new Date(order.created_at), "dd MMM yyyy")} • {order.items_count} {language === "sw" ? "bidhaa" : "items"}
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <span className="font-bold text-xs text-foreground">{formatMoney(order.total_amount)}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        {language === "sw" ? "Hakuna manunuzi yaliyopatikana." : "No purchase orders found."}
                      </div>
                    )}
                  </div>

                  {totalMobileOrderPages > 1 && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileOrderPage <= 1}
                        onClick={() => setMobileOrderPage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {language === "sw" ? "Iliyopita" : "Previous"}
                      </Button>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {mobileOrderPage} / {totalMobileOrderPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileOrderPage >= totalMobileOrderPages}
                        onClick={() => setMobileOrderPage((p) => Math.min(totalMobileOrderPages, p + 1))}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        {language === "sw" ? "Inayofuata" : "Next"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop View: Full Master Table */}
                <div className="hidden md:block internal-table-scroll w-full">
                  <Table className="min-w-[650px] w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-[11px] uppercase">
                        <TableHead className="font-semibold">{language === "sw" ? "Namba / Tarehe" : "PO / Date"}</TableHead>
                        <TableHead className="font-semibold">{t("purchases.supplier")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("purchases.items")}</TableHead>
                        <TableHead className="text-right font-semibold">{t("purchases.totalCost")}</TableHead>
                        <TableHead className="text-center font-semibold">{language === "sw" ? "Hali" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => {
                          const isSelected = selectedOrder?.id === order.id && !isCreatingPurchase && !isEditingPurchase;
                          return (
                            <TableRow
                              key={order.id}
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsCreatingPurchase(false);
                                setIsEditingPurchase(false);
                                setIsConfirmingDelete(false);
                              }}
                              className={cn(
                                "cursor-pointer transition-colors text-xs",
                                isSelected ? "bg-muted/80 font-medium" : "hover:bg-muted/40",
                              )}
                            >
                              <TableCell>
                                <p className="font-bold text-foreground">PO-{order.id.slice(0, 6).toUpperCase()}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy")}</p>
                              </TableCell>
                              <TableCell className="font-semibold text-foreground">
                                {order.supplier_name || <span className="text-muted-foreground italic">Direct / Walk-in</span>}
                              </TableCell>
                              <TableCell className="text-center font-semibold">{order.items_count}</TableCell>
                              <TableCell className="text-right font-bold text-foreground">
                                {formatMoney(order.total_amount)}
                              </TableCell>
                              <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                            {language === "sw" ? "Hakuna manunuzi yaliyopatikana." : "No purchase orders found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* TAB 2: SUPPLIERS */}
              <TabsContent value="suppliers" className="m-0 p-0">
                <div className="internal-table-scroll w-full">
                  <Table className="min-w-[650px] w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-[11px] uppercase">
                        <TableHead className="font-semibold">{t("purchases.supplier")}</TableHead>
                        <TableHead className="font-semibold">{language === "sw" ? "Mawasiliano" : "Contact"}</TableHead>
                        <TableHead className="font-semibold">{language === "sw" ? "Simu" : "Phone"}</TableHead>
                        <TableHead className="text-right font-semibold">{language === "sw" ? "Deni" : "Pending Balance"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((sup) => {
                          const isSelected = selectedSupplier?.id === sup.id && !isAddingSupplier;
                          return (
                            <TableRow
                              key={sup.id}
                              onClick={() => {
                                setSelectedSupplier(sup);
                                setIsAddingSupplier(false);
                              }}
                              className={cn(
                                "cursor-pointer transition-colors text-xs",
                                isSelected ? "bg-muted/80 font-medium" : "hover:bg-muted/40",
                              )}
                            >
                              <TableCell className="font-bold text-foreground">{sup.name}</TableCell>
                              <TableCell className="text-muted-foreground">{sup.contact_person || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">{sup.phone || "-"}</TableCell>
                              <TableCell className="text-right font-bold text-foreground">
                                {formatMoney((sup as any).pending_payment || 0)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-12 text-center text-xs text-muted-foreground">
                            {language === "sw" ? "Hakuna wasambazaji waliopatikana." : "No suppliers found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column (Inline Detail / Create Panel - 5 Cols, NO POPUPS) */}
        <div className="hidden lg:block lg:col-span-5 space-y-4">
          {renderRightPanel()}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Purchases & Suppliers */}
      <Sheet open={Boolean(isMobile && mobileDrawerOpen)} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 border-t border-border bg-card lg:hidden">
          <div className="p-1 space-y-4">
            {renderRightPanel()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
