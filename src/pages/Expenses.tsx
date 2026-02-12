import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, TrendingUp, Pencil, Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses, useExpenseCategories, useCreateExpense, useUpdateExpense, useExpenseStats, useDeleteExpense } from "@/hooks/useExpenses";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Expenses() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [newExpense, setNewExpense] = useState({ description: "", category: "Utilities", amount: "", payMethod: "Cash" });

  const { data: expenses, isLoading } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: stats } = useExpenseStats();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const filteredExpenses = expenses?.filter(
    (e) => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatNumber = (num: number) => num.toLocaleString("en-US");
  const getCategoryName = (cat: any) => language === "sw" && cat?.name_sw ? cat.name_sw : cat?.name || "";

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    await createExpense.mutateAsync({ description: newExpense.description, category: newExpense.category, amount: parseFloat(newExpense.amount) });
    setNewExpense({ description: "", category: "Utilities", amount: "", payMethod: "Cash" });
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;
    await updateExpense.mutateAsync({ id: editingExpense.id, description: editingExpense.description, category: editingExpense.category, amount: parseFloat(editingExpense.amount) || 0 });
    setEditingExpense(null);
  };

  const statsCards = [
    { label: t("expenses.totalExpenses"), value: `Tsh ${formatNumber(stats?.total || 0)}`, trend: "+12% vs last month", trendUp: true },
    { label: t("expenses.operationalCosts"), value: `Tsh ${formatNumber((stats?.byCategory?.["Utilities"] || 0) + (stats?.byCategory?.["Rent"] || 0))}`, subtitle: t("expenses.utilitiesRent") },
    { label: t("expenses.stockPurchases"), value: `Tsh ${formatNumber(stats?.byCategory?.["Stock Purchase"] || 0)}`, subtitle: `5 ${t("expenses.pendingInvoices")}`, subtitleColor: "text-destructive" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">{t("expenses.title")}</h1></div>

      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              {stat.trend && <p className="mt-1 flex items-center gap-1 text-sm text-destructive"><TrendingUp className="h-3 w-3" />{stat.trend}</p>}
              {stat.subtitle && <p className={`mt-1 text-sm ${stat.subtitleColor || "text-primary"}`}>{stat.subtitle}</p>}
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
              <div className="space-y-2"><Label>{t("expenses.category")}</Label><Input value={editingExpense.category} onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("expenses.amount")}</Label><Input type="number" value={editingExpense.amount} onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })} /></div>
              <Button className="w-full" onClick={handleEditExpense} disabled={updateExpense.isPending}>
                {updateExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("expenses.recentExpenses")}</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("expenses.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
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
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{expenses?.length === 0 ? "No expenses yet." : "No match."}</TableCell></TableRow>
                    ) : filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-muted-foreground">{format(new Date(expense.date), "dd MMM, yyyy")}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                        <TableCell className="font-medium">{formatNumber(expense.amount)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingExpense({ ...expense })}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteExpense.mutate(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4"><CardTitle className="text-base">{t("expenses.addNewExpense")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>{t("expenses.expenseTitle")}</Label><Input placeholder={t("expenses.expensePlaceholder")} value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("expenses.category")}</Label>
                <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => <SelectItem key={cat.id} value={cat.name}>{getCategoryName(cat)}</SelectItem>) || (
                      <><SelectItem value="Utilities">{t("expenseCategory.utilities")}</SelectItem><SelectItem value="Rent">{t("expenseCategory.rent")}</SelectItem><SelectItem value="Transport">{t("expenseCategory.transport")}</SelectItem><SelectItem value="Food">{t("expenseCategory.food")}</SelectItem><SelectItem value="Stock Purchase">{t("expenseCategory.stock")}</SelectItem></>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("expenses.amountTsh")}</Label><Input type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} /></div>
              <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90" onClick={handleAddExpense} disabled={!newExpense.description || !newExpense.amount || createExpense.isPending}>
                {createExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("expenses.saveExpense")}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4"><CardTitle className="text-base">{t("expenses.categoryBreakdown")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {stats?.byCategory && Object.entries(stats.byCategory).map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-primary" /><span className="text-sm">{name}</span></div>
                  <span className="text-sm font-medium">{formatNumber(amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
