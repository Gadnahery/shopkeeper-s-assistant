import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KPICardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  className?: string;
};

export function KPICard({ label, value, icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn("section-shell", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            {trend ? <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{trend}</p> : null}
          </div>
          {icon ? <div className="text-primary/80">{icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
