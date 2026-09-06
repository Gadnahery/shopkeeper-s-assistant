import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building2, TrendingDown, DollarSign, Loader2, Trash2, Pencil, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDraftForm } from "@/hooks/useDraftForm";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";

export default function Assets() {
  const { shopId } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [assetToDeleteId, setAssetToDeleteId] = useState<string | null>(null);
  const initialAssetForm = { name: "", category: "Equipment", purchase_price: "", current_value: "", depreciation_rate: "10", condition: "Good", location: "", notes: "" };
  const [form, setForm, clearAddAssetDraft] = useDraftForm("add-asset", initialAssetForm);

  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 4;

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

  const updateAsset = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("assets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Asset updated"); setEditingAsset(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); toast.success("Asset removed"); },
  });

  const filtered = useMemo(() => {
    return assets?.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  }, [assets, searchTerm]);

  const totalValue = assets?.reduce((s, a) => s + Number(a.current_value || 0), 0) || 0;
  const totalPurchase = assets?.reduce((s, a) => s + Number(a.purchase_price || 0), 0) || 0;
  const totalDepreciation = Math.max(0, totalPurchase - totalValue);

  const totalMobilePages = Math.ceil(filtered.length / MOBILE_PAGE_SIZE) || 1;
  const currentMobileAssets = filtered.slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);

  if (assets === undefined || isLoading) {
    return <PageLoader message="Loading assets..." messageSw="Inapakia mali..." language={language} />;
  }

  const handleAdd = () => {
    const price = parseFloat(form.purchase_price) || 0;
    addAsset.mutate(
      { name: form.name, category: form.category, purchase_price: price, current_value: parseFloat(form.current_value) || price, depreciation_rate: parseFloat(form.depreciation_rate) || 10, condition: form.condition, location: form.location || null, notes: form.notes || null },
      { onSuccess: () => clearAddAssetDraft() }
    );
  };

  const handleEditSave = () => {
    if (!editingAsset) return;
    updateAsset.mutate({ id: editingAsset.id, name: editingAsset.name, category: editingAsset.category, purchase_price: parseFloat(editingAsset.purchase_price) || 0, current_value: parseFloat(editingAsset.current_value) || 0, depreciation_rate: parseFloat(editingAsset.depreciation_rate) || 10, condition: editingAsset.condition, location: editingAsset.location || null, notes: editingAsset.notes || null });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Usimamizi wa Mali" : "Assets Management"}
        subtitle={language === "sw" ? "Fuatilia mali, thamani ya sasa, na kushuka kwa thamani katika sehemu moja." : "Track business assets, current value, and depreciation in one cleaner view."}
        actions={
          <Button className="gap-1.5 rounded-xl bg-neutral-950 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 text-accent" />
            {language === "sw" ? "Ongeza Mali" : "Add Asset"}
          </Button>
        }
      />

      {/* Inventory-style 2x2 KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Jumla ya Mali" : "Total Assets"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{assets?.length || 0}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Vifaa na majengo" : "Equipment & properties"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Thamani ya Sasa" : "Current Value"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-emerald-600">Tsh {totalValue.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Thamani ya vitabu" : "Book value"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Gharama ya Ununuzi" : "Purchase Cost"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">Tsh {totalPurchase.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Gharama asilia" : "Original outlay"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Kushuka Thamani" : "Depreciation"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-rose-600">Tsh {totalDepreciation.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Thamani iliyopungua" : "Depreciated amount"}</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={language === "sw" ? "Tafuta mali..." : "Search assets..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9 rounded-xl border-border text-xs" />
        </div>
      </div>

      {/* Inventory-style Bottom Sheet for Add Asset */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Ongeza Mali Mpya" : "Add New Asset"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina la Mali" : "Asset Name"} *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Kategoria" : "Category"}</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Equipment" className="text-xs">Equipment</SelectItem>
                    <SelectItem value="Furniture" className="text-xs">Furniture</SelectItem>
                    <SelectItem value="Vehicle" className="text-xs">Vehicle</SelectItem>
                    <SelectItem value="Electronics" className="text-xs">Electronics</SelectItem>
                    <SelectItem value="Building" className="text-xs">Building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Hali" : "Condition"}</Label>
                <Select value={form.condition} onValueChange={v => setForm({...form, condition: v})}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="New" className="text-xs">New</SelectItem>
                    <SelectItem value="Good" className="text-xs">Good</SelectItem>
                    <SelectItem value="Fair" className="text-xs">Fair</SelectItem>
                    <SelectItem value="Poor" className="text-xs">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Bei ya Kununua" : "Purchase Price"}</Label>
                <Input type="number" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Thamani ya Sasa" : "Current Value"}</Label>
                <Input type="number" value={form.current_value} onChange={e => setForm({...form, current_value: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Kushuka %/mwaka" : "Depreciation %/yr"}</Label>
                <Input type="number" value={form.depreciation_rate} onChange={e => setForm({...form, depreciation_rate: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Mahali" : "Location"}</Label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Maelezo" : "Notes"}</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { clearAddAssetDraft(); setIsAddOpen(false); }} className="h-9 rounded-xl text-xs">{language === "sw" ? "Ghairi" : "Cancel"}</Button>
              <Button className="h-9 gap-1.5 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs px-4 transition-all" onClick={handleAdd} disabled={!form.name || addAsset.isPending}>
                {addAsset.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Hifadhi Mali" : "Save Asset")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Inventory-style Bottom Sheet for Edit Asset */}
      <Sheet open={!!editingAsset} onOpenChange={(o) => !o && setEditingAsset(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Hariri Mali" : "Edit Asset"}</SheetTitle>
          </SheetHeader>
          {editingAsset && (
            <div className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina" : "Name"} *</Label>
                <Input value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Kategoria" : "Category"}</Label>
                  <Select value={editingAsset.category || "Equipment"} onValueChange={v => setEditingAsset({...editingAsset, category: v})}>
                    <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Equipment" className="text-xs">Equipment</SelectItem>
                      <SelectItem value="Furniture" className="text-xs">Furniture</SelectItem>
                      <SelectItem value="Vehicle" className="text-xs">Vehicle</SelectItem>
                      <SelectItem value="Electronics" className="text-xs">Electronics</SelectItem>
                      <SelectItem value="Building" className="text-xs">Building</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Hali" : "Condition"}</Label>
                  <Select value={editingAsset.condition || "Good"} onValueChange={v => setEditingAsset({...editingAsset, condition: v})}>
                    <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="New" className="text-xs">New</SelectItem>
                      <SelectItem value="Good" className="text-xs">Good</SelectItem>
                      <SelectItem value="Fair" className="text-xs">Fair</SelectItem>
                      <SelectItem value="Poor" className="text-xs">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Bei ya Kununua" : "Purchase Price"}</Label>
                  <Input type="number" value={editingAsset.purchase_price} onChange={e => setEditingAsset({...editingAsset, purchase_price: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Thamani ya Sasa" : "Current Value"}</Label>
                  <Input type="number" value={editingAsset.current_value} onChange={e => setEditingAsset({...editingAsset, current_value: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Maelezo" : "Notes"}</Label>
                <Input value={editingAsset.notes || ""} onChange={e => setEditingAsset({...editingAsset, notes: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingAsset(null)} className="h-9 rounded-xl text-xs">{language === "sw" ? "Ghairi" : "Cancel"}</Button>
                <Button 
                  className="h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs px-4 transition-all" 
                  onClick={handleEditSave} 
                  disabled={updateAsset.isPending}
                >
                  {updateAsset.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save Changes")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile Card List with 4 items & Pagination */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground rounded-2xl border border-border bg-card p-6">
            {language === "sw" ? "Hakuna mali bado." : "No assets yet."}
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {currentMobileAssets.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-3.5 shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-medium">Tsh {Number(a.current_value).toLocaleString()}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{a.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setEditingAsset({...a})}>
                      <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setAssetToDeleteId(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalMobilePages > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs">
                <span className="text-muted-foreground text-[11px]">
                  {mobilePage} / {totalMobilePages} ({filtered.length} {language === "sw" ? "mali" : "assets"})
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mobilePage <= 1}
                    onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-[11px] rounded-lg"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mobilePage >= totalMobilePages}
                    onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                    className="h-7 px-2.5 text-[11px] rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Table (hidden md:block) */}
      <Card className="section-shell overflow-hidden hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="internal-table-scroll max-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-foreground/70 dark:text-foreground/80">No assets yet</TableCell></TableRow>
                  ) : (
                    filtered.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                        <TableCell>Tsh {Number(a.purchase_price).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">Tsh {Number(a.current_value).toLocaleString()}</TableCell>
                        <TableCell><Badge className={a.condition === 'Good' || a.condition === 'New' ? 'bg-success/10 text-success' : a.condition === 'Fair' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>{a.condition}</Badge></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => setEditingAsset({...a})}>
                              <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setAssetToDeleteId(a.id)}>
                              <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!assetToDeleteId} onOpenChange={(open) => !open && setAssetToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa mali hii?" : "Delete this asset?"}</AlertDialogTitle>
            <AlertDialogDescription>{language === "sw" ? "Kitendo hiki hakiwezi kufutwa." : "This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "sw" ? "Ghairi" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => assetToDeleteId && deleteAsset.mutate(assetToDeleteId, { onSettled: () => setAssetToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAsset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Futa" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
