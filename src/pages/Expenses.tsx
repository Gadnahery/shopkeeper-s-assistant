import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
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
  BarChart3,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, type Expense } from "@/hooks/useExpenses";
import { useSalesByDateRange } from "@/hooks/useSales";
import { usePurchases } from "@/hooks/usePurchases";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import Billing from "@/pages/Billing";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";
import { useOtherIncome } from "@/hooks/useOtherIncome";
import { OtherIncomePanel } from "@/components/finance/OtherIncomePanel";

function safeFormatDate(value: any, pattern: string, fallback = "—"): string {
  if (!value) return fallback;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return fallback;
    return format(d, pattern);
  } catch {
    return fallback;
  }
}

const EXPENSE_CATEGORIES = [
  { value: "rent", labelEn: "Rent / Premises", labelSw: "Kodi ya Pango" },
  { value: "utilities", labelEn: "Electricity / Water", labelSw: "Umeme / Maji" },
  { value: "salaries", labelEn: "Salaries / Wages", labelSw: "Mishahara" },
  { value: "transport", labelEn: "Transport / Fuel", labelSw: "Usafiri / Mafuta" },
  { value: "marketing", labelEn: "Marketing / Ads", labelSw: "Masoko / Matangazo" },
  { value: "supplies", labelEn: "Office / Shop Supplies", labelSw: "Vifaa vya Ofisi" },
  { value: "maintenance", labelEn: "Repairs / Maintenance", labelSw: "Ukarabati" },
  { value: "other", labelEn: "Other Expenses", labelSw: "Gharama Nyingine" },
];

