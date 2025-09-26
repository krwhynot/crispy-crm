#!/usr/bin/env node

/**
 * Data Transformation Script for CRM Migration
 *
 * Transforms existing data to match new schema:
 * - Maps deal stages to opportunity lifecycle stages
 * - Creates contact_organizations junction records from contact.company_id
 * - Populates opportunity participants from deal.contact_ids array
 * - Sets initial opportunity probabilities based on stage
 * - Migrates deal activities to new activities system
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOG_FILE = path.join(__dirname, '..', 'logs', 'transformation.log');
const STATE_FILE = path.join(__dirname, '..', 'logs', 'transformation-state.json');

// Stage mappings according to business rules
const STAGE_MAPPINGS = {
  'discovery': 'new_lead',
  'opportunity': 'initial_outreach',
  'proposal': 'demo_scheduled',
  'qualified': 'feedback_logged',
  'won': 'closed_won',
  'lost': 'closed_lost',
  // Additional common mappings
  'new': 'new_lead',
  'prospecting': 'new_lead',
  'lead': 'new_lead',
  'demo': 'demo_scheduled',
  'negotiation': 'demo_scheduled',
  'needs_analysis': 'feedback_logged',
  'nurturing': 'awaiting_response',
  'closed': 'closed_won'
};

// Probability assignments by stage
const STAGE_PROBABILITIES = {
  'new_lead': 10,
  'initial_outreach': 20,
  'sample_visit_offered': 30,
  'awaiting_response': 25,
  'feedback_logged': 50,
  'demo_scheduled': 70,
  'closed_won': 100,
  'closed_lost': 0
};

class DataTransformer {
  constructor() {
    this.supabase = null;
    this.stats = {
      contactOrganizations: { created: 0, skipped: 0, errors: 0 },
      opportunityStages: { updated: 0, skipped: 0, errors: 0 },
      opportunityParticipants: { created: 0, skipped: 0, errors: 0 },
      activities: { migrated: 0, skipped: 0, errors: 0 }
    };
    this.errors = [];
    this.state = {
      phase: 'pending',
      completedSteps: [],
      startedAt: null,
      lastUpdate: null
    };
  }

  async initialize() {
    // Load environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Load state if exists
    try {
      const stateContent = await fs.readFile(STATE_FILE, 'utf-8');
      this.state = JSON.parse(stateContent);
      await this.log('info', 'Resuming from saved state');
    } catch (err) {
      // State file doesn't exist, starting fresh
      this.state.startedAt = new Date().toISOString();
    }

    // Ensure log directory exists
    const logDir = path.dirname(LOG_FILE);
    await fs.mkdir(logDir, { recursive: true });
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    console.log(`[${level.toUpperCase()}] ${message}`, data);

    try {
      await fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  async saveState() {
    this.state.lastUpdate = new Date().toISOString();
    await fs.writeFile(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Transform 1: Create contact_organizations junction records
   * Maps existing contact.company_id to new many-to-many structure
   */
  async transformContactOrganizations() {
    await this.log('info', 'Starting contact-organization transformation');

    if (this.state.completedSteps.includes('contact_organizations')) {
      await this.log('info', 'Contact-organization transformation already completed, skipping');
      return;
    }

    try {
      // Get all contacts with company_id
      const { data: contacts, error } = await this.supabase
        .from('contacts')
        .select('id, company_id, role, is_primary_contact, purchase_influence, decision_authority')
        .not('company_id', 'is', null);

      if (error) throw error;

      await this.log('info', `Found ${contacts.length} contacts with company relationships`);

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        const records = [];

        for (const contact of batch) {
          // Check if relationship already exists
          const { data: existing } = await this.supabase
            .from('contact_organizations')
            .select('id')
            .eq('contact_id', contact.id)
            .eq('organization_id', contact.company_id)
            .single();

          if (!existing) {
            records.push({
              contact_id: contact.id,
              organization_id: contact.company_id,
              is_primary_contact: contact.is_primary_contact || false,
              purchase_influence: contact.purchase_influence || 'Unknown',
              decision_authority: contact.decision_authority || null,
              role: contact.role || null,
              created_at: new Date().toISOString()
            });
          } else {
            this.stats.contactOrganizations.skipped++;
          }
        }

        if (records.length > 0) {
          const { data, error: insertError } = await this.supabase
            .from('contact_organizations')
            .insert(records);

          if (insertError) {
            await this.log('error', 'Failed to insert contact_organizations batch', { error: insertError });
            this.stats.contactOrganizations.errors += records.length;
          } else {
            this.stats.contactOrganizations.created += records.length;
            await this.log('info', `Created ${records.length} contact-organization relationships`);
          }
        }

        // Update progress
        await this.log('progress', `Processed ${Math.min(i + batchSize, contacts.length)}/${contacts.length} contacts`);
      }

      this.state.completedSteps.push('contact_organizations');
      await this.saveState();

    } catch (error) {
      await this.log('error', 'Contact-organization transformation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Transform 2: Map deal stages to opportunity stages and set probabilities
   */
  async transformOpportunityStages() {
    await this.log('info', 'Starting opportunity stage transformation');

    if (this.state.completedSteps.includes('opportunity_stages')) {
      await this.log('info', 'Opportunity stage transformation already completed, skipping');
      return;
    }

    try {
      // Note: The deals table has been renamed to opportunities in phase 1.1
      // Get all opportunities (former deals)
      const { data: opportunities, error } = await this.supabase
        .from('opportunities')
        .select('id, stage');

      if (error) throw error;

      await this.log('info', `Found ${opportunities.length} opportunities to update`);

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < opportunities.length; i += batchSize) {
        const batch = opportunities.slice(i, i + batchSize);

        for (const opp of batch) {
          // Map old stage to new stage
          const currentStage = opp.stage?.toLowerCase();
          const newStage = STAGE_MAPPINGS[currentStage] || 'new_lead';
          const probability = STAGE_PROBABILITIES[newStage];

          const { error: updateError } = await this.supabase
            .from('opportunities')
            .update({
              stage: newStage,
              probability: probability,
              status: newStage.startsWith('closed') ? 'active' : 'active', // Keep closed opportunities active
              updated_at: new Date().toISOString()
            })
            .eq('id', opp.id);

          if (updateError) {
            await this.log('error', `Failed to update opportunity ${opp.id}`, { error: updateError });
            this.stats.opportunityStages.errors++;
          } else {
            this.stats.opportunityStages.updated++;
          }
        }

        await this.log('progress', `Processed ${Math.min(i + batchSize, opportunities.length)}/${opportunities.length} opportunities`);
      }

      this.state.completedSteps.push('opportunity_stages');
      await this.saveState();

    } catch (error) {
      await this.log('error', 'Opportunity stage transformation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Transform 3: Create opportunity participants from deal relationships
   */
  async transformOpportunityParticipants() {
    await this.log('info', 'Starting opportunity participants transformation');

    if (this.state.completedSteps.includes('opportunity_participants')) {
      await this.log('info', 'Opportunity participants transformation already completed, skipping');
      return;
    }

    try {
      // Get all opportunities with their relationships
      const { data: opportunities, error } = await this.supabase
        .from('opportunities')
        .select('id, company_id, contact_ids');

      if (error) throw error;

      await this.log('info', `Found ${opportunities.length} opportunities to process`);

      for (const opp of opportunities) {
        const participants = [];

        // Add customer organization as participant
        if (opp.company_id) {
          // Check if customer participant already exists
          const { data: existingCustomer } = await this.supabase
            .from('opportunity_participants')
            .select('id')
            .eq('opportunity_id', opp.id)
            .eq('organization_id', opp.company_id)
            .eq('role', 'customer')
            .single();

          if (!existingCustomer) {
            participants.push({
              opportunity_id: opp.id,
              organization_id: opp.company_id,
              role: 'customer',
              is_primary: true,
              created_at: new Date().toISOString()
            });
          }
        }

        // Process contact_ids array to find their organizations
        if (opp.contact_ids && Array.isArray(opp.contact_ids)) {
          for (const contactId of opp.contact_ids) {
            // Get contact's organizations
            const { data: contactOrgs } = await this.supabase
              .from('contact_organizations')
              .select('organization_id')
              .eq('contact_id', contactId);

            if (contactOrgs) {
              for (const org of contactOrgs) {
                // Check organization type to determine role
                const { data: orgData } = await this.supabase
                  .from('companies')
                  .select('organization_type, is_principal, is_distributor')
                  .eq('id', org.organization_id)
                  .single();

                if (orgData) {
                  let role = 'partner'; // default

                  if (orgData.is_principal) {
                    role = 'principal';
                  } else if (orgData.is_distributor) {
                    role = 'distributor';
                  } else if (orgData.organization_type === 'customer') {
                    continue; // Already added as customer above
                  }

                  // Check if this participant already exists
                  const { data: existing } = await this.supabase
                    .from('opportunity_participants')
                    .select('id')
                    .eq('opportunity_id', opp.id)
                    .eq('organization_id', org.organization_id)
                    .eq('role', role)
                    .single();

                  if (!existing) {
                    participants.push({
                      opportunity_id: opp.id,
                      organization_id: org.organization_id,
                      role: role,
                      is_primary: false,
                      created_at: new Date().toISOString()
                    });
                  }
                }
              }
            }
          }
        }

        // Insert participants in batch
        if (participants.length > 0) {
          const { error: insertError } = await this.supabase
            .from('opportunity_participants')
            .insert(participants);

          if (insertError) {
            await this.log('error', `Failed to insert participants for opportunity ${opp.id}`, { error: insertError });
            this.stats.opportunityParticipants.errors += participants.length;
          } else {
            this.stats.opportunityParticipants.created += participants.length;
          }
        }
      }

      this.state.completedSteps.push('opportunity_participants');
      await this.saveState();

    } catch (error) {
      await this.log('error', 'Opportunity participants transformation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Transform 4: Migrate deal activities to new activities system
   */
  async transformActivities() {
    await this.log('info', 'Starting activities transformation');

    if (this.state.completedSteps.includes('activities')) {
      await this.log('info', 'Activities transformation already completed, skipping');
      return;
    }

    try {
      // Get all deal notes (which represent activities)
      const { data: dealNotes, error: notesError } = await this.supabase
        .from('dealNotes')
        .select('*');

      if (notesError) throw notesError;

      await this.log('info', `Found ${dealNotes?.length || 0} deal notes to migrate`);

      // Also get contact notes as they might represent activities
      const { data: contactNotes, error: contactNotesError } = await this.supabase
        .from('contactNotes')
        .select('*');

      if (contactNotesError) throw contactNotesError;

      await this.log('info', `Found ${contactNotes?.length || 0} contact notes to migrate`);

      // Migrate deal notes as interactions (they have opportunity_id)
      for (const note of dealNotes || []) {
        // Check if activity already exists (to avoid duplicates)
        const { data: existing } = await this.supabase
          .from('activities')
          .select('id')
          .eq('opportunity_id', note.deal_id)
          .eq('description', note.text)
          .eq('activity_date', note.date)
          .single();

        if (!existing) {
          const activity = {
            activity_type: 'interaction', // Has opportunity
            type: 'follow_up', // Default type for notes
            subject: note.text.substring(0, 100), // First 100 chars as subject
            description: note.text,
            activity_date: note.date,
            opportunity_id: note.deal_id, // Deal ID is now opportunity ID
            created_by: note.sales_id,
            created_at: note.created_at || new Date().toISOString(),
            sentiment: 'neutral' // Default sentiment
          };

          const { error: insertError } = await this.supabase
            .from('activities')
            .insert(activity);

          if (insertError) {
            await this.log('error', `Failed to migrate deal note ${note.id}`, { error: insertError });
            this.stats.activities.errors++;
          } else {
            this.stats.activities.migrated++;
          }
        } else {
          this.stats.activities.skipped++;
        }
      }

      // Migrate contact notes as engagements (no opportunity)
      for (const note of contactNotes || []) {
        // Get contact's organization
        const { data: contact } = await this.supabase
          .from('contacts')
          .select('company_id')
          .eq('id', note.contact_id)
          .single();

        if (contact) {
          const activity = {
            activity_type: 'engagement', // No opportunity
            type: 'follow_up',
            subject: note.text.substring(0, 100),
            description: note.text,
            activity_date: note.date,
            contact_id: note.contact_id,
            organization_id: contact.company_id,
            created_by: note.sales_id,
            created_at: note.created_at || new Date().toISOString(),
            sentiment: 'neutral'
          };

          const { error: insertError } = await this.supabase
            .from('activities')
            .insert(activity);

          if (insertError) {
            await this.log('error', `Failed to migrate contact note ${note.id}`, { error: insertError });
            this.stats.activities.errors++;
          } else {
            this.stats.activities.migrated++;
          }
        }
      }

      this.state.completedSteps.push('activities');
      await this.saveState();

    } catch (error) {
      await this.log('error', 'Activities transformation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Run all transformations in sequence
   */
  async run() {
    try {
      await this.initialize();
      await this.log('info', '=== Starting CRM Data Transformation ===');

      // Run transformations in order
      await this.transformContactOrganizations();
      await this.transformOpportunityStages();
      await this.transformOpportunityParticipants();
      await this.transformActivities();

      // Log summary
      await this.log('info', '=== Transformation Complete ===', { stats: this.stats });

      console.log('\n=== Transformation Summary ===');
      console.log('Contact-Organizations:');
      console.log(`  Created: ${this.stats.contactOrganizations.created}`);
      console.log(`  Skipped: ${this.stats.contactOrganizations.skipped}`);
      console.log(`  Errors: ${this.stats.contactOrganizations.errors}`);

      console.log('\nOpportunity Stages:');
      console.log(`  Updated: ${this.stats.opportunityStages.updated}`);
      console.log(`  Skipped: ${this.stats.opportunityStages.skipped}`);
      console.log(`  Errors: ${this.stats.opportunityStages.errors}`);

      console.log('\nOpportunity Participants:');
      console.log(`  Created: ${this.stats.opportunityParticipants.created}`);
      console.log(`  Skipped: ${this.stats.opportunityParticipants.skipped}`);
      console.log(`  Errors: ${this.stats.opportunityParticipants.errors}`);

      console.log('\nActivities:');
      console.log(`  Migrated: ${this.stats.activities.migrated}`);
      console.log(`  Skipped: ${this.stats.activities.skipped}`);
      console.log(`  Errors: ${this.stats.activities.errors}`);

      if (this.errors.length > 0) {
        console.log('\n⚠️ Transformation completed with errors. Check logs for details.');
        process.exit(1);
      } else {
        console.log('\n✅ All transformations completed successfully!');
        process.exit(0);
      }

    } catch (error) {
      await this.log('error', 'Transformation failed', { error: error.message, stack: error.stack });
      console.error('\n❌ Transformation failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const transformer = new DataTransformer();
  transformer.run();
}

export default DataTransformer;