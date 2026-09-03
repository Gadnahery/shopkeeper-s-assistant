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
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
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
  useDeleteProductionBatch,
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingComplete, setIsConfirmingComplete] = useState(false);
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
  const deleteBatch = useDeleteProductionBatch();
  const updateStatus = useUpdateBatchStatus();

  // Listen to header action
  useEffect(() => {
    const handleOpen = () => {
      setIsCreatingRun(true);
      setSelectedBatch(null);
      setIsCompleting(false);
      setIsConfirmingDelete(false);
      setIsConfirmingComplete(false);
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
      setIsConfirmingDelete(false);
      setIsConfirmingComplete(false);
    }
  }, [searchParams]);

  // Auto-select first batch if none selected and not creating
  useEffect(() => {
    if (!selectedBatch && batches && batches.length > 0 && !isCreatingRun) {
      setSelectedBatch(batches[0]);
    }
  }, [batches, selectedBatch, isCreatingRun]);

  // KPI Calculations
  const totalProducedUnits = useMemo(() => {
    return (batches || [])
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.quantity_produced || 0), 0);
  }, [batches]);

  const activeBatchesCount = useMemo(() => {
    return (batches || []).filter((b) => b.status === "in_progress" || b.status === "planned").length;
  }, [batches]);

  const totalProductionCost = useMemo(() => {
    return (batches || []).reduce((sum, b) => sum + (b.total_cost || 0), 0);
  }, [batches]);

  const completedBatchesCount = useMemo(() => {
    return (batches || []).filter((b) => b.status === "completed").length;
  }, [batches]);

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    return batches.filter((b) => {
      const matchSearch =
        b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.output_product_name && b.output_product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [batches, searchTerm, statusFilter]);

  // Material helpers
  const handleMaterialProductChange = (index: number, productId: string) => {
    const updated = [...materialRows];
    updated[index].productId = productId;
    setMaterialRows(updated);
  };

  const handleMaterialQtyChange = (index: number, qty: string) => {
    const updated = [...materialRows];
    updated[index].quantity = qty;
    setMaterialRows(updated);
  };

  const addMaterialRow = () => {
    setMaterialRows([...materialRows, { productId: "", quantity: "1" }]);
  };

  const removeMaterialRow = (index: number) => {
    if (materialRows.length <= 1) return;
    setMaterialRows(materialRows.filter((_, i) => i !== index));
  };

  // Estimated material cost
  const totalEstimatedCost = useMemo(() => {
    return materialRows.reduce((acc, row) => {
      const prod = products?.find((p) => p.id === row.productId);
      const qty = Number(row.quantity) || 0;
      const price = Number(prod?.buying_price) || 0;
      return acc + qty * price;
    }, 0);
  }, [materialRows, products]);

  // Handle create run
  const handleCreateRun = async () => {
    if (!selectedOutputProductId) {
      toast.error(language === "sw" ? "Tafadhali chagua bidhaa ya kuzalisha." : "Please select an output product.");
      return;
    }

    const validMaterials: ProductionMaterial[] = [];
    for (const row of materialRows) {
      if (row.productId && Number(row.quantity) > 0) {
        const prod = products?.find((p) => p.id === row.productId);
        const qty = Number(row.quantity);
        const unitCost = Number(prod?.buying_price || 0);
        validMaterials.push({
          product_id: row.productId,
          product_name: prod?.name || "Material",
          product_code: prod?.barcode || "",
          quantity: qty,
          unit_cost: unitCost,
          total_cost: qty * unitCost,
        });
      }
    }

    const outProd = products?.find((p) => p.id === selectedOutputProductId);

    try {
      await createBatch.mutateAsync({
        outputProductId: selectedOutputProductId,
        outputProductName: outProd?.name || "Product",
        outputProductCode: outProd?.barcode || "",
        quantityToProduce: Number(targetBatchQty) || 1,
        inputMaterials: validMaterials,
        notes: productionNotes.trim() || undefined,
      });

      toast.success(language === "sw" ? "Awamu ya uzalishaji imepangwa kikamilifu!" : "Production run planned successfully!");
      setIsCreatingRun(false);
      setSelectedOutputProductId("");
      setTargetBatchQty("10");
      setMaterialRows([{ productId: "", quantity: "1" }]);
      setProductionNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create production run");
    }
  };

  // Start run
  const handleStartRun = async (batchId: string) => {
    try {
      await updateStatus.mutateAsync({ batchId, status: "in_progress" });
      toast.success(language === "sw" ? "Awamu imeanza kuzalisha!" : "Production batch started!");
    } catch (err: any) {
      toast.error(err.message || "Failed to start run");
    }
  };

  // Confirm and complete run (two-step inline confirmation)
  const handleExecuteComplete = async () => {
    if (!selectedBatch) return;
    const produced = Number(completedQtyInput);
    if (!produced || produced <= 0) {
      toast.error(language === "sw" ? "Weka idadi sahihi iliyotengenezwa." : "Enter a valid produced quantity.");
      return;
    }

    try {
      await completeBatch.mutateAsync({
        batch: selectedBatch,
        quantityProduced: produced,
      });

      toast.success(
        language === "sw"
          ? `Uzalishaji umekamilika! Bidhaa ${produced} zimeongezwa na malighafi kukatwa stoo.`
          : `Production complete! Added ${produced} units and deducted raw materials.`,
      );

      setIsCompleting(false);
      setIsConfirmingComplete(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to complete production run");
    }
  };

  // Delete run
  const handleDeleteRun = async () => {
    if (!selectedBatch) return;
    try {
      await deleteBatch.mutateAsync(selectedBatch);
      toast.success(language === "sw" ? "Awamu ya uzalishaji imefutwa!" : "Production batch deleted!");
      setIsConfirmingDelete(false);
      setSelectedBatch(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete batch");
    }
  };

  if (batchesLoading || productsLoading) {
    return <PageLoader message="Loading production..." messageSw="Inapakia uzalishaji..." language={language} />;
  }

  const getStatusBadge = (status: "planned" | "in_progress" | "completed" | "cancelled") => {
    switch (status) {
      case "planned":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--warning-text)]">
            <Clock className="h-3 w-3" />
            {t("production.planned")}
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            <Play className="h-3 w-3" />
            {t("production.inProgress")}
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--success-text)]">
            <CheckCircle2 className="h-3 w-3" />
            {t("production.completed")}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--danger-text)]">
            <XCircle className="h-3 w-3" />
            {t("production.cancelled")}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 KPI Top Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-[#eef0f3] p-4 flex gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-50">
            <Boxes className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-gray-500 truncate">{language === "sw" ? "Jumla Iliyozalishwa" : "Total Produced Units"}</h3>
            <p className="text-lg font-bold text-[#1a1d29] mt-0.5 truncate">{formatNumber(totalProducedUnits)} pcs</p>
            <p className="text-[11px] text-gray-400 mt-1">{completedBatchesCount} {language === "sw" ? "awamu zilizokamilika" : "completed runs"}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eef0f3] p-4 flex gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50">
            <Play className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-gray-500 truncate">{language === "sw" ? "Awamu Zinazoendelea" : "Active Batches"}</h3>
            <p className="text-lg font-bold text-[#1a1d29] mt-0.5 truncate">{activeBatchesCount}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">{language === "sw" ? "Kwenye uzalishaji" : "In production line"}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eef0f3] p-4 flex gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-purple-50">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-gray-500 truncate">{t("production.materialCost")}</h3>
            <p className="text-lg font-bold text-[#1a1d29] mt-0.5 truncate">{formatMoney(totalProductionCost)}</p>
            <p className="text-[11px] text-gray-400 mt-1">{language === "sw" ? "Gharama ya malighafi zote" : "Total materials cost"}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#eef0f3] p-4 flex gap-3 shadow-xs min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-gray-500 truncate">{language === "sw" ? "Awamu Zilizokamilika" : "Completed Batches"}</h3>
            <p className="text-lg font-bold text-[#1a1d29] mt-0.5 truncate">{completedBatchesCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">{batches?.length || 0} {language === "sw" ? "awamu zote" : "total runs"}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Master Batches Table - expands to 12 cols when no detail panel is open) */}
        <div className={cn("space-y-4 transition-all duration-200", (selectedBatch || isCreatingRun) ? "lg:col-span-7" : "lg:col-span-12")}>
          <Card className="border border-border bg-card shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="h-8 rounded-xl text-xs font-semibold"
                >
                  {t("common.all")} ({batches?.length || 0})
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "in_progress" ? "default" : "outline"}
                  onClick={() => setStatusFilter("in_progress")}
                  className="h-8 rounded-xl text-xs font-semibold"
                >
                  {t("production.inProgress")}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  className="h-8 rounded-xl text-xs font-semibold"
                >
                  {t("production.completed")}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={language === "sw" ? "Tafuta awamu..." : "Search batches..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl border-border bg-background"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsCreatingRun(true);
                    setSelectedBatch(null);
                    setIsCompleting(false);
                    setIsConfirmingDelete(false);
                  }}
                  className="h-8 gap-1 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  <span>{t("production.newRun")}</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <Table className="min-w-[650px] w-full">
                <TableHeader>
                  <TableRow className="bg-[#f9fafb] text-[11px] uppercase">
                    <TableHead className="font-semibold">{t("production.batchNumber")}</TableHead>
                    <TableHead className="font-semibold">{t("production.outputProduct")}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "Lengo / Matokeo" : "Target / Yield"}</TableHead>
                    <TableHead className="text-right font-semibold">{t("production.materialCost")}</TableHead>
                    <TableHead className="text-center font-semibold">{language === "sw" ? "Hali" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((batch) => {
                      const isSelected = selectedBatch?.id === batch.id && !isCreatingRun;
                      return (
                        <TableRow
                          key={batch.id}
                          onClick={() => {
                            setSelectedBatch(batch);
                            setIsCreatingRun(false);
                            setIsCompleting(false);
                            setIsConfirmingDelete(false);
                            setIsConfirmingComplete(false);
                          }}
                          className={cn(
                            "cursor-pointer transition-colors text-xs",
                            isSelected ? "bg-muted/80 font-medium" : "hover:bg-muted/40",
                          )}
                        >
                          <TableCell>
                            <p className="font-bold text-foreground">{batch.batch_number}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(batch.created_at), "dd MMM yyyy")}</p>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {batch.output_product_name}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {batch.status === "completed"
                              ? `${batch.quantity_produced} pcs`
                              : `${batch.quantity_to_produce} pcs`}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatMoney(batch.total_cost)}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(batch.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                        {language === "sw" ? "Hakuna awamu zilizopatikana." : "No production batches found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Column (Inline Detail / Create Panel - 5 Cols, NO POPUPS) */}
        <div className="space-y-4 lg:col-span-5">
          {/* Case 1: Inline "New Production Run" Panel */}
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

              <CardContent className="p-4 space-y-4">
                {/* Output Product Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">{t("production.outputProduct")} *</Label>
                  <Select value={selectedOutputProductId} onValueChange={setSelectedOutputProductId}>
                    <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                      <SelectValue placeholder={language === "sw" ? "Chagua bidhaa ya mwisho..." : "Select finished product..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-56 rounded-xl border-border bg-popover text-xs">
                      {(products || []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — Stk: {p.stock}
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
                    <span className="text-[10px] text-muted-foreground">{language === "sw" ? "Zitakatwa stoo ukikamilisha" : "Deducted on completion"}</span>
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
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBatch.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedBatch(null);
                      setIsConfirmingDelete(false);
                      setIsCompleting(false);
                      setIsConfirmingComplete(false);
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
                      <span>{language === "sw" ? "Thibitisha kufuta awamu hii?" : "Confirm deleting this batch?"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {language === "sw"
                        ? "Awamu hii ya uzalishaji itaondolewa. Hatua hii haiwezi kubadilishwa."
                        : "This production batch will be removed from your records."}
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
                        onClick={handleDeleteRun}
                        disabled={deleteBatch.isPending}
                        className="h-8 rounded-xl bg-destructive text-xs font-bold text-destructive-foreground hover:bg-destructive/90 flex-1"
                      >
                        {deleteBatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>{language === "sw" ? "Futa Kabisa" : "Confirm Delete"}</span>
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Mode A: Complete Run Form inside panel with 2-Step Confirmation */}
                {isCompleting ? (
                  <div className="space-y-3 rounded-xl bg-muted/30 p-3.5 border border-border">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-accent" />
                      <span>{t("production.completeRun")}</span>
                    </h4>

                    {!isConfirmingComplete ? (
                      <>
                        <p className="text-[11px] text-muted-foreground">
                          {language === "sw"
                            ? "Weka idadi halisi iliyotengenezwa."
                            : "Enter actual output units produced."}
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
                            onClick={() => {
                              if (!Number(completedQtyInput) || Number(completedQtyInput) <= 0) {
                                toast.error(language === "sw" ? "Weka idadi sahihi." : "Enter valid quantity.");
                                return;
                              }
                              setIsConfirmingComplete(true);
                            }}
                            className="h-8 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2]"
                          >
                            <span>{language === "sw" ? "Kamilisha Uzalishaji..." : "Complete Run..."}</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Inline Confirmation Step */
                      <div className="space-y-2.5 pt-1">
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                          <p className="font-bold mb-1">
                            {language === "sw" ? "Tahadhari ya Stoki:" : "Inventory Notice:"}
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            {language === "sw"
                              ? `Kukamilisha kutaongeza bidhaa ${completedQtyInput} za '${selectedBatch.output_product_name}' na kukata malighafi ${selectedBatch.input_materials.length} moja kwa moja stoo.`
                              : `Completing will add ${completedQtyInput} units of '${selectedBatch.output_product_name}' and automatically deduct ${selectedBatch.input_materials.length} raw materials.`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsConfirmingComplete(false)}
                            className="h-8 rounded-xl text-xs flex-1"
                          >
                            {language === "sw" ? "Rudi Nyuma" : "Back"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleExecuteComplete}
                            disabled={completeBatch.isPending}
                            className="h-8 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 flex-[2]"
                          >
                            {completeBatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            <span>{language === "sw" ? "Thibitisha & Sasisha Stoki" : "Confirm & Update Stock"}</span>
                          </Button>
                        </div>
                      </div>
                    )}
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
                {!isCompleting && !isConfirmingDelete && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
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
                          setIsConfirmingComplete(false);
                          setCompletedQtyInput(String(selectedBatch.quantity_to_produce));
                        }}
                        className="h-9 w-full gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        <Check className="h-3.5 w-3.5 text-accent" />
                        <span>{t("production.completeRun")}</span>
                      </Button>
                    )}

                    {/* Delete action (allowed when not completed) */}
                    {selectedBatch.status !== "completed" && (
                      <Button
                        variant="outline"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="h-8 gap-1 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{language === "sw" ? "Futa Awamu Hii" : "Delete Batch"}</span>
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
