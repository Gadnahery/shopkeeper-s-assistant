import { ReactNode } from "react";

type PageHeaderProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  showTitle?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  showTitle = false,
}: PageHeaderProps) {
  const text = subtitle || description;
  const hasSubtitle = Boolean(text);
  const shouldRenderTitle = showTitle || !hasSubtitle;

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {shouldRenderTitle && title ? (
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      ) : null}

      {/* Subtitle stays alone, unboxed, font size bigger, not bold */}
      {text ? (
        <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed max-w-3xl">
          {text}
        </p>
      ) : null}

      {/* Everything else (buttons, search inputs, badges) stays below the subtitle */}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-0.5">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
