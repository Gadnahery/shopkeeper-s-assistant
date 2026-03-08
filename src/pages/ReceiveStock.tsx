import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useUpdateProduct } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageLoader } from "@/components/PageLoader";

export default function ReceiveStock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const updateProduct = useUpdateProduct();
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("none");
  const [quantity, setQuantity] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (products === undefined || suppliers === undefined || productsLoading || suppliersLoading) {
    return <PageLoader message="Loading..." messageSw="Inapakia..." language={language} />;
  }

  const getShopId = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return null;
    const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", userId).maybeSingle();
    return data?.shop_id ?? null;
  };

  const onSave = async () => {
    if (!productId || !quantity) return;
    const product = products?.find((p) => p.id === productId);
    if (!product) return;
    const qty = Math.max(1, Number(quantity) || 0);
    const newStock = (product.stock || 0) + qty;
    setSaving(true);
    try {
      const shopId = await getShopId();
      if (!shopId) throw new Error("No shop found");

      await updateProduct.mutateAsync({
        id: product.id,
        stock: newStock,
        buying_price: buyingPrice ? Number(buyingPrice) : product.buying_price,
      });
      const { data: received } = await (supabase as any)
        .from("stock_received")
        .insert({
          shop_id: shopId,
          supplier_id: supplierId === "none" ? null : supplierId,
          notes: notes || null,
        })
        .select()
        .single();
      await (supabase as any).from("stock_received_items").insert({
        stock_received_id: received?.id,
        product_id: product.id,
        quantity: qty,
        buying_price: buyingPrice ? Number(buyingPrice) : Number(product.buying_price || 0),
      });
      await supabase.from("stock_history").insert({
        product_id: product.id,
        quantity_change: qty,
        change_type: "restock",
        notes: notes || `Stock received${supplierId !== "none" ? ` from supplier ${supplierId}` : ""}`,
      } as any);
      await logAudit({
        action: "stock_received",
        entityType: "stock_received",
        entityId: received?.id ?? null,
        metadata: {
          product_id: product.id,
          quantity: qty,
          supplier_id: supplierId === "none" ? null : supplierId,
          buying_price: buyingPrice ? Number(buyingPrice) : Number(product.buying_price || 0),
        },
      });
      toast.success("Stock received successfully");
      navigate("/inventory");
    } catch (e: any) {
      toast.error(e?.message || "Failed to receive stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Receive Stock</CardTitle>
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
                {(products || []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
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
