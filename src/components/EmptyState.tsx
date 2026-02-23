import { ReactNode } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-12 px-6 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
        {icon ?? <Package className="h-10 w-10" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
      {!action && actionLabel && onAction ? (
        <Button className="mt-4 hover-lift" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
