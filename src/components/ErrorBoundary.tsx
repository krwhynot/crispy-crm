/**
 * Error Boundary Component
 *
 * A robust error boundary that:
 * - Catches React errors and logs them
 * - Provides a user-friendly fallback UI
 * - Allows error recovery via reload/navigation
 * - Preserves component stack traces for debugging
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

/* eslint-disable react-refresh/only-export-components */
// Exports class component + HOC factory function - both are intentional patterns

import type { ReactNode, ErrorInfo } from "react";
import { Component } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
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
}

/**
 * Error Boundary component
 *
 * Wraps components to catch rendering errors and display a graceful fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to our structured logger (which forwards to Sentry)
    logger.error("React component error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
      feature: this.props.feature,
      ...this.props.context,
    });

    // Also capture directly to Sentry with React-specific context
    Sentry.captureException(error, {
      tags: {
        feature: this.props.feature || "unknown",
        errorBoundary: "true",
      },
      extra: {
        componentStack: errorInfo.componentStack,
        ...this.props.context,
      },
    });

    this.setState({ errorInfo });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
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
                <AlertTriangle className="size-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                {this.props.feature
                  ? `The ${this.props.feature} encountered an unexpected error.`
                  : "An unexpected error occurred."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1 gap-2">
                  <RotateCcw className="size-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1 gap-2">
                  <Home className="size-4" />
                  Go Home
                </Button>
              </div>

              {/* Error details (development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Error details (dev only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs">
                      {this.state.error.message}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
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

export default ErrorBoundary;
