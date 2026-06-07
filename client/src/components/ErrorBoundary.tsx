import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

const isDev = import.meta.env.DEV;

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // Stable error ID for support reference
    this.state = { hasError: false, error: null, errorId: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console always; in production this helps support diagnose issues
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-xl p-8 rounded-2xl border border-border bg-card shadow-lg">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
              <AlertTriangle size={32} className="text-destructive" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-foreground">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-1 max-w-sm">
              An unexpected error occurred. The team has been notified.
              Try reloading or going back to the dashboard.
            </p>
            <p className="text-xs text-muted-foreground/60 mb-6 font-mono">
              Ref: {this.state.errorId}
            </p>

            {/* Stack trace — development only */}
            {isDev && this.state.error && (
              <details className="w-full mb-5 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer select-none mb-1">
                  Stack trace (dev only)
                </summary>
                <div className="p-3 w-full rounded-lg bg-muted overflow-auto max-h-52">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 transition-opacity cursor-pointer"
                )}
              >
                <RotateCcw size={14} />
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "border border-border bg-background text-foreground",
                  "hover:bg-accent transition-colors cursor-pointer"
                )}
              >
                <Home size={14} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
