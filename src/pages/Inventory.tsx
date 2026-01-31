import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  History,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  stock: number;
  price: number;
  lowStock?: boolean;
}

const mockProducts: Product[] = [
  { id: "1", code: "NBC001", name: 'Nails (2")', stock: 150, price: 1500 },
  { id: "2", code: "HMR005", name: "Hammer", stock: 12, price: 15000 },
  { id: "3", code: "PNT100", name: "Paint (Blue)", stock: 8, price: 35000 },
  { id: "4", code: "CEM050", name: "Cement 50kg", stock: 3, price: 18000, lowStock: true },
  { id: "5", code: "WBR002", name: "Wheelbarrow", stock: 15, price: 65000 },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate("/inventory/add")}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price (Tsh)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {product.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.lowStock && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          LOW
                        </Badge>
                      )}
                      <span className={product.lowStock ? "text-destructive" : ""}>
                        {product.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={product.lowStock ? "text-destructive font-medium" : ""}>
                    {product.stock}
                  </TableCell>
                  <TableCell>{formatNumber(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
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
