import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type DataTableProps = {
  toolbar?: ReactNode;
  table: ReactNode;
};

export function DataTable({ toolbar, table }: DataTableProps) {
  return (
    <div className="space-y-3">
      {toolbar}
      <Card className="glass-card">
        <CardContent className="p-0">{table}</CardContent>
      </Card>
    </div>
  );
}
