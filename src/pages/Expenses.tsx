import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Loader2, Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useExpenses,
  useExpenseCategories,
  useCreateExpense,
  useUpdateExpense,
  useExpenseStats,
  useDeleteExpense,
} from "@/hooks/useExpenses";
import { useDraftForm } from "@/hooks/useDraftForm";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { cn } from "@/lib/utils";

export default function Expenses() {
  const { t, language } = useLanguage();
  const { isMobile } = useAdaptiveLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const initialNewExpense = { description: "", category: "", amount: "", payMethod: "Cash" };
  const [newExpense, setNewExpense, clearAddExpenseDraft] = useDraftForm("add-expense", initialNewExpense);

  const { data: expenses, isLoading } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: stats } = useExpenseStats();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  if (expenses === undefined || isLoading) {
    return <PageLoader message="Loading expenses..." messageSw="Inapakia matumizi..." language={language} />;
  }

  const filteredExpenses =
    expenses?.filter(
      (expense) =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const getCategoryLabel = (categoryName: string) => {
    const categoryMap: Record<string, string> = {
      Utilities: language === "sw" ? "Huduma" : "Utilities",
      Rent: language === "sw" ? "Kodi" : "Rent",
      Transport: language === "sw" ? "Usafiri" : "Transport",
      Food: language === "sw" ? "Chakula" : "Food",
      Office: language === "sw" ? "Ofisi" : "Office",
      "Stock Purchase": language === "sw" ? "Ununuzi wa Stoki" : "Stock Purchase",
    };
    return categoryMap[categoryName] || categoryName;
  };

  const categoryBreakdown = stats?.byCategory
    ? Object.entries(stats.byCategory)
        .map(([name, amount]) => ({
          name,
          label: getCategoryLabel(name),
          amount: Number(amount),
          percentage: stats.total > 0 ? (Number(amount) / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
    : [];

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.category.trim() || !newExpense.amount) return;
    await createExpense.mutateAsync({
      description: newExpense.description,
      category: newExpense.category.trim(),
      amount: parseFloat(newExpense.amount),
    });
    clearAddExpenseDraft();
    setAddExpenseOpen(false);
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    await updateExpense.mutateAsync({
      id: editingExpense.id,
      description: editingExpense.description,
      category: editingExpense.category,
      amount: parseFloat(editingExpense.amount) || 0,
    });
    setEditingExpense(null);
  };

  const statsCards = [
    { label: t("expenses.totalExpenses"), value: `Tsh ${formatNumber(stats?.total || 0)}` },
    {
      label: t("expenses.operationalCosts"),
      value: `Tsh ${formatNumber((stats?.byCategory?.Utilities || 0) + (stats?.byCategory?.Rent || 0))}`,
      subtitle: t("expenses.utilitiesRent"),
    },
    { label: t("expenses.stockPurchases"), value: `Tsh ${formatNumber(stats?.byCategory?.["Stock Purchase"] || 0)}` },
  ];

  const expenseFormFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("expenses.expenseTitle")}</Label>
        <Input
          placeholder={t("expenses.expensePlaceholder")}
          value={newExpense.description}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("expenses.category")}</Label>
        <Input
          placeholder={
            language === "sw"
              ? "Andika kategoria yako (mf. Huduma, Kodi, Chakula)"
              : "Type your own category (e.g. Utilities, Rent, Food)"
          }
          value={newExpense.category}
          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
          list="expense-category-suggestions"
        />
        <datalist id="expense-category-suggestions">
          {categories?.map((category) => <option key={category.id} value={category.name} />) || (
            <>
              <option value="Utilities" />
              <option value="Rent" />
              <option value="Transport" />
              <option value="Food" />
              <option value="Stock Purchase" />
              <option value="Office" />
            </>
          )}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label>{t("expenses.amountTsh")}</Label>
        <Input
          type="number"
          placeholder="0.00"
          value={newExpense.amount}
          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={t("expenses.title")}
        subtitle={
          language === "sw"
            ? "Andika matumizi muhimu kwa haraka, kisha fuatilia mwenendo wake bila kubanana kwenye simu."
            : "Capture the important expenses fast, then review trends in a layout that stays calm on mobile."
        }
        actions={
          <Button
            className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-blue-700 dark:shadow-teal-500/30"
            onClick={() => setAddExpenseOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t("expenses.addNewExpense")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="section-shell">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/80">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground dark:text-foreground">{stat.value}</p>
              {stat.subtitle ? <p className="mt-1 text-sm text-foreground/70 dark:text-foreground/80">{stat.subtitle}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")} {language === "sw" ? "Matumizi" : "Expense"}</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("expenses.description")}</Label>
                <Input value={editingExpense.description} onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("expenses.category")}</Label>
                <Input
                  placeholder={language === "sw" ? "Kategoria" : "Category"}
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  list="edit-expense-category-list"
                />
                <datalist id="edit-expense-category-list">{categories?.map((category) => <option key={category.id} value={category.name} />)}</datalist>
              </div>
              <div className="space-y-2">
                <Label>{t("expenses.amount")}</Label>
                <Input type="number" value={editingExpense.amount} onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })} />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 font-semibold text-white shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-blue-700 dark:shadow-teal-500/30"
                onClick={handleEditExpense}
                disabled={updateExpense.isPending}
              >
                {updateExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!expenseToDeleteId} onOpenChange={(open) => !open && setExpenseToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => expenseToDeleteId && deleteExpense.mutate(expenseToDeleteId, { onSettled: () => setExpenseToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMobile ? (
        <Drawer open={addExpenseOpen} onOpenChange={(open) => { setAddExpenseOpen(open); if (!open) clearAddExpenseDraft(); }}>
          <DrawerContent className="max-h-[90vh] rounded-t-[1.6rem]">
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("expenses.addNewExpense")}</DrawerTitle>
              <DrawerDescription>
                {language === "sw" ? "Andika maelezo muhimu pekee ili kukamilisha matumizi kwa haraka." : "Capture only the important details so this stays quick on mobile."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-2">
              {expenseFormFields}
            </div>
            <DrawerFooter>
              <Button
                className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 font-semibold text-white hover:from-teal-600 hover:to-blue-700"
                onClick={handleAddExpense}
                disabled={!newExpense.description || !newExpense.category.trim() || !newExpense.amount || createExpense.isPending}
              >
                {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("expenses.saveExpense")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { clearAddExpenseDraft(); setAddExpenseOpen(false); }}>
                {t("common.cancel")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={addExpenseOpen} onOpenChange={(open) => { setAddExpenseOpen(open); if (!open) clearAddExpenseDraft(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("expenses.addNewExpense")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {expenseFormFields}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { clearAddExpenseDraft(); setAddExpenseOpen(false); }}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:from-teal-600 hover:to-blue-700 dark:shadow-teal-500/30"
                  onClick={handleAddExpense}
                  disabled={!newExpense.description || !newExpense.category.trim() || !newExpense.amount || createExpense.isPending}
                >
                  {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {t("expenses.saveExpense")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className={cn("grid gap-6", !isMobile && "lg:grid-cols-3")}>
        <div className={cn("space-y-4", !isMobile && "lg:col-span-2")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">{t("expenses.recentExpenses")}</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70" />
              <Input placeholder={t("expenses.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <Card className="section-shell overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : isMobile ? (
                <div className="grid gap-3 p-4">
                  {filteredExpenses.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/60 px-4 py-8 text-center text-sm text-muted-foreground">
                      {expenses?.length === 0 ? (language === "sw" ? "Hakuna matumizi bado." : "No expenses yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}
                    </div>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <Card key={expense.id} className="border-border/70 bg-background/70 shadow-sm">
                        <CardContent className="space-y-4 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{expense.description}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "dd MMM, yyyy")}</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">Tsh {formatNumber(expense.amount)}</p>
                          </div>

                          <Badge variant="secondary" className="rounded-full">
                            {getCategoryLabel(expense.category)}
                          </Badge>

                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="gap-2" onClick={() => setEditingExpense({ ...expense })}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                              {t("common.edit")}
                            </Button>
                            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setExpenseToDeleteId(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                              {t("common.delete")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("expenses.date")}</TableHead>
                        <TableHead>{t("expenses.description")}</TableHead>
                        <TableHead>{t("expenses.category")}</TableHead>
                        <TableHead>{t("expenses.amount")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-foreground/70 dark:text-foreground/80">
                            {expenses?.length === 0 ? (language === "sw" ? "Hakuna matumizi bado." : "No expenses yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="text-foreground/70 dark:text-foreground/80">{format(new Date(expense.date), "dd MMM, yyyy")}</TableCell>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell><Badge variant="secondary">{getCategoryLabel(expense.category)}</Badge></TableCell>
                            <TableCell className="font-medium">{formatNumber(expense.amount)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => setEditingExpense({ ...expense })}>
                                  <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setExpenseToDeleteId(expense.id)}>
                                  <Trash2 className="h-4 w-4" />
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
        </div>

        {categoryBreakdown.length > 0 && (
          <Card className="section-shell">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t("expenses.categoryBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryBreakdown.map((item, index) => {
                const colors = [
                  "bg-teal-500",
                  "bg-blue-500",
                  "bg-orange-500",
                  "bg-pink-500",
                  "bg-indigo-500",
                  "bg-emerald-500",
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        <span className="text-sm font-medium text-foreground dark:text-foreground">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground/60 dark:text-foreground/70">{item.percentage.toFixed(1)}%</span>
                        <span className="text-sm font-semibold text-foreground dark:text-foreground">{formatNumber(item.amount)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
