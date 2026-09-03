import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { isMobile } = useAdaptiveLayout();

  return (
    <div
      className={cn(
        "relative max-w-full overflow-hidden",
        isMobile
          ? "rounded-xl border-0 bg-transparent p-0"
          : "rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6",
      )}
    >
      <div className={cn("relative flex min-w-0 max-w-full gap-4", isMobile ? "flex-col" : "flex-wrap items-center justify-between")}>
        <div className="min-w-0 flex-1">
          <h1 className={cn("font-bold tracking-tight text-foreground", isMobile ? "text-xl" : "text-2xl")}>
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div
            className={cn(
              "flex w-full min-w-0 max-w-full gap-2.5",
              isMobile ? "flex-row flex-wrap items-center" : "flex-wrap items-center md:justify-end xl:w-auto",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
