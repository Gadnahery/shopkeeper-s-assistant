import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Truck,
  Clock,
  Calendar,
  CreditCard,
  History,
  Pencil,
  Trash2,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  lastPurchase: string;
  pendingPayment: number | "Paid";
}

const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Global Paints Ltd",
    category: "Paints & Solvents",
    phone: "0755 123 456",
    email: "sales@globalpaints.co.tz",
    lastPurchase: "22 Oct 2024",
    pendingPayment: 2500000,
  },
  {
    id: "2",
    name: "Kibo Cement Distributors",
    category: "Construction Materials",
    phone: "0652 987 654",
    email: "orders@kibocement.com",
    lastPurchase: "18 Oct 2024",
    pendingPayment: 1750000,
  },
  {
    id: "3",
    name: "City Hardware Wholesale",
    category: "Tools & Equipment",
    phone: "0713 555 111",
    email: "info@cityhw.co.tz",
    lastPurchase: "10 Oct 2024",
    pendingPayment: "Paid",
  },
  {
    id: "4",
    name: "Tanga Pipes Ltd",
    category: "Plumbing",
    phone: "0788 222 333",
    email: "sales@tangapipes.com",
    lastPurchase: "05 Oct 2024",
    pendingPayment: "Paid",
  },
];

const stats = [
  {
    label: "Total Suppliers",
    value: "12",
    icon: Truck,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    label: "Pending Payments",
    value: "Tsh 4,250,000",
    icon: Clock,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    valueColor: "text-destructive",
  },
  {
    label: "Last Purchase",
    value: "2 Days Ago",
    icon: Calendar,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
];

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`rounded-lg p-3 ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.valueColor || ""}`}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search supplier name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead>Pending Payment (TSH)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">{supplier.category}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{supplier.phone}</p>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{supplier.lastPurchase}</TableCell>
                  <TableCell>
                    {typeof supplier.pendingPayment === "number" ? (
                      <span className="font-medium text-destructive">
                        {formatNumber(supplier.pendingPayment)}
                      </span>
                    ) : (
                      <span className="font-medium text-success">{supplier.pendingPayment}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {typeof supplier.pendingPayment === "number" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <CreditCard className="h-3 w-3" />
                          Pay
                        </Button>
                      )}
                      {supplier.pendingPayment === "Paid" && (
                        <Button variant="ghost" size="sm" className="gap-1" disabled>
                          <CreditCard className="h-3 w-3" />
                          Pay
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="gap-1">
                        <History className="h-3 w-3" />
                        History
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
