#!/usr/bin/env node

/**
 * Migration Monitor CLI
 *
 * Real-time monitoring tool for CRM migrations with progress tracking,
 * resource monitoring, and ETA calculation.
 *
 * Features:
 * - Phase and batch progress tracking
 * - Resource monitoring (CPU, memory, disk I/O)
 * - ETA calculation based on current progress
 * - Error logging with severity levels
 * - WebSocket support for real-time updates
 */

const { createClient } = require('@supabase/supabase-js');
const { MigrationStateTracker } = require('./migration-state-tracker');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { WebSocket } = require('ws');

class MigrationMonitor {
  constructor(supabaseClient, options = {}) {
    this.supabase = supabaseClient;
    this.options = {
      updateInterval: options.updateInterval || 1000, // 1 second default
      logPath: options.logPath || path.join(__dirname, '..', 'logs', 'migration-monitor.log'),
      enableWebSocket: options.enableWebSocket || false,
      wsPort: options.wsPort || 8080,
      verbose: options.verbose || false
    };

    this.stateTracker = null;
    this.monitoringInterval = null;
    this.wsServer = null;
    this.wsClients = new Set();

    // Resource monitoring baselines
    this.resourceBaseline = {
      cpuUsage: null,
      memoryUsage: null,
      startTime: Date.now()
    };

    // Migration metrics
    this.metrics = {
      currentPhase: null,
      currentBatch: 0,
      totalBatches: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: [],
      warnings: [],
      startTime: null,
      lastUpdate: null
    };
  }

  /**
   * Initialize monitoring
   */
  async initialize(migrationId = null) {
    // Create or load migration state tracker
    this.stateTracker = new MigrationStateTracker(this.supabase, migrationId);
    await this.stateTracker.initialize();

    // Set baseline resource usage
    this.resourceBaseline = await this.getResourceUsage();
    this.metrics.startTime = Date.now();

    // Ensure log directory exists
    const logDir = path.dirname(this.options.logPath);
    await fs.mkdir(logDir, { recursive: true });

    // Initialize WebSocket server if enabled
    if (this.options.enableWebSocket) {
      await this.startWebSocketServer();
    }

    console.log(`🚀 Migration Monitor initialized`);
    console.log(`   Migration ID: ${this.stateTracker.migrationId}`);
    console.log(`   Update Interval: ${this.options.updateInterval}ms`);
    if (this.options.enableWebSocket) {
      console.log(`   WebSocket Server: ws://localhost:${this.options.wsPort}`);
    }

    return this.stateTracker.migrationId;
  }

  /**
   * Start WebSocket server for real-time updates
   */
  async startWebSocketServer() {
    const { WebSocketServer } = require('ws');

    this.wsServer = new WebSocketServer({
      port: this.options.wsPort,
      perMessageDeflate: false
    });

    this.wsServer.on('connection', (ws) => {
      console.log('📡 New WebSocket client connected');
      this.wsClients.add(ws);

      // Send current metrics immediately
      ws.send(JSON.stringify({
        type: 'metrics',
        data: this.metrics
      }));

      ws.on('close', () => {
        this.wsClients.delete(ws);
        console.log('📡 WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        this.wsClients.delete(ws);
      });
    });
  }

  /**
   * Start monitoring
   */
  async startMonitoring() {
    console.log('\n📊 Starting migration monitoring...\n');

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.updateMetrics();
      await this.displayMetrics();
      await this.broadcastMetrics();
    }, this.options.updateInterval);

