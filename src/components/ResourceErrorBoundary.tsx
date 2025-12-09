/**
 * Resource Error Boundary
 *
 * A specialized error boundary for React Admin Resource components.
 * Isolates errors to individual resources so a crash in one resource
 * doesn't take down the entire application.
 *
 * Features:
 * - Tags Sentry errors with resource name and page type
 * - Provides resource-specific error messages
 * - Allows retry without full page reload
 *
 * @example
 * ```tsx
 * <ResourceErrorBoundary resource="contacts" page="list">
 *   <ContactList />
 * </ResourceErrorBoundary>
 * ```
 */

import type { ReactNode, ErrorInfo } from "react";
import { Component } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** The resource name (e.g., 'contacts', 'opportunities') */
  resource: string;
  /** The page type (e.g., 'list', 'show', 'edit', 'create') */
  page?: "list" | "show" | "edit" | "create";
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for React Admin resources
 */
export class ResourceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { resource, page } = this.props;

    // Log with resource-specific context
    logger.error(`Resource error: ${resource}/${page || "unknown"}`, error, {
      resource,
      page: page || "unknown",
      feature: `resource:${resource}`,
      componentStack: errorInfo.componentStack,
    });

    // Capture to Sentry with rich tagging
    Sentry.captureException(error, {
      tags: {
        resource,
        page: page || "unknown",
        errorBoundary: "resource",
        feature: `resource:${resource}`,
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { resource, page } = this.props;
      const resourceLabel = resource.charAt(0).toUpperCase() + resource.slice(1);
      const pageLabel = page ? ` ${page}` : "";

      return (
        <div className="flex min-h-[300px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
              </div>
              <CardTitle className="text-lg">
                {resourceLabel}
                {pageLabel} Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Something went wrong loading {resourceLabel.toLowerCase()}. This error has been
                reported automatically.
              </p>

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} size="sm" className="gap-2">
                  <Home className="size-4" aria-hidden="true" />
                  Dashboard
                </Button>
              </div>

              {/* Error details (development only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
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

/**
 * HOC to wrap a component with ResourceErrorBoundary
 *
 * @example
 * ```tsx
 * const SafeContactList = withResourceErrorBoundary(ContactList, 'contacts', 'list');
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components -- HOC is tightly coupled with the error boundary component
export function withResourceErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: string,
  page?: "list" | "show" | "edit" | "create"
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const WithResourceErrorBoundary: React.FC<P> = (props) => (
    <ResourceErrorBoundary resource={resource} page={page}>
      <WrappedComponent {...props} />
    </ResourceErrorBoundary>
  );

  WithResourceErrorBoundary.displayName = `withResourceErrorBoundary(${displayName})`;

  return WithResourceErrorBoundary;
}

export default ResourceErrorBoundary;
