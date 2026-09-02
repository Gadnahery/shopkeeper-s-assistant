import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Factory,
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Play,
  Check,
  DollarSign,
  Boxes,
  Trash2,
  Eye,
  Loader2,
  ArrowRight,
  TrendingUp,
  X,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import {
  useProductionBatches,
  useCreateProductionBatch,
  useCompleteProductionBatch,
  useUpdateBatchStatus,
  type ProductionBatch,
  type ProductionMaterial,
} from "@/hooks/useProduction";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

interface MaterialFormRow {
  productId: string;
  quantity: string;
}

export default function Production() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Inline Master-Detail State (NO POPUPS)
  const [isCreatingRun, setIsCreatingRun] = useState(searchParams.get("new") === "true");
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedQtyInput, setCompletedQtyInput] = useState<string>("");

  // New Run Form
  const [selectedOutputProductId, setSelectedOutputProductId] = useState<string>("");
  const [targetBatchQty, setTargetBatchQty] = useState<string>("10");
  const [materialRows, setMaterialRows] = useState<MaterialFormRow[]>([
    { productId: "", quantity: "1" },
  ]);
  const [productionNotes, setProductionNotes] = useState<string>("");

  // Data Hooks
  const { data: batches, isLoading: batchesLoading } = useProductionBatches();
  const { data: products, isLoading: productsLoading } = useProducts();
  const createBatch = useCreateProductionBatch();
  const completeBatch = useCompleteProductionBatch();
  const updateStatus = useUpdateBatchStatus();

  // Listen to header action
  useEffect(() => {
    const handleOpen = () => {
      setIsCreatingRun(true);
      setSelectedBatch(null);
      setIsCompleting(false);
    };
    window.addEventListener("open-new-production", handleOpen);
    return () => window.removeEventListener("open-new-production", handleOpen);
  }, []);

  // Sync URL query
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsCreatingRun(true);
      setSelectedBatch(null);
      setIsCompleting(false);
    }
  }, [searchParams]);

  // Auto-select first batch if none selected and not creating
  useEffect(() => {
    if (batches && batches.length > 0 && !selectedBatch && !isCreatingRun) {
      setSelectedBatch(batches[0]);
    }
  }, [batches]);

  // Handle material row change
  const handleMaterialProductChange = (index: number, productId: string) => {
    const updated = [...materialRows];
    updated[index].productId = productId;
    setMaterialRows(updated);
  };

  const handleMaterialQtyChange = (index: number, quantity: string) => {
    const updated = [...materialRows];
    updated[index].quantity = quantity;
    setMaterialRows(updated);
  };

  const addMaterialRow = () => {
    setMaterialRows([...materialRows, { productId: "", quantity: "1" }]);
  };

  const removeMaterialRow = (index: number) => {
    if (materialRows.length <= 1) return;
    setMaterialRows(materialRows.filter((_, i) => i !== index));
  };

  // Calculate estimated material cost
  const calculatedMaterials = useMemo((): ProductionMaterial[] => {
    return materialRows
      .filter((row) => row.productId && Number(row.quantity) > 0)
      .map((row) => {
        const prod = products?.find((p) => p.id === row.productId);
        const qty = Number(row.quantity) || 0;
        const unitCost = Number(prod?.buying_price || 0);
        return {
          product_id: row.productId,
          product_name: prod?.name || "Material",
          product_code: prod?.code || "",
          quantity: qty,
          unit_cost: unitCost,
          total_cost: qty * unitCost,
        };
      });
  }, [materialRows, products]);

  const totalEstimatedCost = useMemo(() => {
    return calculatedMaterials.reduce((sum, m) => sum + m.total_cost, 0);
  }, [calculatedMaterials]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const list = batches || [];
    const active = list.filter((b) => b.status === "planned" || b.status === "in_progress").length;
    const completedList = list.filter((b) => b.status === "completed");
    const totalOutput = completedList.reduce((sum, b) => sum + (b.quantity_produced || b.quantity_to_produce || 0), 0);
    const totalCost = list.reduce((sum, b) => sum + (b.total_cost || 0), 0);

    return {
      activeRuns: active,
      completedCount: completedList.length,
      totalOutput,
      totalCost,
    };
  }, [batches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    let list = batches;
    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (b) =>
          b.batch_number.toLowerCase().includes(q) ||
          (b.output_product_name && b.output_product_name.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [batches, statusFilter, searchTerm]);

  // Handlers
  const handleCreateRun = async () => {
    if (!selectedOutputProductId) {
      toast.error(language === "sw" ? "Tafadhali chagua bidhaa inayotengenezwa" : "Please select an output product");
      return;
    }
    const outputProd = products?.find((p) => p.id === selectedOutputProductId);
    const targetQty = Number(targetBatchQty) || 1;

    try {
      const created = await createBatch.mutateAsync({
        outputProductId: selectedOutputProductId,
        outputProductName: outputProd?.name,
        outputProductCode: outputProd?.code,
        quantityToProduce: targetQty,
        inputMaterials: calculatedMaterials,
        notes: productionNotes.trim() || undefined,
      });

      toast.success(language === "sw" ? "Awamu ya uzalishaji imepangwa" : "Production run planned successfully");
      setIsCreatingRun(false);
      setSelectedOutputProductId("");
      setTargetBatchQty("10");
      setMaterialRows([{ productId: "", quantity: "1" }]);
      setProductionNotes("");
      if (created) setSelectedBatch(created);
      if (searchParams.get("new")) setSearchParams({});
    } catch (err: any) {
      toast.error(err?.message || "Failed to create production batch");
    }
  };

  const handleStartRun = async (batchId: string) => {
    try {
      await updateStatus.mutateAsync({ batchId, status: "in_progress" });
      toast.success(language === "sw" ? "Uzalishaji umeanza" : "Production started");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start run");
    }
  };

  const handleConfirmComplete = async () => {
    if (!selectedBatch) return;
    const finalQty = Number(completedQtyInput) || selectedBatch.quantity_to_produce;

    try {
      await completeBatch.mutateAsync({
        batch: selectedBatch,
        quantityProduced: finalQty,
      });

      toast.success(
        language === "sw"
          ? "Uzalishaji umekamilika! Malighafi zimekatwa na bidhaa zimeongezwa stoo."
          : "Production completed! Materials deducted and finished stock updated.",
      );
      setIsCompleting(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete production run");
    }
  };

  const getStatusBadge = (status: ProductionBatch["status"]) => {
    switch (status) {
      case "planned":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t("production.statusPlanned")}
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--warning-text)]">
            <Play className="h-3 w-3 fill-current" />
            {t("production.statusInProgress")}
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--success-text)]">
            <CheckCircle2 className="h-3 w-3" />
            {t("production.statusCompleted")}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--danger-text)]">
            <XCircle className="h-3 w-3" />
            {t("production.statusCancelled")}
          </span>
        );
    }
  };

  if (batchesLoading || productsLoading) {
    return <PageLoader message="Loading production..." messageSw="Inapakia uzalishaji..." language={language} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("production.activeRuns")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Factory className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{kpiStats.activeRuns}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {language === "sw" ? "Awamu zinazosubiri / zinaendelea" : "Planned or in-progress runs"}
            </p>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("production.completedToday")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{kpiStats.completedCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {language === "sw" ? "Awamu zilizokamilika" : "Completed batches"}
            </p>
          </div>
        </Card>

        {/* KPI 3 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("production.totalOutput")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Boxes className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatNumber(kpiStats.totalOutput)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {language === "sw" ? "Vipande vilivyozalishwa stoo" : "Units produced into inventory"}
            </p>
          </div>
        </Card>

        {/* KPI 4 */}
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("production.materialCost")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(kpiStats.totalCost)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {language === "sw" ? "Gharama ya malighafi zote" : "Cumulative raw material cost"}
            </p>
          </div>
        </Card>
      </div>

      {/* 2-Column Master-Detail Layout (NO POPUPS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master Batches Table - 7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { key: "all", label: language === "sw" ? "Zote" : "All" },
                  { key: "planned", label: t("production.statusPlanned") },
                  { key: "in_progress", label: t("production.statusInProgress") },
                  { key: "completed", label: t("production.statusCompleted") },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      statusFilter === tab.key
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-44">
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
                    setIsCreatingRun(true);
                    setSelectedBatch(null);
                    setIsCompleting(false);
                  }}
                  className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  <span>{t("production.newRun")}</span>
                </Button>
              </div>
            </div>

            {filteredBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Factory className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">{t("production.noRuns")}</p>
                <Button
                  onClick={() => {
                    setIsCreatingRun(true);
                    setSelectedBatch(null);
                  }}
                  className="mt-3 h-8 gap-1.5 rounded-xl bg-primary text-xs text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  <span>{t("production.newRun")}</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("production.batchNumber")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("production.outputProduct")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Idadi" : "Qty"}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("purchases.status")}</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => {
                      const isSelected = selectedBatch?.id === batch.id && !isCreatingRun;
                      return (
                        <TableRow
                          key={batch.id}
                          onClick={() => {
                            setSelectedBatch(batch);
                            setIsCreatingRun(false);
                            setIsCompleting(false);
                          }}
                          className={cn(
                            "cursor-pointer border-b border-border/60 transition-colors",
                            isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                          )}
                        >
                          <TableCell className="text-xs font-bold text-foreground">{batch.batch_number}</TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">{batch.output_product_name}</TableCell>
                          <TableCell className="text-xs text-foreground">
                            {batch.status === "completed" ? `${batch.quantity_produced} pcs` : `${batch.quantity_to_produce} pcs`}
                          </TableCell>
                          <TableCell>{getStatusBadge(batch.status)}</TableCell>
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
          </Card>
        </div>

        {/* Right Column (Inline Action / Detail Panel - 5 Cols, NO POPUPS) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Case 1: Inline "New Production Run" Form */}
          {isCreatingRun && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Factory className="h-4 w-4 text-accent" />
                  <span>{t("production.newRun")}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreatingRun(false)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{t("production.outputProduct")} *</Label>
                  <Select value={selectedOutputProductId} onValueChange={setSelectedOutputProductId}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                      <SelectValue placeholder={language === "sw" ? "Chagua bidhaa inayotengenezwa..." : "Select output item..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-52 rounded-xl border-border bg-popover text-xs">
                      {(products || []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.code}) — Stk: {p.stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{t("production.quantityToProduce")} *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={targetBatchQty}
                    onChange={(e) => setTargetBatchQty(e.target.value)}
                    className="h-9 rounded-xl border-border bg-background text-xs font-bold text-center"
                  />
                </div>

                {/* Materials list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">{t("production.rawMaterials")}</Label>
                    <span className="text-[10px] text-muted-foreground">{language === "sw" ? "Zitakatwa stoo" : "Deducted on completion"}</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {materialRows.map((row, index) => {
                      const prod = products?.find((p) => p.id === row.productId);
                      const qty = Number(row.quantity) || 0;
                      const unitCost = Number(prod?.buying_price || 0);
                      const lineCost = qty * unitCost;

                      return (
                        <div key={index} className="rounded-xl border border-border bg-muted/20 p-2.5 space-y-1.5">
                          <Select
                            value={row.productId}
                            onValueChange={(val) => handleMaterialProductChange(index, val)}
                          >
                            <SelectTrigger className="h-8 rounded-lg border-border bg-background text-xs">
                              <SelectValue placeholder={language === "sw" ? "Chagua malighafi..." : "Select material..."} />
                            </SelectTrigger>
                            <SelectContent className="max-h-52 rounded-xl border-border bg-popover text-xs">
                              {(products || []).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} — Stk: {p.stock} | {formatMoney(p.buying_price || 0)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center justify-between gap-2">
                            <Input
                              type="number"
                              min="0.1"
                              step="any"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => handleMaterialQtyChange(index, e.target.value)}
                              className="h-8 w-20 rounded-lg border-border bg-background text-xs text-center font-semibold"
                            />

                            <span className="text-xs font-semibold text-foreground flex-1 text-right">
                              {formatMoney(lineCost)}
                            </span>

                            {materialRows.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMaterialRow(index)}
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
                    onClick={addMaterialRow}
                    className="h-8 w-full gap-1 rounded-xl border-dashed border-border text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent" />
                    <span>{language === "sw" ? "+ Ongeza Malighafi" : "+ Add Material"}</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-2.5 text-xs">
                  <span className="font-semibold text-foreground">{t("production.materialCost")}</span>
                  <span className="font-bold text-foreground">{formatMoney(totalEstimatedCost)}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setIsCreatingRun(false)} className="h-9 rounded-xl text-xs flex-1">
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleCreateRun}
                    disabled={createBatch.isPending || !selectedOutputProductId}
                    className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2] shadow-xs hover:bg-primary/90"
                  >
                    {createBatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 text-accent mr-1" />}
                    <span>{language === "sw" ? "Panga Awamu" : "Plan Run"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case 2: Inline Selected Batch Details or Complete Run Form */}
          {!isCreatingRun && selectedBatch && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    {selectedBatch.batch_number}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">{selectedBatch.output_product_name}</p>
                </div>
                {getStatusBadge(selectedBatch.status)}
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Mode A: Complete Run Form inside panel */}
                {isCompleting ? (
                  <div className="space-y-3 rounded-xl bg-muted/30 p-3.5 border border-border">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-accent" />
                      <span>{t("production.completeRun")}</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {language === "sw"
                        ? "Weka idadi halisi iliyotengenezwa. Malighafi zote zitakatwa stoo kiotomatiki."
                        : "Enter actual output units. Consumed raw materials will be deducted automatically."}
                    </p>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">{t("production.quantityProduced")} *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={completedQtyInput}
                        onChange={(e) => setCompletedQtyInput(e.target.value)}
                        className="h-9 rounded-xl border-border bg-background text-sm font-bold text-center"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setIsCompleting(false)} className="h-8 rounded-xl text-xs flex-1">
                        {t("common.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmComplete}
                        disabled={completeBatch.isPending || !Number(completedQtyInput)}
                        className="h-8 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2]"
                      >
                        {completeBatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>{language === "sw" ? "Sasisha Stoki" : "Update Stock"}</span>
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Batch Details Summary */}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">{language === "sw" ? "Lengo / Uzalishaji" : "Target / Produced"}:</span>
                    <p className="font-bold text-foreground">
                      {selectedBatch.status === "completed" ? `${selectedBatch.quantity_produced} pcs` : `${selectedBatch.quantity_to_produce} pcs`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("production.materialCost")}:</span>
                    <p className="font-bold text-foreground">{formatMoney(selectedBatch.total_cost)}</p>
                  </div>
                  {selectedBatch.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t("production.notes")}:</span>
                      <p className="text-foreground">{selectedBatch.notes}</p>
                    </div>
                  )}
                </div>

                {/* Input Materials Table */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">{t("production.rawMaterials")}</span>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 text-xs">
                          <TableHead>{language === "sw" ? "Malighafi" : "Material"}</TableHead>
                          <TableHead className="text-center">{t("purchases.quantity")}</TableHead>
                          <TableHead className="text-right">{language === "sw" ? "Gharama" : "Cost"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBatch.input_materials.map((m, idx) => (
                          <TableRow key={idx} className="text-xs">
                            <TableCell className="font-medium text-foreground">{m.product_name}</TableCell>
                            <TableCell className="text-center">{m.quantity}</TableCell>
                            <TableCell className="text-right font-bold text-foreground">{formatMoney(m.total_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Actions Footer */}
                {!isCompleting && (
                  <div className="flex gap-2 border-t border-border pt-3">
                    {selectedBatch.status === "planned" && (
                      <Button
                        onClick={() => handleStartRun(selectedBatch.id)}
                        className="h-9 w-full gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        <Play className="h-3.5 w-3.5 text-accent" />
                        <span>{t("production.startRun")}</span>
                      </Button>
                    )}

                    {selectedBatch.status === "in_progress" && (
                      <Button
                        onClick={() => {
                          setIsCompleting(true);
                          setCompletedQtyInput(String(selectedBatch.quantity_to_produce));
                        }}
                        className="h-9 w-full gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>{t("production.completeRun")}</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
