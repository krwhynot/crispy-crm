/**
 * TEMPORARY: Sentry Test Triggers
 *
 * This component provides buttons to trigger different error types
 * to verify Sentry is capturing them correctly.
 *
 * DELETE THIS FILE after confirming Sentry integration works.
 */

import { useState } from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bug, Zap, Database, User, FileWarning } from "lucide-react";
import { logger } from "@/lib/logger";
import { useDataProvider } from "ra-core";

export function SentryTestTriggers() {
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);
  const dataProvider = useDataProvider();

  // Test 1: Direct Sentry capture
  const triggerDirectCapture = () => {
    const error = new Error("SENTRY_TEST: Direct captureException test");
    Sentry.captureException(error, {
      tags: { test: "direct-capture", category: "sentry-test" },
    });
    setLastTriggered("Direct Sentry capture");
  };

  // Test 2: Logger error (should forward to Sentry)
  const triggerLoggerError = () => {
    logger.error("SENTRY_TEST: Logger error forwarding test", new Error("Logger test error"), {
      feature: "sentry-test",
      testType: "logger-forwarding",
    });
    setLastTriggered("Logger error (check Sentry for forwarding)");
  };

  // Test 3: Logger warning (should forward to Sentry as warning)
  const triggerLoggerWarning = () => {
    logger.warn("SENTRY_TEST: Logger warning test", {
      feature: "sentry-test",
      testType: "logger-warning",
    });
    setLastTriggered("Logger warning");
  };

  // Test 4: Unhandled promise rejection
  const triggerUnhandledRejection = () => {
    Promise.reject(new Error("SENTRY_TEST: Unhandled promise rejection"));
    setLastTriggered("Unhandled promise rejection");
  };

  // Test 5: Data provider error (fake resource)
  const triggerDataProviderError = async () => {
    try {
      await dataProvider.getList("sentry_test_fake_resource", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });
    } catch (e) {
      // Error should already be logged by data provider
      setLastTriggered("Data provider error (check tags: resource=sentry_test_fake_resource)");
    }
  };

  // Test 6: Breadcrumb then error (to test breadcrumb capture)
  const triggerBreadcrumbThenError = () => {
    logger.breadcrumb("User clicked test button", { buttonId: "sentry-test" }, "ui");
    logger.breadcrumb("Navigating to test flow", { step: 1 }, "navigation");
    logger.breadcrumb("Processing test data", { recordCount: 42 }, "data");

    setTimeout(() => {
      logger.error("SENTRY_TEST: Error after breadcrumbs", new Error("Breadcrumb test error"), {
        feature: "sentry-test",
        testType: "breadcrumb-trace",
      });
      setLastTriggered("Error with breadcrumbs (check breadcrumb trail in Sentry)");
    }, 100);
  };

  // Test 7: Component crash (will trigger ErrorBoundary)
  const [shouldCrash, setShouldCrash] = useState(false);
  if (shouldCrash) {
    throw new Error("SENTRY_TEST: Component render crash");
  }

  const triggerComponentCrash = () => {
    setShouldCrash(true);
  };

  // Test 8: Custom message with user context
  const triggerUserContextError = () => {
    Sentry.captureMessage("SENTRY_TEST: Error with user context", {
      level: "error",
      tags: { test: "user-context", category: "sentry-test" },
      user: {
        id: "test-user-123",
        username: "Test User",
        email: "test@example.com",
      },
    });
    setLastTriggered("Error with custom user context");
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Bug className="h-5 w-5" />
          Sentry Test Triggers
          <span className="text-xs font-normal text-muted-foreground ml-2">
            (DELETE after testing)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerDirectCapture}
            className="justify-start gap-2"
          >
            <Zap className="h-4 w-4" />
            Direct Capture
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerLoggerError}
            className="justify-start gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Logger Error
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerLoggerWarning}
            className="justify-start gap-2"
          >
            <FileWarning className="h-4 w-4" />
            Logger Warning
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerUnhandledRejection}
            className="justify-start gap-2"
          >
            <Bug className="h-4 w-4" />
            Unhandled Rejection
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerDataProviderError}
            className="justify-start gap-2"
          >
            <Database className="h-4 w-4" />
            Data Provider Error
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerBreadcrumbThenError}
            className="justify-start gap-2"
          >
            <Zap className="h-4 w-4" />
            Breadcrumbs + Error
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerUserContextError}
            className="justify-start gap-2"
          >
            <User className="h-4 w-4" />
            User Context Error
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={triggerComponentCrash}
            className="justify-start gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Component Crash
          </Button>
        </div>

        {lastTriggered && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            Last triggered: <span className="font-medium">{lastTriggered}</span>
            <br />
            Check Sentry dashboard for this error.
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          All errors are prefixed with <code className="bg-muted px-1">SENTRY_TEST:</code> for easy filtering.
        </p>
      </CardContent>
    </Card>
  );
}

export default SentryTestTriggers;
