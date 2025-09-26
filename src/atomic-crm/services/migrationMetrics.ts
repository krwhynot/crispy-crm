/**
 * Migration Metrics Collection Service
 *
 * Provides real-time metrics collection and tracking for CRM migrations.
 * Works in conjunction with the migration monitor to provide UI updates.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface MigrationMetrics {
  migrationId: string;
  currentPhase: string | null;
  currentBatch: number;
  totalBatches: number;
  recordsProcessed: number;
  totalRecords: number;
  progressPercent: number;
  startTime: Date | null;
  estimatedCompletion: Date | null;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  resources: ResourceMetrics | null;
  status: MigrationStatus;
  lastUpdate: Date;
}

export interface MigrationError {
  id: string;
  phase: string;
  message: string;
  details?: string;
  severity: "critical" | "high" | "medium" | "low";
  createdAt: Date;
}

export interface MigrationWarning {
  id: string;
  phase: string;
  message: string;
  details?: string;
  createdAt: Date;
}

export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percent: number;
  };
  diskIO?: {
    reads: number;
    writes: number;
  };
  timestamp: Date;
}

export type MigrationStatus =
  | "not_started"
  | "initializing"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed"
  | "rolling_back";

export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  estimatedRecords: number;
  actualRecords?: number;
  startedAt?: Date;
  completedAt?: Date;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export class MigrationMetricsService {
  private supabase: SupabaseClient;
  private migrationId: string | null = null;
  private pollingInterval: number | null = null;
  private wsConnection: WebSocket | null = null;
  private metricsCache: MigrationMetrics | null = null;
  private lastUpdateTime: Date | null = null;

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string,
    private options: {
      pollingInterval?: number;
      useWebSocket?: boolean;
      wsUrl?: string;
      cacheTimeout?: number;
    } = {},
  ) {
    const url = supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    const key = supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase credentials are required");
    }

    this.supabase = createClient(url, key);
    this.options = {
      pollingInterval: options.pollingInterval || 2000,
      useWebSocket: options.useWebSocket || false,
      wsUrl: options.wsUrl || "ws://localhost:8080",
      cacheTimeout: options.cacheTimeout || 1000,
      ...options,
    };
  }

  /**
   * Initialize metrics collection for a migration
   */
  async initialize(migrationId?: string): Promise<string> {
    // Get active migration if no ID provided
    if (!migrationId) {
      const activeMigration = await this.getActiveMigration();
      if (!activeMigration) {
        throw new Error("No active migration found");
      }
      migrationId = activeMigration;
    }

    this.migrationId = migrationId;

    // Initialize WebSocket connection if enabled
    if (this.options.useWebSocket) {
      await this.connectWebSocket();
    }

    return migrationId;
  }

  /**
   * Get the currently active migration ID
   */
  async getActiveMigration(): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from("migration_history")
        .select("id")
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Failed to get active migration:", error);
      return null;
    }
  }

  /**
   * Connect to WebSocket server for real-time updates
   */
  private async connectWebSocket(): Promise<void> {
    if (!this.options.wsUrl) return;

    return new Promise((resolve, reject) => {
      try {
        this.wsConnection = new WebSocket(this.options.wsUrl);

        this.wsConnection.onopen = () => {
          console.log("Connected to migration monitor WebSocket");
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "metrics") {
              this.updateCachedMetrics(message.data);
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.wsConnection.onerror = (error) => {
          console.error("WebSocket error:", error);
          // Fall back to polling
          this.startPolling();
        };

        this.wsConnection.onclose = () => {
          console.log("WebSocket connection closed");
          this.wsConnection = null;
          // Attempt to reconnect after delay
          setTimeout(() => {
            if (this.options.useWebSocket) {
              this.connectWebSocket();
            }
          }, 5000);
        };
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
        reject(error);
      }
    });
  }

  /**
   * Start polling for metrics updates
   */
  startPolling(): void {
    if (this.pollingInterval) {
      return; // Already polling
    }

    this.pollingInterval = window.setInterval(async () => {
      await this.fetchMetrics();
    }, this.options.pollingInterval || 2000);

    // Initial fetch
    this.fetchMetrics();
  }

  /**
   * Stop polling for metrics updates
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Fetch current metrics from database
   */
  async fetchMetrics(): Promise<MigrationMetrics> {
    if (!this.migrationId) {
      throw new Error("Migration ID not set");
    }

    // Check cache
    if (this.metricsCache && this.lastUpdateTime) {
      const cacheAge = Date.now() - this.lastUpdateTime.getTime();
      if (cacheAge < (this.options.cacheTimeout || 1000)) {
        return this.metricsCache;
      }
    }

    try {
      // Fetch migration state
      const [migrationState, phases, errors, warnings] = await Promise.all([
        this.fetchMigrationState(),
        this.fetchPhases(),
        this.fetchErrors(),
        this.fetchWarnings(),
      ]);

      // Calculate metrics
      const metrics: MigrationMetrics = {
        migrationId: this.migrationId,
        currentPhase: migrationState.currentPhase,
        currentBatch: migrationState.currentBatch || 0,
        totalBatches: migrationState.totalBatches || 0,
        recordsProcessed: migrationState.recordsProcessed || 0,
        totalRecords: migrationState.totalRecords || 0,
        progressPercent: this.calculateProgress(migrationState),
        startTime: migrationState.startTime,
        estimatedCompletion: this.calculateETA(migrationState),
        errors,
        warnings,
        resources: await this.fetchResourceMetrics(),
        status: migrationState.status,
        lastUpdate: new Date(),
      };

      this.updateCachedMetrics(metrics);
      return metrics;
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      throw error;
    }
  }

  /**
   * Fetch current migration state
   */
  private async fetchMigrationState(): Promise<any> {
    const { data, error } = await this.supabase
      .from("migration_history")
      .select("*")
      .eq("id", this.migrationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    return {
      currentPhase: data.phase,
      currentBatch: data.metadata?.batch,
      totalBatches: data.metadata?.totalBatches,
      recordsProcessed: data.metadata?.recordsProcessed,
      totalRecords: data.metadata?.totalRecords,
      startTime: data.started_at ? new Date(data.started_at) : null,
      status: data.status || "unknown",
    };
  }

  /**
   * Fetch migration phases
   */
  private async fetchPhases(): Promise<MigrationPhase[]> {
    const { data, error } = await this.supabase
      .from("migration_phases")
      .select("*")
      .eq("migration_id", this.migrationId)
      .order("order_index", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((phase) => ({
      id: phase.id,
      name: phase.name,
      description: phase.description,
      estimatedRecords: phase.estimated_records,
      actualRecords: phase.actual_records,
      startedAt: phase.started_at ? new Date(phase.started_at) : undefined,
      completedAt: phase.completed_at
        ? new Date(phase.completed_at)
        : undefined,
      status: phase.status,
    }));
  }

  /**
   * Fetch recent errors
   */
  private async fetchErrors(): Promise<MigrationError[]> {
    const { data, error } = await this.supabase
      .from("migration_errors")
      .select("*")
      .eq("migration_id", this.migrationId)
      .eq("severity", "error")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((err) => ({
      id: err.id,
      phase: err.phase,
      message: err.message,
      details: err.details,
      severity: err.severity || "medium",
      createdAt: new Date(err.created_at),
    }));
  }

  /**
   * Fetch recent warnings
   */
  private async fetchWarnings(): Promise<MigrationWarning[]> {
    const { data, error } = await this.supabase
      .from("migration_errors")
      .select("*")
      .eq("migration_id", this.migrationId)
      .eq("severity", "warning")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((warning) => ({
      id: warning.id,
      phase: warning.phase,
      message: warning.message,
      details: warning.details,
      createdAt: new Date(warning.created_at),
    }));
  }

  /**
   * Fetch resource metrics (if available)
   */
  private async fetchResourceMetrics(): Promise<ResourceMetrics | null> {
    // Resource metrics might be stored in a separate table or service
    // For now, return null as this would typically come from the monitoring service
    return null;
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(state: any): number {
    if (!state.totalRecords || state.totalRecords === 0) {
      return 0;
    }

    const percent = (state.recordsProcessed / state.totalRecords) * 100;
    return Math.min(100, Math.round(percent));
  }

  /**
   * Calculate estimated time of completion
   */
  private calculateETA(state: any): Date | null {
    if (!state.startTime || !state.recordsProcessed || !state.totalRecords) {
      return null;
    }

    const elapsedMs = Date.now() - new Date(state.startTime).getTime();
    const recordsPerMs = state.recordsProcessed / elapsedMs;
    const remainingRecords = state.totalRecords - state.recordsProcessed;

    if (remainingRecords <= 0 || recordsPerMs === 0) {
      return null;
    }

    const estimatedRemainingMs = remainingRecords / recordsPerMs;
    return new Date(Date.now() + estimatedRemainingMs);
  }

  /**
   * Update cached metrics
   */
  private updateCachedMetrics(metrics: MigrationMetrics): void {
    this.metricsCache = metrics;
    this.lastUpdateTime = new Date();
  }

  /**
   * Get current cached metrics
   */
  getCurrentMetrics(): MigrationMetrics | null {
    return this.metricsCache;
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: MigrationMetrics) => void): () => void {
    // Create a subscription that calls the callback on updates
    const interval = setInterval(async () => {
      try {
        const metrics = await this.fetchMetrics();
        callback(metrics);
      } catch (error) {
        console.error("Failed to fetch metrics for subscription:", error);
      }
    }, this.options.pollingInterval || 2000);

    // Return unsubscribe function
    return () => {
      clearInterval(interval);
    };
  }

  /**
   * Log an error during migration
   */
  async logError(
    phase: string,
    message: string,
    details?: string,
    severity: "critical" | "high" | "medium" | "low" = "medium",
  ): Promise<void> {
    if (!this.migrationId) {
      throw new Error("Migration ID not set");
    }

    try {
      await this.supabase.from("migration_errors").insert({
        migration_id: this.migrationId,
        phase,
        message,
        details,
        severity,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log error:", error);
    }
  }

  /**
   * Log a warning during migration
   */
  async logWarning(
    phase: string,
    message: string,
    details?: string,
  ): Promise<void> {
    await this.logError(phase, message, details, "low");
  }

  /**
   * Update migration progress
   */
  async updateProgress(
    phase: string,
    batch: number,
    recordsProcessed: number,
    totalRecords: number,
    totalBatches: number,
  ): Promise<void> {
    if (!this.migrationId) {
      throw new Error("Migration ID not set");
    }

    try {
      await this.supabase
        .from("migration_history")
        .update({
          phase,
          step: `batch_${batch}`,
          metadata: {
            batch,
            totalBatches,
            recordsProcessed,
            totalRecords,
            updatedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.migrationId);

      // Update cache if available
      if (this.metricsCache) {
        this.metricsCache.currentPhase = phase;
        this.metricsCache.currentBatch = batch;
        this.metricsCache.recordsProcessed = recordsProcessed;
        this.metricsCache.totalRecords = totalRecords;
        this.metricsCache.totalBatches = totalBatches;
        this.metricsCache.progressPercent = this.calculateProgress({
          recordsProcessed,
          totalRecords,
        });
        this.metricsCache.lastUpdate = new Date();
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopPolling();

    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.metricsCache = null;
    this.lastUpdateTime = null;
  }
}

// Singleton instance for easy access
let metricsServiceInstance: MigrationMetricsService | null = null;

export function getMigrationMetricsService(): MigrationMetricsService {
  if (!metricsServiceInstance) {
    metricsServiceInstance = new MigrationMetricsService();
  }
  return metricsServiceInstance;
}

export function resetMigrationMetricsService(): void {
  if (metricsServiceInstance) {
    metricsServiceInstance.dispose();
    metricsServiceInstance = null;
  }
}
