import type { ReactNode } from "react";
import { Component } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to structured logger
    logger.error("Dashboard error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
      feature: "dashboard",
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                The dashboard encountered an unexpected error. You can try reloading the page or
                return home.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <AdminButton onClick={this.handleReload} variant="outline" className="flex-1 gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reload Dashboard
                </AdminButton>
                <AdminButton onClick={this.handleGoHome} className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </AdminButton>
              </div>
              {/* Error details (development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
