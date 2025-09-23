#!/usr/bin/env node

/**
 * Migration State Tracker
 *
 * Provides state persistence and resume capability for CRM migrations.
 * Tracks migration progress at phase and step level for granular resume.
 *
 * Features:
 * - Persistent state storage in migration_history table
 * - Resume capability if migration is interrupted
 * - Detailed error tracking and reporting
 * - Progress monitoring and ETA calculation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class MigrationStateTracker {
  constructor(supabaseClient, migrationId = null) {
    this.supabase = supabaseClient;
    this.migrationId = migrationId || `migration_${Date.now()}`;
    this.startTime = null;
    this.currentPhase = null;
    this.completedPhases = [];
    this.stateFile = path.join(__dirname, '..', 'logs', 'migration-state.json');
  }

  /**
   * Initialize migration state tracking
   */
  async initialize() {
    // Ensure migration_history table exists
    await this.createMigrationHistoryTable();

    // Check for existing migration state
    const existingState = await this.loadExistingState();

    if (existingState) {
      console.log(`📋 Found existing migration state: ${this.migrationId}`);
      this.migrationId = existingState.id;
      this.startTime = new Date(existingState.started_at);
      return this.migrationId;
    }

    // Create new migration record
    const { data, error } = await this.supabase
      .from('migration_history')
      .insert({
        id: this.migrationId,
        phase: 'initialization',
        step: 'started',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        metadata: {
          migration_type: 'production',
          initiated_by: process.env.USER || 'system',
          node_version: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to initialize migration state: ${error.message}`);
    }

    this.startTime = new Date();
    await this.saveLocalState();

    return this.migrationId;
  }

  /**
   * Create migration_history table if it doesn't exist
   */
  async createMigrationHistoryTable() {
    // Try to check if table exists first
    const { data: existingTable, error: checkError } = await this.supabase
      .from('migration_history')
      .select('id')
      .limit(1);

    if (checkError && checkError.message.includes('relation "migration_history" does not exist')) {
      // Table doesn't exist, we need to create it
      // Note: Creating tables through Supabase client requires special permissions
      // In production, this table should be created as part of the initial setup
      console.log('⚠️  migration_history table does not exist.');
      console.log('Please create it using the Supabase Dashboard SQL Editor:');
      console.log(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id TEXT PRIMARY KEY,
          phase TEXT NOT NULL,
          step TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          error_message TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_migration_history_status ON migration_history(status);
        CREATE INDEX IF NOT EXISTS idx_migration_history_phase ON migration_history(phase);

        -- Grant appropriate permissions
        GRANT ALL ON migration_history TO authenticated;
        GRANT ALL ON migration_history TO service_role;
      `);

      // For now, we'll work without the table
      // In a real scenario, you should ensure this table exists before running migrations
      return;
    }

    // Table exists or other error occurred
    if (checkError && !checkError.message.includes('does not exist')) {
      console.warn('Error checking migration_history table:', checkError.message);
    }
  }

  /**
   * Load existing migration state if migration was interrupted
   */
  async loadExistingState() {
    try {
      // Check for local state file first
      const localState = await this.loadLocalState();
      if (localState && localState.migrationId) {
        // Verify state exists in database
        const { data, error } = await this.supabase
          .from('migration_history')
          .select('*')
          .eq('id', localState.migrationId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return data;
        }
      }

      // Look for any incomplete migration in database
      const { data, error } = await this.supabase
        .from('migration_history')
        .select('*')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to check for existing migration state:', error.message);
      }

      return data;
    } catch (error) {
      console.warn('Failed to load existing state:', error.message);
      return null;
    }
  }

  /**
   * Update migration state
   */
  async updateState(phase, step, status, errorMessage = null, metadata = {}) {
    const updateData = {
      phase,
      step,
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        updated_at: new Date().toISOString(),
        duration_ms: this.startTime ? Date.now() - this.startTime.getTime() : null
      }
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('migration_history')
      .update(updateData)
      .eq('id', this.migrationId);

    if (error) {
      console.error(`Failed to update migration state: ${error.message}`);
      throw error;
    }

    // Update local tracking
    this.currentPhase = phase;
    if (status === 'completed' && !this.completedPhases.includes(phase)) {
      this.completedPhases.push({
        phase,
        step,
        completedAt: new Date().toISOString()
      });
    }

    await this.saveLocalState();

    return { phase, step, status };
  }

  /**
   * Get last completed step for resume capability
   */
  async getLastCompletedStep() {
    const { data, error } = await this.supabase
      .from('migration_history')
      .select('*')
      .eq('id', this.migrationId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Failed to get last completed step:', error.message);
      return null;
    }

    return data;
  }

  /**
   * Get all migration steps for the current migration
   */
  async getAllSteps() {
    const { data, error } = await this.supabase
      .from('migration_history')
      .select('*')
      .eq('id', this.migrationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to get migration steps:', error.message);
      return [];
    }

    return data;
  }

  /**
   * Check if a specific phase is completed
   */
  async isPhaseCompleted(phaseId) {
    const { data, error } = await this.supabase
      .from('migration_history')
      .select('phase')
      .eq('id', this.migrationId)
      .eq('phase', phaseId)
      .eq('status', 'completed')
      .limit(1)
      .single();

    return !error && data;
  }

  /**
   * Mark entire migration as completed
   */
  async markMigrationCompleted(finalMetadata = {}) {
    const completionTime = new Date().toISOString();
    const totalDuration = this.startTime ? Date.now() - this.startTime.getTime() : null;

    await this.updateState('migration', 'completed', 'completed', null, {
      ...finalMetadata,
      completion_time: completionTime,
      total_duration_ms: totalDuration,
      total_phases: this.completedPhases.length
    });

    // Clean up local state file
    await this.cleanupLocalState();
  }

  /**
   * Mark migration as failed
   */
  async markMigrationFailed(errorMessage, errorMetadata = {}) {
    const failureTime = new Date().toISOString();
    const totalDuration = this.startTime ? Date.now() - this.startTime.getTime() : null;

    await this.updateState('migration', 'failed', 'failed', errorMessage, {
      ...errorMetadata,
      failure_time: failureTime,
      total_duration_ms: totalDuration,
      completed_phases: this.completedPhases.length
    });
  }

  /**
   * Calculate progress percentage and ETA
   */
  calculateProgress(totalPhases) {
    const completedCount = this.completedPhases.length;
    const progressPercent = (completedCount / totalPhases) * 100;

    let estimatedTimeRemaining = null;
    if (this.startTime && completedCount > 0) {
      const elapsedMs = Date.now() - this.startTime.getTime();
      const avgTimePerPhase = elapsedMs / completedCount;
      const remainingPhases = totalPhases - completedCount;
      estimatedTimeRemaining = avgTimePerPhase * remainingPhases;
    }

    return {
      completedPhases: completedCount,
      totalPhases,
      progressPercent: Math.round(progressPercent),
      estimatedTimeRemaining
    };
  }

  /**
   * Save state to local file for quick resume
   */
  async saveLocalState() {
    try {
      const state = {
        migrationId: this.migrationId,
        startTime: this.startTime?.toISOString(),
        currentPhase: this.currentPhase,
        completedPhases: this.completedPhases,
        lastUpdated: new Date().toISOString()
      };

      // Ensure logs directory exists
      const logDir = path.dirname(this.stateFile);
      await fs.mkdir(logDir, { recursive: true });

      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.warn('Failed to save local state:', error.message);
    }
  }

  /**
   * Load state from local file
   */
  async loadLocalState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      const state = JSON.parse(data);

      if (state.startTime) {
        this.startTime = new Date(state.startTime);
      }
      this.currentPhase = state.currentPhase;
      this.completedPhases = state.completedPhases || [];

      return state;
    } catch (error) {
      // File doesn't exist or is invalid, that's okay
      return null;
    }
  }

  /**
   * Clean up local state file after successful migration
   */
  async cleanupLocalState() {
    try {
      await fs.unlink(this.stateFile);
    } catch (error) {
      // File doesn't exist, that's okay
    }
  }

  /**
   * Generate progress report
   */
  async generateProgressReport(totalPhases) {
    const progress = this.calculateProgress(totalPhases);
    const allSteps = await this.getAllSteps();

    console.log('\n📊 MIGRATION PROGRESS REPORT');
    console.log('='.repeat(50));
    console.log(`Migration ID: ${this.migrationId}`);
    console.log(`Progress: ${progress.progressPercent}% (${progress.completedPhases}/${progress.totalPhases})`);

    if (progress.estimatedTimeRemaining) {
      const etaMinutes = Math.round(progress.estimatedTimeRemaining / 60000);
      console.log(`ETA: ~${etaMinutes} minutes remaining`);
    }

    console.log('\nCompleted Steps:');
    for (const step of allSteps.filter(s => s.status === 'completed')) {
      console.log(`  ✅ ${step.phase}/${step.step} (${step.completed_at})`);
    }

    const failedSteps = allSteps.filter(s => s.status === 'failed');
    if (failedSteps.length > 0) {
      console.log('\nFailed Steps:');
      for (const step of failedSteps) {
        console.log(`  ❌ ${step.phase}/${step.step}: ${step.error_message}`);
      }
    }

    const inProgressSteps = allSteps.filter(s => s.status === 'in_progress');
    if (inProgressSteps.length > 0) {
      console.log('\nIn Progress:');
      for (const step of inProgressSteps) {
        console.log(`  🔄 ${step.phase}/${step.step}`);
      }
    }

    console.log('='.repeat(50));

    return progress;
  }
}

// Utility function for standalone usage
async function createStateTracker(migrationId = null) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found in environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const tracker = new MigrationStateTracker(supabase, migrationId);
  await tracker.initialize();

  return tracker;
}

// CLI usage for checking migration status
if (require.main === module) {
  (async () => {
    try {
      const tracker = await createStateTracker();
      await tracker.generateProgressReport(10); // Assuming 10 total phases
    } catch (error) {
      console.error('Failed to generate progress report:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  MigrationStateTracker,
  createStateTracker
};