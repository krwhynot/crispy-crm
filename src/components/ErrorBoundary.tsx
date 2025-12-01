/**
 * Sentry-Integrated Error Boundary
 *
 * A robust error boundary that:
 * - Captures React errors and sends them to Sentry
 * - Provides a user-friendly fallback UI
 * - Allows error recovery via reload/navigation
 * - Preserves component stack traces for debugging
 *
 * @example
 * ```tsx
 * <SentryErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </SentryErrorBoundary>
 * ```
 */

/* eslint-disable react-refresh/only-export-components */
// Exports class component + HOC factory function - both are intentional patterns

import type { ReactNode, ErrorInfo } from "react";
import { Component } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, Home, RotateCcw, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Additional context to include in error reports */
  context?: Record<string, unknown>;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Feature/component name for better error categorization */
  feature?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
}

/**
 * Error Boundary with Sentry integration
 *
 * Wraps components to catch rendering errors, report them to Sentry,
 * and display a graceful fallback UI.
 */
export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to our structured logger
    logger.error("React component error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
      feature: this.props.feature,
      ...this.props.context,
    });

    // Capture in Sentry with full context
    const eventId = Sentry.captureException(error, {
      tags: {
        errorBoundary: "true",
        feature: this.props.feature || "unknown",
      },
      extra: {
        componentStack: errorInfo.componentStack,
        ...this.props.context,
      },
      level: "error",
    });

    this.setState({ errorInfo, eventId });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  handleReportFeedback = (): void => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                {this.props.feature
                  ? `The ${this.props.feature} encountered an unexpected error.`
                  : "An unexpected error occurred."}{" "}
                Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1 gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Report feedback button (if Sentry dialog available) */}
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
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Error details (dev only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="rounded-md bg-muted p-2 text-xs overflow-auto max-h-32">
                      {this.state.error.message}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="rounded-md bg-muted p-2 text-xs overflow-auto max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                    {this.state.eventId && (
                      <p className="text-xs text-muted-foreground">
                        Event ID: {this.state.eventId}
                      </p>
                    )}
                  </div>
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

/**
 * Higher-order component version of SentryErrorBoundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   feature: 'dashboard',
 *   context: { version: '1.0' }
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<Props, "children">
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const WithErrorBoundary: React.FC<P> = (props) => (
    <SentryErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </SentryErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

export default SentryErrorBoundary;
