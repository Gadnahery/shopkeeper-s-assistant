import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, CreditCard, History, Pencil, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "Contractor" | "Retail";
  creditBalance: number;
}

const mockCustomers: Customer[] = [
  { id: "1", name: "Juma Construct", phone: "0622 555 123", type: "Contractor", creditBalance: 150000 },
  { id: "2", name: "Ali Hardware", phone: "0754 888 999", type: "Retail", creditBalance: 0 },
  { id: "3", name: "Rehema Builder", phone: "0713 444 777", type: "Contractor", creditBalance: 80000 },
  { id: "4", name: "Baraka Renovations", phone: "0655 112 233", type: "Contractor", creditBalance: 0 },
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credit Balance (TSH)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        customer.type === "Contractor"
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-primary bg-primary/10 text-primary"
                      }
                    >
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      customer.creditBalance > 0
                        ? "font-medium text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {customer.creditBalance > 0
                      ? formatNumber(customer.creditBalance)
                      : "0"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {customer.creditBalance > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <CreditCard className="h-3 w-3" />
                          Pay
                        </Button>
                      )}
                      {customer.creditBalance === 0 && (
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
