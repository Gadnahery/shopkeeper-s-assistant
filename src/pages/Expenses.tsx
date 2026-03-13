import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Search, Plus, TrendingUp, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses, useExpenseCategories, useCreateExpense, useUpdateExpense, useExpenseStats, useDeleteExpense } from "@/hooks/useExpenses";
import { useDraftForm } from "@/hooks/useDraftForm";
import { format } from "date-fns";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";

export default function Expenses() {
  const { t, language } = useLanguage();
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

  const filteredExpenses = expenses?.filter(
    (e) => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const getCategoryName = (cat: any) => language === "sw" && cat?.name_sw ? cat.name_sw : cat?.name || "";
  
  // Get translated category name
  const getCategoryLabel = (categoryName: string) => {
    const categoryMap: Record<string, string> = {
      "Utilities": language === "sw" ? "Huduma" : "Utilities",
      "Rent": language === "sw" ? "Kodi" : "Rent",
      "Transport": language === "sw" ? "Usafiri" : "Transport",
      "Food": language === "sw" ? "Chakula" : "Food",
      "Office": language === "sw" ? "Ofisi" : "Office",
      "Stock Purchase": language === "sw" ? "Ununuzi wa Stoki" : "Stock Purchase",
    };
    return categoryMap[categoryName] || categoryName;
  };
  
  // Calculate category breakdown with percentages
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
    await createExpense.mutateAsync({ description: newExpense.description, category: newExpense.category.trim(), amount: parseFloat(newExpense.amount) });
    clearAddExpenseDraft();
    setAddExpenseOpen(false);
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    await updateExpense.mutateAsync({ id: editingExpense.id, description: editingExpense.description, category: editingExpense.category, amount: parseFloat(editingExpense.amount) || 0 });
    setEditingExpense(null);
  };

  const statsCards = [
    { label: t("expenses.totalExpenses"), value: `Tsh ${formatNumber(stats?.total || 0)}` },
    { label: t("expenses.operationalCosts"), value: `Tsh ${formatNumber((stats?.byCategory?.["Utilities"] || 0) + (stats?.byCategory?.["Rent"] || 0))}`, subtitle: t("expenses.utilitiesRent") },
    { label: t("expenses.stockPurchases"), value: `Tsh ${formatNumber(stats?.byCategory?.["Stock Purchase"] || 0)}` },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={t("expenses.title")}
        subtitle={language === "sw" ? "Fuatilia matumizi ya kila siku, makundi ya gharama, na mwenendo wa matumizi." : "Track day-to-day costs, spending categories, and expense trends in a cleaner layout."}
        actions={
          <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="h-4 w-4" />{t("expenses.addNewExpense")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card key={index} className="section-shell">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-foreground/80">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground dark:text-foreground">{stat.value}</p>
              {stat.subtitle && <p className="mt-1 text-sm text-foreground/70 dark:text-foreground/80">{stat.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(o) => !o && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.edit")} {language === "sw" ? "Matumizi" : "Expense"}</DialogTitle></DialogHeader>
          {editingExpense && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("expenses.description")}</Label><Input value={editingExpense.description} onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("expenses.category")}</Label><Input placeholder={language === "sw" ? "Kategoria" : "Category"} value={editingExpense.category} onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })} list="edit-expense-category-list" /><datalist id="edit-expense-category-list">{categories?.map((cat) => <option key={cat.id} value={cat.name} />)}</datalist></div>
              <div className="space-y-2"><Label>{t("expenses.amount")}</Label><Input type="number" value={editingExpense.amount} onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })} /></div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" 
                onClick={handleEditExpense} 
                disabled={updateExpense.isPending}
              >
                {updateExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("expenses.recentExpenses")}</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
              <Input placeholder={t("expenses.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <Card className="section-shell overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-foreground/70 dark:text-foreground/80">{expenses?.length === 0 ? (language === "sw" ? "Hakuna matumizi bado." : "No expenses yet.") : (language === "sw" ? "Hakuna matokeo." : "No match.")}</TableCell></TableRow>
                    ) : filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-foreground/70 dark:text-foreground/80">{format(new Date(expense.date), "dd MMM, yyyy")}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                        <TableCell className="font-medium">{formatNumber(expense.amount)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => setEditingExpense({ ...expense })}>
                              <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setExpenseToDeleteId(expense.id)}>
                              <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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

        <Dialog open={addExpenseOpen} onOpenChange={(open) => { setAddExpenseOpen(open); if (!open) clearAddExpenseDraft(); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("expenses.addNewExpense")}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>{t("expenses.expenseTitle")}</Label><Input placeholder={t("expenses.expensePlaceholder")} value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("expenses.category")}</Label>
                <Input
                  placeholder={language === "sw" ? "Andika kategoria yako (mf. Huduma, Kodi, Chakula)" : "Type your own category (e.g. Utilities, Rent, Food)"}
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  list="expense-category-suggestions"
                />
                <datalist id="expense-category-suggestions">
                  {categories?.map((cat) => <option key={cat.id} value={cat.name} />) || (
                    <><option value="Utilities" /><option value="Rent" /><option value="Transport" /><option value="Food" /><option value="Stock Purchase" /><option value="Office" /></>
                  )}
                </datalist>
              </div>
              <div className="space-y-2"><Label>{t("expenses.amountTsh")}</Label><Input type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} /></div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { clearAddExpenseDraft(); setAddExpenseOpen(false); }}>{t("common.cancel")}</Button>
                <Button 
                  className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
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

        {categoryBreakdown.length > 0 && (
            <Card className="section-shell">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                  {t("expenses.categoryBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryBreakdown.map((item, index) => {
                  const colors = [
                    "bg-teal-500",
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-orange-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                  ];
                  const color = colors[index % colors.length];
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${color} dark:shadow-[0_0_4px_rgba(59,130,246,0.3)]`} />
                          <span className="text-sm font-medium text-foreground dark:text-foreground">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground/60 dark:text-foreground/70">{item.percentage.toFixed(1)}%</span>
                          <span className="text-sm font-semibold text-foreground dark:text-foreground">{formatNumber(item.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${color} transition-all duration-500 rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
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
