import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function ReceiveStock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("none");
  const [quantity, setQuantity] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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

      toast.success("Stock received successfully");
      navigate("/inventory");
    } catch (e: any) {
      toast.error(e?.message || "Failed to receive stock");
    } finally {
      setSaving(false);
    }
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
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {(suppliers || []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
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
              <Label>Quantity received</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Buying price (optional)</Label>
              <Input type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Invoice / delivery note..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/inventory")}>Cancel</Button>
            <Button onClick={onSave} disabled={saving || !productId || !quantity}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
