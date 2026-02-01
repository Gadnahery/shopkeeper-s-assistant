import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, TrendingUp, MoreHorizontal, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useExpenses, useExpenseCategories, useCreateExpense, useExpenseStats, useDeleteExpense } from "@/hooks/useExpenses";
import { format } from "date-fns";

export default function Expenses() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [newExpense, setNewExpense] = useState({
    description: "",
    category: "Utilities",
    amount: "",
    payMethod: "Cash",
  });

  const { data: expenses, isLoading } = useExpenses();
  const { data: categories } = useExpenseCategories();
  const { data: stats } = useExpenseStats();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const filteredExpenses = expenses?.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    await createExpense.mutateAsync({
      description: newExpense.description,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
    });
    
    setNewExpense({ description: "", category: "Utilities", amount: "", payMethod: "Cash" });
  };

  const getCategoryName = (cat: typeof categories extends (infer T)[] ? T : never) => {
    if (!cat) return "";
    return language === "sw" && cat.name_sw ? cat.name_sw : cat.name;
  };

  const statsCards = [
    { 
      label: t("expenses.totalExpenses"), 
      value: `Tsh ${formatNumber(stats?.total || 0)}`, 
      trend: "+12% vs last month", 
      trendUp: true 
    },
    { 
      label: t("expenses.operationalCosts"), 
      value: `Tsh ${formatNumber((stats?.byCategory?.["Utilities"] || 0) + (stats?.byCategory?.["Rent"] || 0))}`, 
      subtitle: t("expenses.utilitiesRent") 
    },
    { 
      label: t("expenses.stockPurchases"), 
      value: `Tsh ${formatNumber(stats?.byCategory?.["Stock Purchase"] || 0)}`, 
      subtitle: `5 ${t("expenses.pendingInvoices")}`, 
      subtitleColor: "text-destructive" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("expenses.title")}</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              {stat.trend && (
                <p className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </p>
              )}
              {stat.subtitle && (
                <p className={`mt-1 text-sm ${stat.subtitleColor || "text-primary"}`}>
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expenses Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("expenses.recentExpenses")}</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("expenses.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("expenses.date")}</TableHead>
                      <TableHead>{t("expenses.description")}</TableHead>
                      <TableHead>{t("expenses.category")}</TableHead>
                      <TableHead>{t("expenses.amount")}</TableHead>
                      <TableHead className="w-10">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {expenses?.length === 0 ? "No expenses yet. Record your first expense!" : "No expenses match your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(expense.date), "dd MMM, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatNumber(expense.amount)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => deleteExpense.mutate(expense.id)}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Add New Expense */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{t("expenses.addNewExpense")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Select 
                  value={newExpense.category}
                  onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {getCategoryName(cat)}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="Utilities">{t("expenseCategory.utilities")}</SelectItem>
                        <SelectItem value="Rent">{t("expenseCategory.rent")}</SelectItem>
                        <SelectItem value="Transport">{t("expenseCategory.transport")}</SelectItem>
                        <SelectItem value="Food">{t("expenseCategory.food")}</SelectItem>
                        <SelectItem value="Office">{t("expenseCategory.office")}</SelectItem>
                        <SelectItem value="Stock Purchase">{t("expenseCategory.stock")}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label>{t("expenses.paymentMethod")}</Label>
                <Select 
                  value={newExpense.payMethod}
                  onValueChange={(v) => setNewExpense({ ...newExpense, payMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">{t("sales.cash")}</SelectItem>
                    <SelectItem value="M-Pesa">{t("sales.mpesa")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full gap-2 bg-secondary hover:bg-secondary/90"
                onClick={handleAddExpense}
                disabled={!newExpense.description || !newExpense.amount || createExpense.isPending}
              >
                {createExpense.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t("expenses.saveExpense")}
              </Button>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{t("expenses.categoryBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.byCategory && Object.entries(stats.byCategory).map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-primary" />
                    <span className="text-sm">{name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatNumber(amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
