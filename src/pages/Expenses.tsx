import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingDown,
  Plus,
  Search,
  Filter,
  CreditCard,
  Building,
  Receipt,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  PieChart as PieChartIcon,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses, useCreateExpense, useDeleteExpense, type Expense } from "@/hooks/useExpenses";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import Billing from "@/pages/Billing";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  { value: "rent", labelEn: "Rent / Premises", labelSw: "Kodi ya Pango" },
  { value: "utilities", labelEn: "Electricity / Water", labelSw: "Umeme / Maji" },
  { value: "salaries", labelEn: "Salaries / Wages", labelSw: "Mishahara" },
  { value: "transport", labelEn: "Transport / Fuel", labelSw: "Usafiri / Mafuta" },
  { value: "maintenance", labelEn: "Repairs & Maintenance", labelSw: "Matengenezo" },
  { value: "marketing", labelEn: "Marketing & Ads", labelSw: "Matangazo" },
  { value: "supplies", labelEn: "Packaging & Office", labelSw: "Vifungashio / Vifaa" },
  { value: "other", labelEn: "Other / Misc", labelSw: "Mengineyo" },
];

export default function Expenses() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const { shopId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("expenses");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isAddingExpense, setIsAddingExpense] = useState(searchParams.get("new") === "true");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // New Expense Form
  const [newForm, setNewForm] = useState({
    title: "",
    category: "rent",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsAddingExpense(true);
      setSelectedExpense(null);
    }
  }, [searchParams]);

  // Auto-select first expense
  useEffect(() => {
    if (expenses && expenses.length > 0 && !selectedExpense && !isAddingExpense) {
      setSelectedExpense(expenses[0]);
    }
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q));

      const matchesCat = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // KPI Calculations
  const totalAmount = useMemo(() => {
    return (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const thisMonthExpenses = useMemo(() => {
    const currentMonth = format(new Date(), "yyyy-MM");
    return (expenses || [])
      .filter((e) => (e.date || e.created_at || "").startsWith(currentMonth))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (expenses || []).forEach((e) => {
      const cat = e.category || "other";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount || 0));
    });
    return Array.from(map.entries())
      .map(([cat, total]) => ({ cat, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  if (expenses === undefined || isLoading) {
    return <PageLoader message="Loading expenses..." messageSw="Inapakia matumizi..." language={language} />;
  }

  const handleSelectExpense = (e: Expense) => {
    setSelectedExpense(e);
    setIsAddingExpense(false);
  };

  const handleCreateExpense = async () => {
    if (!newForm.title.trim() || !Number(newForm.amount)) {
      toast.error(language === "sw" ? "Jaza jina na kiasi cha matumizi" : "Please fill in title and amount");
      return;
    }

    try {
      const created = await createExpense.mutateAsync({
        title: newForm.title.trim(),
        category: newForm.category,
        amount: Number(newForm.amount),
        date: newForm.date,
        notes: newForm.notes.trim() || undefined,
        shop_id: shopId || undefined,
      } as any);

      toast.success(language === "sw" ? "Gharama imerekodiwa" : "Expense recorded successfully");
      setIsAddingExpense(false);
      setNewForm({
        title: "",
        category: "rent",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      if (created) setSelectedExpense(created);
      if (searchParams.get("new")) setSearchParams({});
    } catch (err: any) {
      toast.error(err?.message || "Failed to record expense");
    }
  };

  const getCategoryLabel = (val: string) => {
    const c = EXPENSE_CATEGORIES.find((item) => item.value === val);
    if (!c) return val;
    return language === "sw" ? c.labelSw : c.labelEn;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("expenses.totalExpenses")}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(totalAmount)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{expenses?.length || 0} {language === "sw" ? "miamala ya gharama" : "total transactions"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Mwezi Huu" : "This Month"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(thisMonthExpenses)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Gharama Kuu" : "Top Category"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Tag className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold tracking-tight text-foreground truncate">
              {categoryBreakdown.length > 0 ? getCategoryLabel(categoryBreakdown[0].cat) : "-"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {categoryBreakdown.length > 0 ? formatMoney(categoryBreakdown[0].total) : "0"}
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Aina za Matumizi" : "Categories"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Layers className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{categoryBreakdown.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Makundi yaliyotumika" : "Active categories"}</p>
          </div>
        </Card>
      </div>

      {/* Main Tabs (Expenses vs Billing Plans) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-4">
          <TabsTrigger value="expenses" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            {t("expenses.title")}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            {language === "sw" ? "Bili na Vifurushi" : "Subscription & Billing"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="m-0 space-y-6">
          {/* 2-Column Master-Detail Layout (NO POPUPS) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column (Master Expenses Table - 7 Cols) */}
            <div className="space-y-4 lg:col-span-7">
              <Card className="border border-border bg-card shadow-xs">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-44">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={language === "sw" ? "Tafuta..." : "Search..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                      />
                    </div>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-9 w-36 rounded-xl border-border bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover text-xs">
                        <SelectItem value="all">{language === "sw" ? "Zote" : "All Categories"}</SelectItem>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {language === "sw" ? c.labelSw : c.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => {
                      setIsAddingExpense(true);
                      setSelectedExpense(null);
                    }}
                    className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent" />
                    <span>{t("expenses.addExpense")}</span>
                  </Button>
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {language === "sw" ? "Hakuna matumizi yaliyorekodiwa" : "No expenses recorded"}
                    </p>
                    <Button
                      onClick={() => {
                        setIsAddingExpense(true);
                        setSelectedExpense(null);
                      }}
                      className="mt-3 h-8 rounded-xl text-xs bg-primary text-primary-foreground"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5 text-accent" />
                      {t("expenses.addExpense")}
                    </Button>
                  </div>
                ) : (
                  <div className="internal-table-scroll">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("expenses.date")}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("expenses.expenseTitle")}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("expenses.category")}</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("expenses.amount")}</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExpenses.map((exp) => {
                          const isSelected = selectedExpense?.id === exp.id && !isAddingExpense;

                          return (
                            <TableRow
                              key={exp.id}
                              onClick={() => handleSelectExpense(exp)}
                              className={cn(
                                "cursor-pointer border-b border-border/60 transition-colors",
                                isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                              )}
                            >
                              <TableCell className="text-xs font-medium text-foreground">
                                {format(new Date(exp.date || exp.created_at || new Date()), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-foreground">
                                {exp.title || (language === "sw" ? "Gharama" : "Expense")}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {getCategoryLabel(exp.category || "other")}
                              </TableCell>
                              <TableCell className="text-xs font-bold text-foreground">
                                {formatMoney(exp.amount)}
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
              </Card>
            </div>

            {/* Right Column (Inline Detail / Add Panel - 5 Cols, NO POPUPS) */}
            <div className="space-y-4 lg:col-span-5">
              {/* Case 1: Inline Add Expense Form */}
              {isAddingExpense && (
                <Card className="border border-border bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span>{t("expenses.addExpense")}</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAddingExpense(false)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">{t("expenses.expenseTitle")} *</Label>
                      <Input
                        value={newForm.title}
                        onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                        placeholder="e.g. Kodi ya duka mwezi huu"
                        className="h-9 rounded-xl border-border bg-background text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{t("expenses.category")}</Label>
                        <Select
                          value={newForm.category}
                          onValueChange={(v) => setNewForm({ ...newForm, category: v })}
                        >
                          <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-popover text-xs">
                            {EXPENSE_CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {language === "sw" ? c.labelSw : c.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{t("expenses.amount")} (TSH) *</Label>
                        <Input
                          type="number"
                          value={newForm.amount}
                          onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })}
                          placeholder="50000"
                          className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">{t("expenses.date")}</Label>
                      <Input
                        type="date"
                        value={newForm.date}
                        onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                        className="h-9 rounded-xl border-border bg-background text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">{language === "sw" ? "Maelezo ya Ziada" : "Notes"}</Label>
                      <Input
                        value={newForm.notes}
                        onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                        placeholder="Receipt #, vendor..."
                        className="h-9 rounded-xl border-border bg-background text-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsAddingExpense(false)} className="h-9 rounded-xl text-xs flex-1">
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={handleCreateExpense}
                        disabled={createExpense.isPending || !newForm.title.trim() || !Number(newForm.amount)}
                        className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2]"
                      >
                        {createExpense.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>{language === "sw" ? "Rekodi Gharama" : "Save Expense"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Case 2: Inline Selected Expense Details */}
              {!isAddingExpense && selectedExpense && (
                <Card className="border border-border bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {selectedExpense.title || "Expense Details"}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground">{getCategoryLabel(selectedExpense.category || "other")}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpenseToDeleteId(selectedExpense.id)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    <div className="rounded-xl bg-muted/30 p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("expenses.amount")}:</span>
                        <span className="text-lg font-bold text-foreground">{formatMoney(selectedExpense.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("expenses.date")}:</span>
                        <span className="font-semibold text-foreground">
                          {format(new Date(selectedExpense.date || selectedExpense.created_at || new Date()), "PPP")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("expenses.category")}:</span>
                        <span className="font-semibold text-foreground">{getCategoryLabel(selectedExpense.category || "other")}</span>
                      </div>
                      {selectedExpense.notes && (
                        <div className="pt-2 border-t border-border/60">
                          <span className="text-muted-foreground">{language === "sw" ? "Maelezo" : "Notes"}:</span>
                          <p className="mt-1 text-foreground">{selectedExpense.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab Content */}
        <TabsContent value="billing" className="m-0">
          <Billing />
        </TabsContent>
      </Tabs>

      {/* Delete Expense Confirm */}
      <AlertDialog open={!!expenseToDeleteId} onOpenChange={(o) => !o && setExpenseToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa gharama hii?" : "Delete this expense record?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => expenseToDeleteId && deleteExpense.mutate(expenseToDeleteId, { onSettled: () => setExpenseToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Futa" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