export default function Expenses() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const { shopId } = useAuth();
  const { isMobile } = useAdaptiveLayout();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("expenses");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mobilePage, setMobilePage] = useState(1);

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isAddingExpense, setIsAddingExpense] = useState(searchParams.get("new") === "true");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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
  const { data: otherIncome = [], isLoading: otherIncomeLoading } = useOtherIncome();
  const { data: salesList } = useSalesByDateRange(
    format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    format(new Date(), "yyyy-MM-dd")
  );
  const { data: purchasesList } = usePurchases();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Edit Expense Form State
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    title: "",
    category: "rent",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const handleStartEditExpense = (e?: Expense) => {
    const target = e || selectedExpense;
    if (!target) return;
    setEditForm({
      id: target.id,
      title: target.title || "",
      category: target.category || "rent",
      amount: String(target.amount || ""),
      date: target.date ? target.date.slice(0, 10) : format(new Date(), "yyyy-MM-dd"),
      notes: target.notes || "",
    });
    setIsEditingExpense(true);
    setIsAddingExpense(false);
    if (isMobile) setMobileDrawerOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (!editForm.title.trim() || !Number(editForm.amount)) {
      toast.error(language === "sw" ? "Jaza jina na kiasi cha matumizi" : "Please fill in title and amount");
      return;
    }
    try {
      const updated = await updateExpense.mutateAsync({
        id: editForm.id,
        title: editForm.title.trim(),
        category: editForm.category,
        amount: Number(editForm.amount),
        date: editForm.date,
        notes: editForm.notes.trim() || undefined,
      } as any);
      toast.success(language === "sw" ? "Gharama imesasishwa" : "Expense updated successfully");
      setIsEditingExpense(false);
      setMobileDrawerOpen(false);
      if (updated) setSelectedExpense(updated);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update expense");
    }
  };

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

  useEffect(() => {
    setMobilePage(1);
  }, [searchTerm, categoryFilter]);

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

  const MOBILE_PAGE_SIZE = 4;
  const totalMobilePages = Math.ceil(filteredExpenses.length / MOBILE_PAGE_SIZE) || 1;
  const currentMobileExpenses = useMemo(() => {
    const start = (mobilePage - 1) * MOBILE_PAGE_SIZE;
    return filteredExpenses.slice(start, start + MOBILE_PAGE_SIZE);
  }, [filteredExpenses, mobilePage]);

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

  // Profit KPI calculations
  const totalRevenue = useMemo(() => {
    const sales = (salesList || []).reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const other = (otherIncome || []).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    return sales + other;
  }, [salesList, otherIncome]);

  const totalCOGS = useMemo(() => {
    return (purchasesList || []).reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  }, [purchasesList]);

  const grossProfit = Math.max(0, totalRevenue - totalCOGS);
  const netProfit = Math.max(0, grossProfit - totalAmount);
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  if (expenses === undefined || isLoading || otherIncomeLoading) {
    return <PageLoader message="Loading expenses..." messageSw="Inapakia matumizi..." language={language} />;
  }

  const handleSelectExpense = (e: Expense) => {
    setSelectedExpense(e);
    setIsAddingExpense(false);
    setIsEditingExpense(false);
    if (isMobile) setMobileDrawerOpen(true);
  };

  const handleStartAddExpense = () => {
    setIsAddingExpense(true);
    setIsEditingExpense(false);
    setSelectedExpense(null);
    if (isMobile) setMobileDrawerOpen(true);
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
      setMobileDrawerOpen(false);
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

  const renderAddExpenseForm = () => (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" />
          <span>{t("expenses.addExpense")}</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsAddingExpense(false);
            setMobileDrawerOpen(false);
          }}
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
          <Button
            variant="outline"
            onClick={() => {
              setIsAddingExpense(false);
              setMobileDrawerOpen(false);
            }}
            className="h-9 rounded-xl text-xs flex-1"
          >
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
  );

  const renderEditExpenseForm = () => {
    if (!selectedExpense) return null;
    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Pencil className="h-4 w-4 text-accent" />
            <span>{language === "sw" ? "Hariri Gharama" : "Edit Expense"}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditingExpense(false)}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{language === "sw" ? "Jina la Gharama" : "Expense Title"} *</Label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="h-9 rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("expenses.category")}</Label>
              <Select
                value={editForm.category}
                onValueChange={(val) => setEditForm({ ...editForm, category: val })}
              >
                <SelectTrigger className="h-9 rounded-xl border-border bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
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
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="h-9 rounded-xl border-border bg-background text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t("expenses.date")}</Label>
            <Input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="h-9 rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">{language === "sw" ? "Maelezo ya Ziada" : "Notes"}</Label>
            <Input
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="h-9 rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditingExpense(false)}
              className="h-9 rounded-xl text-xs flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUpdateExpense}
              disabled={updateExpense.isPending || !editForm.title.trim() || !Number(editForm.amount)}
              className="h-9 rounded-xl bg-neutral-950 text-xs font-bold text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 flex-[2]"
            >
              {updateExpense.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              <span>{language === "sw" ? "Sasisha Gharama" : "Update Expense"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderExpenseDetail = () => {
    if (!selectedExpense) return null;
    if (isEditingExpense) return renderEditExpenseForm();

    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              {selectedExpense.title || "Expense Details"}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">{getCategoryLabel(selectedExpense.category || "other")}</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStartEditExpense(selectedExpense)}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title={language === "sw" ? "Hariri" : "Edit"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpenseToDeleteId(selectedExpense.id)}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title={language === "sw" ? "Futa" : "Delete"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedExpense(null);
                setMobileDrawerOpen(false);
              }}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                {safeFormatDate(selectedExpense.date || selectedExpense.created_at, "PPP")}
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

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartEditExpense(selectedExpense)}
              className="w-full gap-1.5 rounded-xl border-border text-xs font-semibold"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{language === "sw" ? "Hariri Taarifa za Gharama" : "Edit Expense Information"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{t("expenses.totalExpenses")}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalAmount)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{expenses?.length || 0} {language === "sw" ? "miamala" : "transactions"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Mwezi Huu" : "This Month"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(thisMonthExpenses)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{format(new Date(), "MMMM yyyy")}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Gharama Kuu" : "Top Category"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-sm sm:text-xl font-bold tracking-tight text-foreground truncate">
              {categoryBreakdown.length > 0 ? getCategoryLabel(categoryBreakdown[0].cat) : "-"}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
              {categoryBreakdown.length > 0 ? formatMoney(categoryBreakdown[0].total) : "0"}
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Makundi" : "Categories"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{categoryBreakdown.length}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Makundi yaliyotumika" : "Active categories"}</p>
          </div>
        </Card>
      </div>

      {/* Main Tabs (Expenses vs Billing Plans) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto no-scrollbar mb-4">
          <TabsList className="bg-muted p-1 rounded-xl inline-flex w-auto min-w-full sm:w-auto">
            <TabsTrigger value="expenses" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs whitespace-nowrap">
              {t("expenses.title")}
            </TabsTrigger>
            <TabsTrigger value="profit" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs whitespace-nowrap">
              {language === "sw" ? "Faida" : "Profit"}
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs whitespace-nowrap">
              {language === "sw" ? "Bili na Vifurushi" : "Billing"}
            </TabsTrigger>
            <TabsTrigger value="income" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs whitespace-nowrap">
              {language === "sw" ? "Mapato Mengine" : "Other Income"}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profit Breakdown Tab */}
        <TabsContent value="profit" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* P&L Statement */}
            <div className="page-section">
              <div className="border-b border-border px-5 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {language === "sw" ? "Taarifa ya Faida na Hasara" : "Profit & Loss Statement"}
                </h3>
              </div>
              <div className="p-5">
                <div className="profit-row">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{language === "sw" ? "Mapato ya Mauzo" : "Sales Revenue"}</p>
                    <p className="text-xs text-muted-foreground">{language === "sw" ? "Mwaka huu" : "Year to date"}</p>
                  </div>
                  <span className="money-display-sm text-emerald-600">{formatMoney(totalRevenue)}</span>
                </div>
                <div className="profit-row">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{language === "sw" ? "Gharama za Bidhaa (COGS)" : "Cost of Goods (COGS)"}</p>
                    <p className="text-xs text-muted-foreground">{language === "sw" ? "Manunuzi yote" : "All purchases"}</p>
                  </div>
                  <span className="money-display-sm text-rose-600">-{formatMoney(totalCOGS)}</span>
                </div>
                <div className="profit-row bg-muted/30 rounded-lg px-3 -mx-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{language === "sw" ? "Faida ya Jumla" : "Gross Profit"}</p>
                    <p className="text-xs text-muted-foreground">{grossMargin}% {language === "sw" ? "ukingo" : "margin"}</p>
                  </div>
                  <span className="money-display-sm font-bold">{formatMoney(grossProfit)}</span>
                </div>
                <div className="profit-row">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{language === "sw" ? "Matumizi ya Uendeshaji" : "Operating Expenses"}</p>
                    <p className="text-xs text-muted-foreground">{expenses?.length || 0} {language === "sw" ? "gharama" : "entries"}</p>
                  </div>
                  <span className="money-display-sm text-rose-600">-{formatMoney(totalAmount)}</span>
                </div>
                <div className="profit-row bg-primary/5 rounded-lg px-3 -mx-2 border border-primary/20">
                  <div>
                    <p className="text-sm font-bold text-foreground">{language === "sw" ? "Faida Halisi" : "Net Profit"}</p>
                    <p className="text-xs text-muted-foreground">{netMargin}% {language === "sw" ? "ukingo" : "margin"}</p>
                  </div>
                  <span className="money-display-sm font-bold text-emerald-600">{formatMoney(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="page-section">
              <div className="border-b border-border px-5 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {language === "sw" ? "Gharama kwa Aina" : "Expenses by Category"}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {categoryBreakdown.length === 0 ? (
                  <div className="empty-state py-8">
                    <div className="empty-state-icon"><BarChart3 className="h-7 w-7" /></div>
                    <p className="text-sm font-medium text-foreground">{language === "sw" ? "Hakuna data" : "No data yet"}</p>
                  </div>
                ) : (
                  categoryBreakdown.map(({ cat, total }) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{getCategoryLabel(cat)}</span>
                        <span className="text-xs font-bold text-foreground">{formatMoney(total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (total / totalAmount) * 100).toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="m-0 space-y-6">
          {/* 2-Column Master-Detail Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Master Expenses Table / List */}
            <div className="space-y-4 lg:col-span-7">
              <Card className="border border-border bg-card shadow-xs">
                <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
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
                    onClick={handleStartAddExpense}
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
                      onClick={handleStartAddExpense}
                      className="mt-3 h-8 rounded-xl text-xs bg-primary text-primary-foreground"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5 text-accent" />
                      {t("expenses.addExpense")}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile View: 4 Compact Cards per page */}
                    <div className="md:hidden">
                      <div className="divide-y divide-border/60">
                        {currentMobileExpenses.map((exp) => {
                          const isSelected = selectedExpense?.id === exp.id && !isAddingExpense;

                          return (
                            <div
                              key={exp.id}
                              onClick={() => handleSelectExpense(exp)}
                              className={cn(
                                "flex items-center justify-between p-3.5 transition-colors active:bg-muted/60 cursor-pointer",
                                isSelected ? "bg-accent/10" : ""
                              )}
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="font-semibold text-xs text-foreground truncate">
                                  {exp.title || (language === "sw" ? "Gharama" : "Expense")}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                  <span>{safeFormatDate(exp.date || exp.created_at, "MMM d")}</span>
                                  <span>•</span>
                                  <span className="badge-neutral text-[10px] px-1.5 py-0">{getCategoryLabel(exp.category || "other")}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-bold text-xs text-foreground">
                                  {formatMoney(exp.amount)}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalMobilePages > 1 && (
                        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={mobilePage <= 1}
                            onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                            className="h-7 px-2.5 text-[11px]"
                          >
                            {language === "sw" ? "Iliyopita" : "Previous"}
                          </Button>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {mobilePage} / {totalMobilePages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={mobilePage >= totalMobilePages}
                            onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                            className="h-7 px-2.5 text-[11px]"
                          >
                            {language === "sw" ? "Inayofuata" : "Next"}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Desktop View: Full Master Table */}
                    <div className="internal-table-scroll hidden md:block">
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
                            const isSelected = selectedExpense?.id === exp.id && !isAddingExpense && !isEditingExpense;

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
                                  {safeFormatDate(exp.date || exp.created_at, "MMM d, yyyy")}
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
                  </>
                )}
              </Card>
            </div>

            {/* Desktop Right Column: Inline Detail / Add Panel */}
            <div className="hidden lg:block lg:col-span-5 space-y-4">
              {isAddingExpense && renderAddExpenseForm()}
              {isEditingExpense && renderEditExpenseForm()}
              {!isAddingExpense && !isEditingExpense && selectedExpense && renderExpenseDetail()}
            </div>
          </div>
        </TabsContent>

        {/* Billing Tab Content */}
        <TabsContent value="billing" className="m-0">
          <Billing />
        </TabsContent>

        <TabsContent value="income" className="m-0 space-y-6">
          <OtherIncomePanel income={otherIncome} />
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Sheet for Adding / Viewing Expense */}
      <Sheet open={Boolean(isMobile && mobileDrawerOpen)} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 border-t border-border bg-card lg:hidden">
          <div className="p-1">
            {isAddingExpense && renderAddExpenseForm()}
            {isEditingExpense && renderEditExpenseForm()}
            {!isAddingExpense && !isEditingExpense && selectedExpense && renderExpenseDetail()}
          </div>
        </SheetContent>
      </Sheet>

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
