import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  resetKey?: string;
  variant?: "fullscreen" | "contained";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    
    // Auto-recover from chunk load errors (happens when new deployment or network hiccup occurs during route shift)
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.name === "ChunkLoadError";

    if (isChunkError && !sessionStorage.getItem("chunk_retry_occurred")) {
      sessionStorage.setItem("chunk_retry_occurred", "1");
      window.location.reload();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: null });
      sessionStorage.removeItem("chunk_retry_occurred");
    }
  }

  handleReset = () => {
    sessionStorage.removeItem("chunk_retry_occurred");
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.variant === "contained") {
        return (
          <div className="my-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-card p-8 text-center shadow-xs">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Failed to display this view</h2>
            <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
              A temporary issue occurred while loading this page. You can try refreshing the view or switch to another section.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-3 max-h-32 max-w-md overflow-auto rounded-xl bg-muted/60 p-3 text-[11px] text-left text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={this.handleReset}
                size="sm"
                className="gap-1.5 rounded-xl bg-neutral-950 text-xs font-semibold text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/dashboard")}
                className="gap-1.5 rounded-xl border-border text-xs"
              >
                <Home className="h-3.5 w-3.5" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-14 w-14 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try refreshing or returning to the home screen.
            </p>
            {this.state.error?.message && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:underline">
                  Error details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-muted/80 p-3 text-[11px] text-muted-foreground font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center pt-4">
              <Button
                onClick={() => {
                  sessionStorage.removeItem("chunk_retry_occurred");
                  window.location.reload();
                }}
                className="gap-2 rounded-xl bg-neutral-950 text-xs font-bold text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
                <span className="inline-flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </span>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
