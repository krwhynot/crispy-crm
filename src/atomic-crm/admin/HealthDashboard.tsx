/**
 * Health Dashboard Component
 *
 * Displays real-time application health metrics including:
 * - Error rate with visual indicator (green/yellow/red)
 * - Request counts and latency
 * - Recent errors list
 * - Alert status for >1% error rate
 *
 * This component is intended for admin users to monitor application health.
 *
 * @see /admin/health route
 */

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { logger, type MetricEntry } from "@/lib/logger";

/**
 * Health status thresholds
 */
const ERROR_RATE_THRESHOLDS = {
  healthy: 0.5, // < 0.5% = green
  warning: 1.0, // 0.5-1% = yellow
  // > 1% = red (critical)
};

/**
 * Get status color based on error rate
 */
function getStatusColor(errorRate: number): "green" | "yellow" | "red" {
  if (errorRate < ERROR_RATE_THRESHOLDS.healthy) return "green";
  if (errorRate < ERROR_RATE_THRESHOLDS.warning) return "yellow";
  return "red";
}

/**
 * Get status text based on error rate
 */
function getStatusText(errorRate: number): string {
  if (errorRate < ERROR_RATE_THRESHOLDS.healthy) return "Healthy";
  if (errorRate < ERROR_RATE_THRESHOLDS.warning) return "Degraded";
  return "Critical";
}

/**
 * Status indicator component
 */
function StatusIndicator({ status, label }: { status: "green" | "yellow" | "red"; label: string }) {
  const colorClasses = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-destructive",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${colorClasses[status]} animate-pulse`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/**
 * Metric card component
 */
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
            {trend === "down" && <TrendingUp className="h-3 w-3 text-destructive rotate-180" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main Health Dashboard component
 */
export function HealthDashboard() {
  const [metrics, setMetrics] = useState<{
    errorRate: number;
    totalRequests: number;
    totalErrors: number;
    recentMetrics: MetricEntry[];
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshMetrics = useCallback(() => {
    setIsRefreshing(true);
    // Small delay for visual feedback
    setTimeout(() => {
      const newMetrics = logger.getMetrics();
      setMetrics(newMetrics);
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 300);
  }, []);

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = getStatusColor(metrics.errorRate);
  const statusText = getStatusText(metrics.errorRate);
  const isAlertActive = metrics.errorRate > ERROR_RATE_THRESHOLDS.warning;

  // Calculate average latency from recent metrics
  const latencyMetrics = metrics.recentMetrics.filter((m) => m.name === "api_latency");
  const avgLatency =
    latencyMetrics.length > 0
      ? Math.round(latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length)
      : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Dashboard</h1>
          <p className="text-muted-foreground">Monitor application health and error rates</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {isAlertActive && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">High Error Rate Alert</p>
              <p className="text-sm text-muted-foreground">
                Error rate ({metrics.errorRate.toFixed(2)}%) exceeds the 1% threshold. Check Sentry
                for details.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => window.open("https://sentry.io", "_blank")}
            >
              View in Sentry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status</span>
            <StatusIndicator status={status} label={statusText} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Error Rate</span>
              <span className="font-medium">{metrics.errorRate.toFixed(2)}%</span>
            </div>
            <Progress
              value={Math.min(metrics.errorRate * 10, 100)}
              className={`h-2 ${
                status === "green"
                  ? "[&>div]:bg-green-500"
                  : status === "yellow"
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-red-500"
              }`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Target: &lt;1%</span>
              <span>10%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          subtitle="Last 60 minutes"
          icon={Activity}
        />
        <MetricCard
          title="Total Errors"
          value={metrics.totalErrors.toLocaleString()}
          subtitle={`${metrics.errorRate.toFixed(2)}% error rate`}
          icon={metrics.totalErrors > 0 ? XCircle : CheckCircle}
          trend={metrics.totalErrors > 0 ? "down" : "neutral"}
        />
        <MetricCard
          title="Avg Latency"
          value={`${avgLatency}ms`}
          subtitle={latencyMetrics.length > 0 ? `From ${latencyMetrics.length} samples` : "No data"}
          icon={Zap}
          trend={avgLatency < 200 ? "up" : avgLatency > 500 ? "down" : "neutral"}
        />
        <MetricCard
          title="Health Score"
          value={Math.max(0, 100 - metrics.errorRate * 10).toFixed(0)}
          subtitle="Out of 100"
          icon={TrendingUp}
          trend={metrics.errorRate < 1 ? "up" : "down"}
        />
      </div>

      {/* Thresholds Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500">
                Healthy
              </Badge>
              <span className="text-sm text-muted-foreground">
                &lt; {ERROR_RATE_THRESHOLDS.healthy}% errors
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-yellow-500">
                Degraded
              </Badge>
              <span className="text-sm text-muted-foreground">
                {ERROR_RATE_THRESHOLDS.healthy}% - {ERROR_RATE_THRESHOLDS.warning}% errors
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Critical</Badge>
              <span className="text-sm text-muted-foreground">
                &gt; {ERROR_RATE_THRESHOLDS.warning}% errors (alert triggered)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Metrics Table */}
      {metrics.recentMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Metric</th>
                    <th className="text-left py-2 font-medium">Value</th>
                    <th className="text-left py-2 font-medium">Tags</th>
                    <th className="text-left py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentMetrics
                    .slice(-10)
                    .reverse()
                    .map((metric, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{metric.name}</td>
                        <td className="py-2">{metric.value}</td>
                        <td className="py-2">
                          {metric.tags ? (
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(metric.tags).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default HealthDashboard;
