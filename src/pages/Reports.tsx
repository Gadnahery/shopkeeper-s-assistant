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
import { Calendar, FileText, FileSpreadsheet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const bestSellingProducts = [
  { name: "Cement 50kg", amount: 2450000, percentage: 100 },
  { name: "Wall Paint (White)", amount: 1200000, percentage: 49 },
  { name: "Roofing Sheets", amount: 850000, percentage: 35 },
  { name: "Nails (4 Inch)", amount: 320000, percentage: 13 },
  { name: "Hammers & Tools", amount: 180000, percentage: 7 },
];

const categoryData = [
  { name: "Construction", value: 55, color: "hsl(160, 65%, 50%)" },
  { name: "Paints", value: 25, color: "hsl(36, 100%, 50%)" },
  { name: "Plumbing", value: 12, color: "hsl(220, 13%, 25%)" },
  { name: "Others", value: 8, color: "hsl(220, 14%, 80%)" },
];

const recentTransactions = [
  {
    date: "24 Oct, 10:45 AM",
    invoice: "#INV-045",
    customer: "Juma Construction",
    amount: 2500000,
    payment: "M-Pesa",
    status: "Completed",
  },
  {
    date: "24 Oct, 09:30 AM",
    invoice: "#INV-044",
    customer: "Walk-in Customer",
    amount: 45000,
    payment: "Cash",
    status: "Completed",
  },
];

export default function Reports() {
  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  const formatK = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Oct 1, 2024 - Oct 24, 2024</span>
          </div>
          <Select defaultValue="sales">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Summary</SelectItem>
              <SelectItem value="stock">Stock Report</SelectItem>
              <SelectItem value="profit">Profit & Loss</SelectItem>
              <SelectItem value="customer">Customer Ledger</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Sales Summary Card */}
      <Card>
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sales Summary (Selected Period)
          </p>
          <p className="mt-2 text-3xl font-bold">Tsh 4,500,000</p>
          <div className="mt-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm font-medium">2,800,000</span>
              <span className="text-sm text-muted-foreground">Cash</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-secondary" />
              <span className="text-sm font-medium">1,700,000</span>
              <span className="text-sm text-muted-foreground">M-Pesa</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Selling Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Best Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bestSellingProducts.map((product) => (
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
            ))}
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Sales by Category</CardTitle>
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
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount (TSH)</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                  <TableCell className="font-medium">{tx.invoice}</TableCell>
                  <TableCell>{tx.customer}</TableCell>
                  <TableCell className="font-medium">{formatNumber(tx.amount)}</TableCell>
                  <TableCell>{tx.payment}</TableCell>
                  <TableCell>
                    <Badge className="bg-success/10 text-success hover:bg-success/20">
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