    // Initial update
    await this.updateMetrics();
    await this.displayMetrics();
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.wsServer) {
      this.wsClients.forEach(ws => ws.close());
      this.wsServer.close();
    }

    console.log('\n📊 Monitoring stopped\n');
  }

  /**
   * Update metrics from database and system
   */
  async updateMetrics() {
    try {
      // Get migration state from tracker
      const allSteps = await this.stateTracker.getAllSteps();
      const currentStep = allSteps.find(s => s.status === 'in_progress');

      if (currentStep) {
        this.metrics.currentPhase = currentStep.phase;

        // Parse batch info from metadata if available
        if (currentStep.metadata?.batch) {
          this.metrics.currentBatch = currentStep.metadata.batch;
          this.metrics.totalBatches = currentStep.metadata.totalBatches || 0;
        }

        if (currentStep.metadata?.recordsProcessed) {
          this.metrics.recordsProcessed = currentStep.metadata.recordsProcessed;
          this.metrics.totalRecords = currentStep.metadata.totalRecords || 0;
        }
      }

      // Get resource usage
      const resources = await this.getResourceUsage();
      this.metrics.resources = resources;

      // Get errors and warnings from migration_errors table
      const errors = await this.getRecentErrors();
      this.metrics.errors = errors.filter(e => e.severity === 'error');
      this.metrics.warnings = errors.filter(e => e.severity === 'warning');

      this.metrics.lastUpdate = Date.now();

    } catch (error) {
      console.error('Failed to update metrics:', error.message);
      await this.logError('Failed to update metrics', error.message, 'warning');
    }
  }

  /**
   * Get current resource usage
   */
  async getResourceUsage() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

    // Get disk I/O if available (Linux specific)
    let diskIO = null;
    try {
      const stats = await fs.readFile('/proc/diskstats', 'utf8');
      // Parse disk stats (simplified - just count operations)
      const lines = stats.split('\n').filter(line => line.includes('sda') || line.includes('nvme'));
      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        diskIO = {
          reads: parseInt(parts[3] || 0),
          writes: parseInt(parts[7] || 0)
        };
      }
    } catch (error) {
      // Not Linux or no access to diskstats
    }

    return {
      cpuUsage,
      memoryUsage: {
        used: usedMem,
        total: totalMem,
        percent: Math.round((usedMem / totalMem) * 100)
      },
      diskIO,
      timestamp: Date.now()
    };
  }

  /**
   * Get recent errors from migration
   */
  async getRecentErrors() {
    try {
      // Check if migration_errors table exists
      const { data, error } = await this.supabase
        .from('migration_errors')
        .select('*')
        .eq('migration_id', this.stateTracker.migrationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw error;
      }

      return data || [];
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Calculate ETA based on current progress
   */
  calculateETA() {
    if (!this.metrics.startTime || this.metrics.recordsProcessed === 0) {
      return null;
    }

    const elapsedMs = Date.now() - this.metrics.startTime;
    const recordsPerMs = this.metrics.recordsProcessed / elapsedMs;
    const remainingRecords = this.metrics.totalRecords - this.metrics.recordsProcessed;

    if (remainingRecords <= 0 || recordsPerMs === 0) {
      return null;
    }

    const estimatedRemainingMs = remainingRecords / recordsPerMs;
    return {
      remainingMs: estimatedRemainingMs,
      estimatedCompletionTime: new Date(Date.now() + estimatedRemainingMs)
    };
  }

  /**
   * Display metrics to console
   */
  async displayMetrics() {
    // Clear console for clean display (optional)
    if (!this.options.verbose) {
      console.clear();
    }

    console.log('═'.repeat(60));
    console.log(' MIGRATION MONITOR');
    console.log('═'.repeat(60));

    // Migration Info
    console.log(`\n📋 Migration: ${this.stateTracker.migrationId}`);
    console.log(`   Phase: ${this.metrics.currentPhase || 'Initializing'}`);

    // Progress
    if (this.metrics.totalRecords > 0) {
      const percent = Math.round((this.metrics.recordsProcessed / this.metrics.totalRecords) * 100);
      const progressBar = this.createProgressBar(percent);
      console.log(`\n📊 Progress: ${progressBar} ${percent}%`);
      console.log(`   Records: ${this.metrics.recordsProcessed.toLocaleString()} / ${this.metrics.totalRecords.toLocaleString()}`);
    }

    if (this.metrics.totalBatches > 0) {
      console.log(`   Batch: ${this.metrics.currentBatch} / ${this.metrics.totalBatches}`);
    }

    // ETA
    const eta = this.calculateETA();
    if (eta) {
      const minutes = Math.round(eta.remainingMs / 60000);
      console.log(`\n⏱️  ETA: ${minutes} minutes`);
      console.log(`   Completion: ${eta.estimatedCompletionTime.toLocaleTimeString()}`);
    }

    // Resources
    if (this.metrics.resources) {
      console.log(`\n💻 Resources:`);
      console.log(`   CPU: ${this.metrics.resources.cpuUsage}%`);
      console.log(`   Memory: ${this.metrics.resources.memoryUsage.percent}% (${this.formatBytes(this.metrics.resources.memoryUsage.used)} / ${this.formatBytes(this.metrics.resources.memoryUsage.total)})`);
      if (this.metrics.resources.diskIO) {
        console.log(`   Disk I/O: ${this.metrics.resources.diskIO.reads} reads, ${this.metrics.resources.diskIO.writes} writes`);
      }
    }

    // Errors and Warnings
    if (this.metrics.errors.length > 0 || this.metrics.warnings.length > 0) {
      console.log(`\n⚠️  Issues:`);
      if (this.metrics.errors.length > 0) {
        console.log(`   Errors: ${this.metrics.errors.length}`);
        if (this.options.verbose && this.metrics.errors[0]) {
          console.log(`     Latest: ${this.metrics.errors[0].message}`);
        }
      }
      if (this.metrics.warnings.length > 0) {
        console.log(`   Warnings: ${this.metrics.warnings.length}`);
        if (this.options.verbose && this.metrics.warnings[0]) {
          console.log(`     Latest: ${this.metrics.warnings[0].message}`);
        }
      }
    }

    // Runtime
    if (this.metrics.startTime) {
      const runtime = Date.now() - this.metrics.startTime;
      console.log(`\n⏰ Runtime: ${this.formatDuration(runtime)}`);
    }

    console.log('\n' + '═'.repeat(60));

    if (!this.options.verbose) {
      console.log('\nPress Ctrl+C to stop monitoring');
    }
  }

  /**
   * Broadcast metrics to WebSocket clients
   */
  async broadcastMetrics() {
    if (!this.options.enableWebSocket || this.wsClients.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'metrics',
      data: {
        ...this.metrics,
        eta: this.calculateETA()
      }
    });

    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Log error to database and file
   */
  async logError(message, details, severity = 'error') {
    const error = {
      migration_id: this.stateTracker.migrationId,
      phase: this.metrics.currentPhase,
      message,
      details,
      severity,
      created_at: new Date().toISOString()
    };

    // Try to save to database
    try {
      await this.supabase
        .from('migration_errors')
        .insert(error);
    } catch (dbError) {
      // Database might not be available
    }

    // Always log to file
    const logEntry = `${error.created_at} [${severity.toUpperCase()}] ${message}: ${details}\n`;
    await fs.appendFile(this.options.logPath, logEntry).catch(() => {});

    // Add to in-memory metrics
    if (severity === 'error') {
      this.metrics.errors.unshift(error);
      this.metrics.errors = this.metrics.errors.slice(0, 10); // Keep last 10
    } else if (severity === 'warning') {
      this.metrics.warnings.unshift(error);
      this.metrics.warnings = this.metrics.warnings.slice(0, 10); // Keep last 10
    }
  }

  /**
   * Update migration progress
   */
  async updateProgress(phase, batch, recordsProcessed, totalRecords, totalBatches) {
    this.metrics.currentPhase = phase;
    this.metrics.currentBatch = batch;
    this.metrics.recordsProcessed = recordsProcessed;
    this.metrics.totalRecords = totalRecords;
    this.metrics.totalBatches = totalBatches;

    // Update state tracker
    await this.stateTracker.updateState(phase, `batch_${batch}`, 'in_progress', null, {
      batch,
      totalBatches,
      recordsProcessed,
      totalRecords
    });

    // Trigger immediate update
    await this.updateMetrics();
    await this.displayMetrics();
    await this.broadcastMetrics();
  }

  /**
   * Create ASCII progress bar
   */
  createProgressBar(percent) {
    const width = 30;
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration to human readable
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    enableWebSocket: args.includes('--websocket') || args.includes('-ws'),
    wsPort: 8080,
    updateInterval: 1000
  };

  // Parse port if provided
  const portIndex = args.findIndex(arg => arg === '--port' || arg === '-p');
  if (portIndex !== -1 && args[portIndex + 1]) {
    options.wsPort = parseInt(args[portIndex + 1]);
  }

  // Parse interval if provided
  const intervalIndex = args.findIndex(arg => arg === '--interval' || arg === '-i');
  if (intervalIndex !== -1 && args[intervalIndex + 1]) {
    options.updateInterval = parseInt(args[intervalIndex + 1]);
  }

  // Parse migration ID if provided
  const migrationIdIndex = args.findIndex(arg => arg === '--migration' || arg === '-m');
  const migrationId = migrationIdIndex !== -1 ? args[migrationIdIndex + 1] : null;

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Migration Monitor - Real-time monitoring for CRM migrations

Usage:
  npm run migrate:monitor [options]

Options:
  -m, --migration <id>    Monitor specific migration ID
  -v, --verbose          Show detailed logs
  -ws, --websocket       Enable WebSocket server for real-time updates
  -p, --port <port>      WebSocket server port (default: 8080)
  -i, --interval <ms>    Update interval in milliseconds (default: 1000)
  -h, --help            Show this help message

Examples:
  npm run migrate:monitor                    # Monitor active migration
  npm run migrate:monitor -v -ws            # Verbose mode with WebSocket
  npm run migrate:monitor -m migration_123  # Monitor specific migration
    `);
    process.exit(0);
  }

  (async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not found in environment variables');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const monitor = new MigrationMonitor(supabase, options);

    try {
      await monitor.initialize(migrationId);
      await monitor.startMonitoring();

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n\nShutting down monitor...');
        await monitor.stopMonitoring();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await monitor.stopMonitoring();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  MigrationMonitor
};