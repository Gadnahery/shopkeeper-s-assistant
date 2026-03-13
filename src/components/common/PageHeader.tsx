import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="relative max-w-full overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-6">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40 max-w-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent" />
      <div className="relative flex min-w-0 max-w-full flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
            Smart Money Workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-[15px]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 md:justify-end xl:w-auto">{actions}</div> : null}
      </div>
    </div>
  );
}
