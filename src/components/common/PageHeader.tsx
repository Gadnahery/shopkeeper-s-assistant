import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="relative max-w-full overflow-hidden rounded-[1.9rem] border border-border/70 bg-[linear-gradient(145deg,hsl(var(--card)/0.96),hsl(var(--card)/0.82))] p-5 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_bottom_left,hsl(var(--accent-foreground)/0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-48 max-w-full bg-gradient-to-l from-white/10 via-white/5 to-transparent opacity-60" />
      <div className="relative flex min-w-0 max-w-full flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/85">
            Smart Money Workspace
          </p>
          <h1 className="mt-3 text-[1.8rem] font-bold tracking-tight text-foreground sm:text-[2.2rem]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2.5 md:justify-end xl:w-auto">{actions}</div> : null}
      </div>
    </div>
  );
}
