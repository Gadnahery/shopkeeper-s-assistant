import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Calendar, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSales } from "@/hooks/useSales";
import { format } from "date-fns";

const categoryData = [
  { name: "Construction", value: 55, color: "hsl(160, 65%, 50%)" },
  { name: "Paints", value: 25, color: "hsl(36, 100%, 50%)" },
  { name: "Plumbing", value: 12, color: "hsl(220, 13%, 25%)" },
  { name: "Others", value: 8, color: "hsl(220, 14%, 80%)" },
];

export default function Reports() {
  const { t } = useLanguage();
  const { data: sales, isLoading } = useSales();

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const formatK = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  // Calculate totals
  const totalSales = sales?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
  const cashTotal = sales?.filter(s => s.payment_method === "Cash").reduce((sum, s) => sum + Number(s.total), 0) || 0;
  const mpesaTotal = sales?.filter(s => s.payment_method === "M-Pesa").reduce((sum, s) => sum + Number(s.total), 0) || 0;

  // Calculate best selling products from sale_items
  const productSales: Record<string, number> = {};
  sales?.forEach(sale => {
    (sale.sale_items as any[])?.forEach((item: any) => {
      productSales[item.product_name] = (productSales[item.product_name] || 0) + Number(item.total);
    });
  });

  const bestSellingProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], index) => ({
      name,
      amount,
      percentage: index === 0 ? 100 : Math.round((amount / (Object.values(productSales)[0] || 1)) * 100),
    }));

  const recentTransactions = sales?.slice(0, 5).map(sale => ({
    date: format(new Date(sale.created_at), "dd MMM, hh:mm a"),
    invoice: sale.invoice_number,
    customer: (sale.customers as any)?.name || t("sales.walkIn"),
    amount: Number(sale.total),
    payment: sale.payment_method,
    status: sale.status,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">This Month</span>
          </div>
          <Select defaultValue="sales">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">{t("reports.salesSummary")}</SelectItem>
              <SelectItem value="stock">{t("reports.stockReport")}</SelectItem>
              <SelectItem value="profit">{t("reports.profitLoss")}</SelectItem>
              <SelectItem value="customer">{t("reports.customerLedger")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            {t("reports.exportPdf")}
          </Button>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {t("reports.exportExcel")}
          </Button>
        </div>
      </div>

      {/* Sales Summary Card */}
      <Card>
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("reports.salesPeriod")}
          </p>
          <p className="mt-2 text-3xl font-bold">Tsh {formatNumber(totalSales)}</p>
          <div className="mt-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm font-medium">{formatNumber(cashTotal)}</span>
              <span className="text-sm text-muted-foreground">{t("sales.cash")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-secondary" />
              <span className="text-sm font-medium">{formatNumber(mpesaTotal)}</span>
              <span className="text-sm text-muted-foreground">{t("sales.mpesa")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Selling Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("reports.bestSelling")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : bestSellingProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
            ) : (
              bestSellingProducts.map((product) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-32 truncate text-sm">{product.name}</span>
                  <div className="flex-1">
                    <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${product.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-sm font-medium">
                    {formatK(product.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("reports.salesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{t("reports.recentTransactions")}</CardTitle>
        </CardHeader>
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
                  <TableHead>{t("sales.invoice")}</TableHead>
                  <TableHead>{t("reports.customer")}</TableHead>
                  <TableHead>Amount (TSH)</TableHead>
                  <TableHead>{t("reports.payment")}</TableHead>
                  <TableHead>{t("reports.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sales yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                      <TableCell className="font-medium">{tx.invoice}</TableCell>
                      <TableCell>{tx.customer}</TableCell>
                      <TableCell className="font-medium">{formatNumber(tx.amount)}</TableCell>
                      <TableCell>{tx.payment}</TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          {t("reports.completed")}
                        </Badge>
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
  );
}
