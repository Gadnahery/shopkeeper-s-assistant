import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Pencil, History, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import {
  useStockReceivedList,
  StockReceivedRecord,
} from "@/hooks/useStockReceived";
import { CorrectStockDialog } from "@/components/inventory/CorrectStockDialog";

export default function ReceiveStock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isOwner, role } = useAuth();
  const { formatMoney, formatDateTime } = useShopFormatting();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: receivedList, isLoading: receivedLoading } = useStockReceivedList();

  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("none");
  const [quantity, setQuantity] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Correction dialog state
  const [selectedRecord, setSelectedRecord] = useState<StockReceivedRecord | null>(null);
  const [correctDialogOpen, setCorrectDialogOpen] = useState(false);

  const canEdit = isOwner || role === "manager" || role === "owner";

  if (products === undefined || suppliers === undefined || productsLoading || suppliersLoading) {
    return <PageLoader message="Loading..." messageSw="Inapakia..." language={language} />;
  }

  const onSave = async () => {
    if (!productId || !quantity) return;
    const qty = Math.max(1, Number(quantity) || 0);
    setSaving(true);
    try {
      const { error } = await (supabase as any).rpc("receive_stock_transaction", {
        p_product_id: productId,
        p_supplier_id: supplierId === "none" ? null : supplierId,
        p_quantity: qty,
        p_buying_price: buyingPrice ? Number(buyingPrice) : null,
        p_notes: notes || null,
      });

      if (error) throw error;

      toast.success(language === "sw" ? "Stoki imepokewa kikamilifu" : "Stock received successfully");
      setProductId("");
      setQuantity("");
      setBuyingPrice("");
      setNotes("");
      setSupplierId("none");
    } catch (e: any) {
      toast.error(e?.message || "Failed to receive stock");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCorrect = (record: StockReceivedRecord) => {
    setSelectedRecord(record);
    setCorrectDialogOpen(true);
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Pokea Stoki" : "Receive Stock"}
        subtitle={language === "sw" ? "Ongeza stoki mpya kwa bidhaa, msambazaji, na kumbukumbu ya mapokezi." : "Receive fresh stock with supplier details and a clear receiving record."}
      />

      <Card className="section-shell">
        <CardHeader>
          <CardTitle>{language === "sw" ? "Fomu ya kupokea stoki" : "Stock receiving form"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{language === "sw" ? "Msambazaji" : "Supplier"}</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{language === "sw" ? "Bila msambazaji" : "No supplier"}</SelectItem>
                {(suppliers || []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{language === "sw" ? "Bidhaa" : "Product"}</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder={language === "sw" ? "Chagua bidhaa" : "Select product"} /></SelectTrigger>
              <SelectContent>
                {(products || [])
                  .filter((p) => p.item_type !== "service" && p.track_inventory !== false)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ""}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Idadi iliyopokewa" : "Quantity received"}</Label>
              <Input type="number" min="1" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Bei ya kununua (hiari)" : "Buying price (optional)"}</Label>
              <Input type="number" min="0" step="any" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{language === "sw" ? "Maelezo / Kumbukumbu" : "Notes / Reference"}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Invoice / delivery note..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/inventory")}>
              {language === "sw" ? "Rudi kwenye Stoki" : "Back to Inventory"}
            </Button>
            <Button onClick={onSave} disabled={saving || !productId || !quantity}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi Mapokezi" : "Save Stock Received")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Received Stock & Corrections */}
      <Card className="section-shell">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {language === "sw" ? "Mapokezi ya Hivi Karibuni ya Stoki" : "Recent Stock Received"}
            </CardTitle>
            <CardDescription>
              {language === "sw"
                ? "Tazama na rekebisha makosa ya idadi au bei za mapokezi yaliyopita."
                : "View and correct mistakes in past quantities or prices."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {receivedLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !receivedList || receivedList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {language === "sw" ? "Hakuna mapokezi ya hivi karibuni yaliyorekodiwa." : "No recent stock receipts recorded."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "sw" ? "Tarehe" : "Date"}</TableHead>
                    <TableHead>{language === "sw" ? "Msambazaji" : "Supplier"}</TableHead>
                    <TableHead>{language === "sw" ? "Bidhaa & Idadi" : "Items & Qty"}</TableHead>
                    <TableHead className="text-right">{language === "sw" ? "Jumla ya Gharama" : "Total Cost"}</TableHead>
                    <TableHead>{language === "sw" ? "Hali" : "Status"}</TableHead>
                    {canEdit && <TableHead className="text-right">{language === "sw" ? "Kitendo" : "Action"}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedList.map((rec) => {
                    const itemsSummary = rec.items
                      .map((item) => `${item.product?.name || "Product"} × ${item.quantity}`)
                      .join(", ");

                    return (
                      <TableRow key={rec.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTime(rec.created_at)}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {rec.supplier?.name || (language === "sw" ? "Bila msambazaji" : "None")}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={itemsSummary}>
                          {itemsSummary || "—"}
                          {rec.notes && <p className="text-[11px] text-muted-foreground truncate">{rec.notes}</p>}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {formatMoney(rec.total_amount)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {rec.corrected_at ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 gap-1 text-[10px]">
                              <CheckCircle2 className="h-3 w-3" />
                              {language === "sw" ? "Imehaririwa" : "Corrected"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              {rec.status}
                            </Badge>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                              onClick={() => handleOpenCorrect(rec)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {language === "sw" ? "Sahihisha" : "Correct"}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Correcting Stock Received */}
      <CorrectStockDialog
        open={correctDialogOpen}
        onOpenChange={setCorrectDialogOpen}
        record={selectedRecord}
      />
    </div>
  );
}

