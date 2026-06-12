import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[RouteErrorBoundary]", error.message);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <AlertTriangle size={28} className="text-destructive" />
            <p className="text-sm text-muted-foreground">
              This section encountered an error.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RotateCcw size={14} />
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
