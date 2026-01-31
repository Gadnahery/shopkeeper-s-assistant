import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  FileText,
  AlertTriangle,
  CreditCard,
  Plus,
  Package,
  Receipt,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const kpiData = [
  {
    title: "Today Sales",
    value: "1,250,000",
    subtitle: "KES • All payment methods",
    icon: LayoutGrid,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "Transactions",
    value: "46",
    subtitle: "Receipts issued today",
    icon: FileText,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  {
    title: "Low Stock",
    value: "7 Items",
    subtitle: "Check inventory before closing",
    icon: AlertTriangle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    link: true,
  },
  {
    title: "Cash vs M-Pesa",
    value: "60% / 40%",
    subtitle: "Today's payment split",
    icon: CreditCard,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
];

const salesTrendData = [
  { day: "Mon", sales: 180000 },
  { day: "Tue", sales: 220000 },
  { day: "Wed", sales: 150000 },
  { day: "Thu", sales: 280000 },
  { day: "Fri", sales: 320000 },
  { day: "Sat", sales: 450000 },
  { day: "Sun", sales: 120000 },
];

const categoryData = [
  { name: "Building Materials", value: 60, color: "hsl(160, 65%, 50%)" },
  { name: "Tools", value: 25, color: "hsl(36, 100%, 50%)" },
  { name: "Electrical & Others", value: 15, color: "hsl(220, 14%, 80%)" },
];

const alerts = [
  {
    type: "warning",
    title: "Low stock: Cement 50kg",
    subtitle: "Building Materials • Reorder soon",
    badge: "(3 left)",
  },
  {
    type: "info",
    title: "Pending supplier order",
    subtitle: "Order #SUP-1023 • Expected tomorrow",
  },
  {
    type: "success",
    title: "Last sale: INV-045 – 20,500",
    subtitle: "KES • Cash payment",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">At-a-glance view of Colman Hardware performance today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className={`mb-4 inline-flex rounded-lg p-2.5 ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{kpi.value}</p>
              {kpi.link ? (
                <button className="mt-1 text-sm font-medium text-destructive hover:underline">
                  {kpi.subtitle}
                </button>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sales Trend */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Sales Trend</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8">Daily</Button>
              <Button variant="ghost" size="sm" className="h-8">Weekly</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesTrendData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => [`${(value / 1000).toFixed(0)}k`, 'Sales']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock by Category */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">Total Items</span>
                  <span className="text-lg font-bold">1,240</span>
                </div>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-muted-foreground">{cat.name}</span>
                    <span className="ml-auto text-sm font-medium">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Alerts & Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full ${
                    alert.type === "warning"
                      ? "bg-destructive"
                      : alert.type === "info"
                      ? "bg-muted-foreground"
                      : "bg-muted-foreground"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {alert.title}{" "}
                    {alert.badge && (
                      <span className="font-semibold text-destructive">{alert.badge}</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{alert.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
        <Button className="gap-2 bg-secondary hover:bg-secondary/90">
          <Package className="h-4 w-4" />
          Add Product
        </Button>
        <Button variant="outline" className="gap-2">
          <Receipt className="h-4 w-4" />
          Record Expense
        </Button>
      </div>
    </div>
  );
}
