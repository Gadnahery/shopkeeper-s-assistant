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
          ? "rounded-[1.1rem] border-0 bg-transparent p-0 shadow-none backdrop-blur-0"
          : "rounded-[1.9rem] border border-border/70 bg-[linear-gradient(145deg,hsl(var(--card)/0.96),hsl(var(--card)/0.82))] p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl sm:p-6",
      )}
    >
      {!isMobile ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_bottom_left,hsl(var(--accent-foreground)/0.08),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-48 max-w-full bg-gradient-to-l from-white/10 via-white/5 to-transparent opacity-60" />
        </>
      ) : null}
      <div className={cn("relative flex min-w-0 max-w-full gap-5", isMobile ? "flex-col" : "flex-wrap items-start justify-between")}>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "inline-flex rounded-full border border-primary/15 bg-primary/10 font-semibold uppercase text-primary/85",
              isMobile ? "px-2.5 py-1 text-[10px] tracking-[0.18em]" : "px-3 py-1 text-[11px] tracking-[0.24em]",
            )}
          >
            Smart Money Workspace
          </p>
          <h1 className={cn("mt-3 font-bold tracking-tight text-foreground", isMobile ? "text-[1.45rem]" : "text-[1.8rem] sm:text-[2.2rem]")}>
            {title}
          </h1>
          {subtitle ? (
            <p className={cn("mt-2 max-w-2xl text-muted-foreground", isMobile ? "text-sm leading-6" : "text-sm leading-6 sm:text-[15px]")}>
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
