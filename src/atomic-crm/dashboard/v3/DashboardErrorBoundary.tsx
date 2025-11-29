import type { ReactNode } from "react";
import { Component } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, Home, RotateCcw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  eventId?: string;
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

    // Capture in Sentry with full context
    const eventId = Sentry.captureException(error, {
      tags: {
        errorBoundary: "dashboard",
        feature: "principal-dashboard-v3",
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
      level: "error",
    });

    this.setState({ eventId });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
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
                The dashboard encountered an unexpected error. Our team has been notified. You can
                try reloading the page or return home.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={this.handleReload} variant="outline" className="flex-1 gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reload Dashboard
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
              {/* Report feedback button */}
              {this.state.eventId && (
                <Button
                  onClick={this.handleReportFeedback}
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                >
                  <Bug className="h-4 w-4" />
                  Report this issue
                </Button>
              )}
              {/* Error details (development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 rounded-md bg-muted p-2 text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                  {this.state.eventId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Event ID: {this.state.eventId}
                    </p>
                  )}
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
