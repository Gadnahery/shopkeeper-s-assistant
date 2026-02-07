import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building2, TrendingDown, DollarSign, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Assets() {
  const { shopId } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Equipment", purchase_price: "", current_value: "", depreciation_rate: "10", condition: "Good", location: "", notes: "" });

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets", shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });

  const addAsset = useMutation({
    mutationFn: async (asset: any) => {
      const { error } = await supabase.from("assets").insert({ ...asset, shop_id: shopId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Asset added"); setIsAddOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Asset removed"); },
  });

  const filtered = assets?.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  const totalValue = assets?.reduce((s, a) => s + Number(a.current_value || 0), 0) || 0;
  const totalPurchase = assets?.reduce((s, a) => s + Number(a.purchase_price || 0), 0) || 0;
  const totalDepreciation = totalPurchase - totalValue;

  const handleAdd = () => {
    const price = parseFloat(form.purchase_price) || 0;
    addAsset.mutate({ name: form.name, category: form.category, purchase_price: price, current_value: parseFloat(form.current_value) || price, depreciation_rate: parseFloat(form.depreciation_rate) || 10, condition: form.condition, location: form.location || null, notes: form.notes || null });
    setForm({ name: "", category: "Equipment", purchase_price: "", current_value: "", depreciation_rate: "10", condition: "Good", location: "", notes: "" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold">Assets Management</h1><p className="text-muted-foreground">Track shop assets, value, and depreciation</p></div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-6"><div className="rounded-lg bg-primary/10 p-3"><Building2 className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Assets</p><p className="text-xl font-bold">{assets?.length || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-6"><div className="rounded-lg bg-success/10 p-3"><DollarSign className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Current Value</p><p className="text-xl font-bold">Tsh {totalValue.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-6"><div className="rounded-lg bg-destructive/10 p-3"><TrendingDown className="h-6 w-6 text-destructive" /></div><div><p className="text-sm text-muted-foreground">Depreciation</p><p className="text-xl font-bold text-destructive">Tsh {totalDepreciation.toLocaleString()}</p></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search assets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Asset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Asset</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Asset Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Display Shelf" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Equipment">Equipment</SelectItem><SelectItem value="Furniture">Furniture</SelectItem><SelectItem value="Vehicle">Vehicle</SelectItem><SelectItem value="Electronics">Electronics</SelectItem><SelectItem value="Building">Building</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Condition</Label>
                  <Select value={form.condition} onValueChange={v => setForm({...form, condition: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Poor">Poor</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Purchase Price (Tsh)</Label><Input type="number" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} /></div>
                <div className="space-y-2"><Label>Current Value (Tsh)</Label><Input type="number" value={form.current_value} onChange={e => setForm({...form, current_value: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Depreciation %/yr</Label><Input type="number" value={form.depreciation_rate} onChange={e => setForm({...form, depreciation_rate: e.target.value})} /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!form.name || addAsset.isPending}>
                {addAsset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Asset"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Purchase Price</TableHead><TableHead>Current Value</TableHead><TableHead>Condition</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No assets yet</TableCell></TableRow> :
            filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                <TableCell>Tsh {Number(a.purchase_price).toLocaleString()}</TableCell>
                <TableCell className="font-medium">Tsh {Number(a.current_value).toLocaleString()}</TableCell>
                <TableCell><Badge className={a.condition === 'Good' || a.condition === 'New' ? 'bg-success/10 text-success' : a.condition === 'Fair' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>{a.condition}</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAsset.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        )}
      </CardContent></Card>
    </motion.div>
  );
}
