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
import { Search, Plus, TrendingUp, MoreHorizontal } from "lucide-react";

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  payMethod: string;
}

const mockExpenses: Expense[] = [
  { id: "1", date: "24 Oct, 2024", description: "Shop Rent (Oct)", category: "Rent", amount: 250000, payMethod: "M-Pesa" },
  { id: "2", date: "23 Oct, 2024", description: "Electricity Bill", category: "Utilities", amount: 45000, payMethod: "Cash" },
  { id: "3", date: "22 Oct, 2024", description: "Transport for Stock", category: "Transport", amount: 25000, payMethod: "Cash" },
  { id: "4", date: "21 Oct, 2024", description: "Staff Lunch (Weekly)", category: "Food", amount: 15000, payMethod: "Cash" },
  { id: "5", date: "20 Oct, 2024", description: "Stationery & Pens", category: "Office", amount: 5000, payMethod: "Cash" },
  { id: "6", date: "18 Oct, 2024", description: "Internet Bundle", category: "Utilities", amount: 50000, payMethod: "M-Pesa" },
];

const stats = [
  { label: "TOTAL EXPENSES (OCT)", value: "Tsh 850,000", trend: "+12% vs last month", trendUp: true },
  { label: "OPERATIONAL COSTS", value: "Tsh 320,000", subtitle: "Utilities & Rent" },
  { label: "STOCK PURCHASES", value: "Tsh 530,000", subtitle: "5 pending invoices", subtitleColor: "text-destructive" },
];

const categoryBreakdown = [
  { name: "Rent", amount: 250, color: "bg-primary" },
  { name: "Utilities", amount: 95, color: "bg-secondary" },
];

export default function Expenses() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExpenses = mockExpenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expense Tracking</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
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
            <h2 className="text-lg font-semibold">Recent Expenses</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Pay Method</TableHead>
                    <TableHead className="w-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground">{expense.date}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatNumber(expense.amount)}</TableCell>
                      <TableCell>{expense.payMethod}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Add New Expense */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Add New Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Expense Title</Label>
                <Input placeholder="e.g. Electric Bill" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue="utilities">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="stock">Stock Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (Tsh)</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90">
                <Plus className="h-4 w-4" />
                Save Expense
              </Button>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-sm ${cat.color}`} />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium">{cat.amount}k</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
