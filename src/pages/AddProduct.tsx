import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Info, Tag, Save, ScanLine } from "lucide-react";

export default function AddProduct() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
        </div>
        <Button variant="outline" onClick={() => navigate("/inventory")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Inventory
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          {/* General Information Section */}
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              <h2 className="text-lg font-semibold">General Information</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Paint Brush 4 inch"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="code">Product Code (SKU)</Label>
                <Input
                  id="code"
                  value="AUTO-8392"
                  disabled
                  className="mt-2 bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building">Building Materials</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="paint">Paints & Solvents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <div className="relative mt-2">
                  <Input
                    id="barcode"
                    placeholder="Scan or enter barcode"
                    className="pr-10"
                  />
                  <ScanLine className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Label htmlFor="unit">Unit Type</Label>
                <Select defaultValue="piece">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece (pc)</SelectItem>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="meter">Meter (m)</SelectItem>
                    <SelectItem value="liter">Liter (L)</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing & Stock Section */}
          <div className="border-t pt-8">
            <div className="mb-6 flex items-center gap-2 text-secondary">
              <Tag className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-foreground">Pricing & Stock</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="buyingPrice">Buying Price (Tsh)</Label>
                <Input
                  id="buyingPrice"
                  type="number"
                  placeholder="0.00"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="sellingPrice">Selling Price (Tsh)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  placeholder="0.00"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="stock">Initial Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="lowStockAlert">Low Stock Alert Limit</Label>
                <Input
                  id="lowStockAlert"
                  type="number"
                  placeholder="e.g. 5"
                  className="mt-2"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Notifies when stock drops below this
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" onClick={() => navigate("/inventory")}>
              Cancel
            </Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Save Product
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
