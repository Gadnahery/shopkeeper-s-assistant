import type { ReactNode } from "react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

type PublicPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_30%)] from-emerald-50/70 via-background to-cyan-50/60 dark:from-neutral-950 dark:via-background dark:to-neutral-900/80">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-4 pb-12 pt-28 md:px-6 md:pb-16 md:pt-32">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-white/70 to-cyan-50/80 dark:from-neutral-900/80 dark:via-neutral-900/60 dark:to-emerald-950/30" />
          <div className="relative container mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              {eyebrow ? (
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
                {description}
              </p>
            </div>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}
