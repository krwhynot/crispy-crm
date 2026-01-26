/**
 * Tab Error Boundary
 *
 * A lightweight error boundary for tab content in slide-overs.
 * Isolates tab errors so one failing tab doesn't crash the entire panel.
 *
 * Features:
 * - Tab-specific error messages (not "Contacts list Error")
 * - Inline retry button to re-render children
 * - Compact UI that fits in tab content area
 * - Sentry reporting with tab context
 *
 * @example
 * ```tsx
 * <TabErrorBoundary tabKey="activities" tabLabel="Activities">
 *   <UnifiedTimeline contactId={record.id} />
 * </TabErrorBoundary>
 * ```
 */

import type { ReactNode, ErrorInfo } from "react";
import { Component } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** Tab identifier for error context */
  tabKey: string;
  /** Human-readable tab label for error messages */
  tabLabel: string;
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { tabKey, tabLabel } = this.props;

    // Log with tab-specific context
    logger.error(`Tab error: ${tabLabel}`, error, {
      tabKey,
      tabLabel,
      feature: `tab:${tabKey}`,
      componentStack: errorInfo.componentStack,
    });

    // Capture to Sentry
    Sentry.captureException(error, {
      tags: {
        tabKey,
        errorBoundary: "tab",
        feature: `tab:${tabKey}`,
      },
      extra: {
        tabLabel,
        componentStack: errorInfo.componentStack,
      },
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { tabLabel } = this.props;

      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-3">
            <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Failed to load {tabLabel.toLowerCase()}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            An error occurred while loading this tab.
          </p>
          <AdminButton onClick={this.handleRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try Again
          </AdminButton>

          {/* Error details (development only) */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 w-full max-w-md text-left">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Error details (dev only)
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default TabErrorBoundary;
