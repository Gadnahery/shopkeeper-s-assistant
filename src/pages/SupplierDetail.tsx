import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuppliers } from "@/hooks/useSuppliers";
import { ArrowLeft } from "lucide-react";

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: suppliers } = useSuppliers();
  const supplier = useMemo(() => (suppliers || []).find((s) => s.id === id), [suppliers, id]);

  if (!supplier) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">Supplier not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/suppliers")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
      </div>
      <Card className="glass-card">
        <CardHeader><CardTitle>{supplier.name}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <p><span className="font-medium">Contact:</span> {supplier.contact_person || "—"}</p>
          <p><span className="font-medium">Phone:</span> {supplier.phone || "—"}</p>
          <p><span className="font-medium">Email:</span> {supplier.email || "—"}</p>
          <p><span className="font-medium">Pending payment:</span> {Number(supplier.pending_payment || 0).toLocaleString()}</p>
          <p className="md:col-span-2"><span className="font-medium">Address:</span> {supplier.address || "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
