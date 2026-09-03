import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

interface Props {
  children: ReactNode;
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
    // Only log in development
    if (import.meta.env.DEV) {
      console.error("App error:", error, errorInfo);
    }
    // In production, you could send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-foreground/70 dark:text-foreground/80">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-muted p-4 text-xs text-left">
                {this.state.error.message}
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Stack trace</summary>
                    <pre className="mt-2 text-xs">{this.state.error.stack}</pre>
                  </details>
                )}
              </pre>
            )}
            <div className="flex gap-3 justify-center pt-4">
              <Button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                <span className="inline-flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
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
