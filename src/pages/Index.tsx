import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.15),_transparent_36%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.25))] p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:38px_38px] opacity-40" />
      <div className="relative mx-auto max-w-3xl rounded-[2rem] border border-border/70 bg-card/85 p-8 text-center shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">Smart Money Workspace</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Retail management built for modern teams</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Sales, stock, expenses, customers, and reporting now live in one cleaner, faster workspace.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/login">
              Open app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/">Landing page</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
