import { Component, ErrorInfo, ReactNode } from "react";

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
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
          <h1 className="text-xl font-semibold text-destructive">Something went wrong</h1>
          <pre className="mt-4 max-h-48 overflow-auto rounded bg-muted p-4 text-sm">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
