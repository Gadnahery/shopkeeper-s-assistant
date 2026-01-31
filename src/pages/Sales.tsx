import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Barcode, Search, CheckCircle, Printer, Save, Minus, Plus, X } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const mockCartItems: CartItem[] = [
  { id: "1", name: "Paint Brush", price: 3500, quantity: 2 },
  { id: "2", name: 'Nails (2")', price: 200, quantity: 10 },
  { id: "3", name: "Hammer", price: 12000, quantity: 1 },
];

export default function Sales() {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [discountAmount, setDiscountAmount] = useState("500");
  const [discountPercent, setDiscountPercent] = useState("5");
  const [cashAmount, setCashAmount] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = parseInt(discountAmount) || 0;
  const total = subtotal - discount;

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Left Side - Main POS Area */}
      <div className="space-y-6 lg:col-span-3">
        {/* Customer & Phone Section */}
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select defaultValue="walk-in">
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    <SelectItem value="juma">Juma Construct</SelectItem>
                    <SelectItem value="ali">Ali Hardware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="Enter customer phone number" 
                  className="h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search / Barcode Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="flex h-16 items-center gap-3 p-4">
              <Barcode className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Scan Barcode</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex h-16 items-center gap-3 p-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search Products" 
                className="border-0 bg-transparent p-0 focus-visible:ring-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cart</h3>
              <span className="text-sm text-muted-foreground">
                Barcode scan or search to add items
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(item.price * item.quantity)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Subtotal & Discount */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatNumber(subtotal)}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Discount</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Tsh
                      </span>
                    </div>
                    <span className="flex items-center text-muted-foreground">or</span>
                    <div className="relative flex-1">
                      <Input
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center">
                <span className="text-lg text-muted-foreground">Total</span>
                <span className="text-3xl font-bold">{formatNumber(total)}</span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Cash</Label>
                <Input
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={formatNumber(total)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">M-Pesa</Label>
                <Input
                  value={mpesaAmount}
                  onChange={(e) => setMpesaAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">M-Pesa Code</Label>
                <Input
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  placeholder="Transaction code"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="flex-1 gap-2 bg-secondary hover:bg-secondary/90 md:flex-none md:px-8">
                <CheckCircle className="h-4 w-4" />
                Complete Sale
              </Button>
              <Button variant="outline" className="flex-1 gap-2 md:flex-none md:px-8">
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button variant="outline" className="flex-1 gap-2 md:flex-none md:px-8">
                <Save className="h-4 w-4" />
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Invoice Info */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Invoice</Label>
                <p className="text-2xl font-bold">INV-045</p>
                <p className="text-sm text-muted-foreground">Auto-generated invoice number</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date & Time</Label>
                <p className="font-medium">24 Oct 2024, 10:52 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
