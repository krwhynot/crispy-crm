/**
 * React Hook for Migration Monitoring UI
 *
 * Provides real-time migration monitoring capabilities for React components.
 * Integrates with the MigrationMetricsService to display progress and status.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MigrationMetrics,
  MigrationMetricsService,
  getMigrationMetricsService,
  resetMigrationMetricsService,
} from "../services/migrationMetrics";

export interface UseMigrationMonitoringOptions {
  /**
   * Migration ID to monitor (defaults to active migration)
   */
  migrationId?: string;

  /**
   * Enable WebSocket connection for real-time updates
   */
  useWebSocket?: boolean;

  /**
   * WebSocket server URL
   */
  wsUrl?: string;

  /**
   * Polling interval in milliseconds (defaults to 2000)
   */
  pollingInterval?: number;

  /**
   * Auto-start monitoring on mount
   */
  autoStart?: boolean;

  /**
   * Callback when migration completes
   */
  onComplete?: (metrics: MigrationMetrics) => void;

  /**
   * Callback when migration fails
   */
  onError?: (error: Error, metrics?: MigrationMetrics) => void;

  /**
   * Callback on progress update
   */
  onProgress?: (metrics: MigrationMetrics) => void;
}

export interface UseMigrationMonitoringResult {
  /**
   * Current migration metrics
   */
  metrics: MigrationMetrics | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Whether monitoring is active
   */
  isMonitoring: boolean;

  /**
   * Start monitoring
   */
  startMonitoring: () => Promise<void>;

  /**
   * Stop monitoring
   */
  stopMonitoring: () => void;

  /**
   * Refresh metrics manually
   */
  refresh: () => Promise<void>;

  /**
   * Format progress percentage
   */
  formatProgress: () => string;

  /**
   * Format ETA
   */
  formatETA: () => string;

  /**
   * Format runtime
   */
  formatRuntime: () => string;

  /**
   * Get severity color class
   */
  getSeverityClass: (severity: string) => string;
}

/**
 * Hook for monitoring migration progress in React components
 */
export function useMigrationMonitoring(
  options: UseMigrationMonitoringOptions = {},
): UseMigrationMonitoringResult {
  const {
    migrationId,
    useWebSocket = false,
    wsUrl,
    pollingInterval = 2000,
    autoStart = true,
    onComplete,
    onError,
    onProgress,
  } = options;

  // State
  const [metrics, setMetrics] = useState<MigrationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Refs
  const serviceRef = useRef<MigrationMetricsService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  /**
   * Initialize metrics service
   */
  const initializeService = useCallback(async () => {
    if (serviceRef.current) {
      return serviceRef.current;
    }

    try {
      const service = getMigrationMetricsService();

      // Configure service
      Object.assign(service, {
        options: {
          pollingInterval,
          useWebSocket,
          wsUrl: wsUrl || "ws://localhost:8080",
          cacheTimeout: 1000,
        },
      });

      await service.initialize(migrationId);
      serviceRef.current = service;
      return service;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to initialize service");
      setError(error);
      throw error;
    }
  }, [migrationId, useWebSocket, wsUrl, pollingInterval]);

  /**
   * Handle metrics update
   */
  const handleMetricsUpdate = useCallback(
    (newMetrics: MigrationMetrics) => {
      setMetrics(newMetrics);
      setError(null);

      // Check for status changes
      if (previousStatusRef.current !== newMetrics.status) {
        const previousStatus = previousStatusRef.current;
        previousStatusRef.current = newMetrics.status;

        // Handle completion
        if (newMetrics.status === "completed" && onComplete) {
          onComplete(newMetrics);
        }

        // Handle failure
        if (newMetrics.status === "failed" && onError) {
          onError(new Error("Migration failed"), newMetrics);
        }
      }

      // Call progress callback
      if (onProgress) {
        onProgress(newMetrics);
      }
    },
    [onComplete, onError, onProgress],
  );

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(async () => {
    if (isMonitoring) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = await initializeService();

      // Subscribe to updates
      const unsubscribe = service.subscribe(handleMetricsUpdate);
      unsubscribeRef.current = unsubscribe;

      // Start polling if not using WebSocket
      if (!useWebSocket) {
        service.startPolling();
      }

      // Get initial metrics
      const initialMetrics = await service.fetchMetrics();
      handleMetricsUpdate(initialMetrics);

      setIsMonitoring(true);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to start monitoring");
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isMonitoring,
    initializeService,
    handleMetricsUpdate,
    useWebSocket,
    onError,
  ]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) {
      return;
    }

    // Unsubscribe from updates
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Stop polling
    if (serviceRef.current) {
      serviceRef.current.stopPolling();
    }

    setIsMonitoring(false);
  }, [isMonitoring]);

  /**
   * Refresh metrics manually
   */
  const refresh = useCallback(async () => {
    if (!serviceRef.current) {
      await startMonitoring();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newMetrics = await serviceRef.current.fetchMetrics();
      handleMetricsUpdate(newMetrics);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to refresh metrics");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [startMonitoring, handleMetricsUpdate]);

  /**
   * Format progress percentage
   */
  const formatProgress = useCallback(() => {
    if (!metrics) {
      return "0%";
    }

    return `${metrics.progressPercent}%`;
  }, [metrics]);

  /**
   * Format ETA
   */
  const formatETA = useCallback(() => {
    if (!metrics?.estimatedCompletion) {
      return "Calculating...";
    }

    const eta = metrics.estimatedCompletion;
    const now = new Date();
    const diffMs = eta.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Any moment now";
    }

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `~${hours}h ${minutes % 60}m remaining`;
    } else if (minutes > 0) {
      return `~${minutes}m remaining`;
    } else {
      return "Less than a minute";
    }
  }, [metrics]);

  /**
   * Format runtime
   */
  const formatRuntime = useCallback(() => {
    if (!metrics?.startTime) {
      return "00:00:00";
    }

    const now = new Date();
    const startTime = metrics.startTime;
    const diffMs = now.getTime() - startTime.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
  }, [metrics]);

  /**
   * Get severity color class
   */
  const getSeverityClass = useCallback((severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "warning":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }, []);

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }

    return () => {
      // Cleanup on unmount
      if (isMonitoring) {
        stopMonitoring();
      }
      if (serviceRef.current) {
        serviceRef.current.dispose();
        serviceRef.current = null;
      }
    };
  }, [autoStart]); // Only depend on autoStart to avoid re-running

  // Update service when options change
  useEffect(() => {
    if (serviceRef.current && isMonitoring) {
      // Update polling interval if changed
      serviceRef.current.stopPolling();
      Object.assign(serviceRef.current, {
        options: {
          ...serviceRef.current.options,
          pollingInterval,
        },
      });
      if (!useWebSocket) {
        serviceRef.current.startPolling();
      }
    }
  }, [pollingInterval, useWebSocket, isMonitoring]);

  return {
    metrics,
    isLoading,
    error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refresh,
    formatProgress,
    formatETA,
    formatRuntime,
    getSeverityClass,
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Format duration to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Create progress bar string
 */
export function createProgressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}
