#!/usr/bin/env node

/**
 * Seed Data Generator for Development and Testing
 *
 * Generates test data for the CRM system including:
 * - Organizations and contacts with many-to-many relationships
 * - Opportunities (formerly deals) with participants
 * - Activities and interactions
 * - Notes and tags
 *
 * Usage:
 *   npm run seed:data           - Generate and insert seed data
 *   npm run seed:data -- --dry-run  - Preview data without inserting
 *   npm run seed:data -- --count=100 - Generate specific number of records
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  // Default counts
  ORGANIZATION_COUNT: parseInt(process.env.SEED_ORGANIZATION_COUNT || '50'),
  CONTACT_COUNT: parseInt(process.env.SEED_CONTACT_COUNT || '100'),
  OPPORTUNITY_COUNT: parseInt(process.env.SEED_OPPORTUNITY_COUNT || '75'),
  ACTIVITY_COUNT: parseInt(process.env.SEED_ACTIVITY_COUNT || '200'),
  NOTE_COUNT: parseInt(process.env.SEED_NOTE_COUNT || '150'),
  TAG_COUNT: parseInt(process.env.SEED_TAG_COUNT || '20'),

  // Opportunity configuration from environment
  DEFAULT_CATEGORY: process.env.OPPORTUNITY_DEFAULT_CATEGORY || 'new_business',
  DEFAULT_STAGE: process.env.OPPORTUNITY_DEFAULT_STAGE || 'lead',
  PIPELINE_STAGES: (process.env.OPPORTUNITY_PIPELINE_STAGES || 'lead,qualified,needs_analysis,proposal,negotiation,closed_won,closed_lost,nurturing').split(','),
  MAX_AMOUNT: parseInt(process.env.OPPORTUNITY_MAX_AMOUNT || '1000000'),
  DEFAULT_PROBABILITY: parseInt(process.env.OPPORTUNITY_DEFAULT_PROBABILITY || '50'),

  // Parse command line arguments
  DRY_RUN: process.argv.includes('--dry-run'),
  VERBOSE: process.argv.includes('--verbose'),
  CLEAN: process.argv.includes('--clean'),
  COUNT: process.argv.find(arg => arg.startsWith('--count='))?.split('=')[1] || null
};

// Opportunity categories
const OPPORTUNITY_CATEGORIES = ['new_business', 'upsell', 'renewal', 'referral'];

// Opportunity statuses
const OPPORTUNITY_STATUSES = ['open', 'won', 'lost', 'stalled'];

// Organization sectors
const ORGANIZATION_SECTORS = [
  'technology', 'healthcare', 'finance', 'retail', 'manufacturing',
  'education', 'government', 'nonprofit', 'real_estate', 'consulting'
];

// Activity types
const ACTIVITY_TYPES = ['meeting', 'call', 'email', 'task', 'note', 'event'];

// Interaction types
const INTERACTION_TYPES = ['sales_call', 'support_ticket', 'product_demo', 'follow_up', 'negotiation'];

class SeedDataGenerator {
  constructor() {
    this.supabase = null;
    this.generatedData = {
      organizations: [],
      contacts: [],
      opportunities: [],
      activities: [],
      notes: [],
      tags: []
    };
    this.spinner = ora();
  }

  async initialize() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(chalk.blue('🚀 Seed Data Generator initialized'));
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow('⚠️  Running in DRY RUN mode - no data will be inserted'));
    }
  }

  async cleanDatabase() {
    if (!CONFIG.CLEAN) return;

    this.spinner.start('Cleaning existing data...');

    try {
      // Delete in reverse dependency order
      await this.supabase.from('interaction_participants').delete().gte('id', 0);
      await this.supabase.from('opportunity_participants').delete().gte('id', 0);
      await this.supabase.from('activities').delete().gte('id', 0);
      await this.supabase.from('opportunity_notes').delete().gte('id', 0);
      await this.supabase.from('opportunities').delete().gte('id', 0);
      await this.supabase.from('contact_notes').delete().gte('id', 0);
      await this.supabase.from('contact_organizations').delete().gte('id', 0);
      await this.supabase.from('contacts').delete().gte('id', 0);
      await this.supabase.from('companies').delete().gte('id', 0);
      await this.supabase.from('tags').delete().gte('id', 0);

      this.spinner.succeed('Cleaned existing data');
    } catch (error) {
      this.spinner.fail(`Failed to clean database: ${error.message}`);
      if (!CONFIG.DRY_RUN) throw error;
    }
  }

  generateOrganizations(count = CONFIG.ORGANIZATION_COUNT) {
    this.spinner.start(`Generating ${count} organizations...`);

    for (let i = 0; i < count; i++) {
      const org = {
        id: faker.string.uuid(),
        name: faker.company.name(),
        sector: faker.helpers.arrayElement(ORGANIZATION_SECTORS),
        size: faker.helpers.arrayElement(['small', 'medium', 'large', 'enterprise']),
        website: faker.internet.url(),
        address: faker.location.streetAddress(true),
        city: faker.location.city(),
        zipcode: faker.location.zipCode(),
        country: faker.location.country(),
        linkedin: `https://linkedin.com/company/${faker.internet.userName()}`,
        phone_number: faker.phone.number(),
        annual_revenue: faker.number.int({ min: 100000, max: 100000000 }),
        employee_count: faker.number.int({ min: 10, max: 10000 }),
        description: faker.company.catchPhrase(),
        created_at: faker.date.past({ years: 2 }),
        updated_at: faker.date.recent()
      };
      this.generatedData.organizations.push(org);
    }

    this.spinner.succeed(`Generated ${count} organizations`);
  }

  generateContacts(count = CONFIG.CONTACT_COUNT) {
    this.spinner.start(`Generating ${count} contacts...`);

    for (let i = 0; i < count; i++) {
      const contact = {
        id: faker.string.uuid(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone: {
          primary: faker.phone.number(),
          mobile: Math.random() > 0.5 ? faker.phone.number() : null
        },
        title: faker.person.jobTitle(),
        department: faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Support', 'Executive', 'Finance']),
        linkedin_url: `https://linkedin.com/in/${faker.internet.userName()}`,
        avatar: faker.image.avatar(),
        background: faker.lorem.sentences(2),
        status: faker.helpers.arrayElement(['active', 'inactive', 'lead']),
        created_at: faker.date.past({ years: 2 }),
        updated_at: faker.date.recent()
      };

      // Assign to 1-3 random organizations
      contact.organizations = faker.helpers.arrayElements(
        this.generatedData.organizations,
        { min: 1, max: 3 }
      ).map(org => ({
        organization_id: org.id,
        is_primary: false,
        role: contact.title,
        started_at: faker.date.past({ years: 1 })
      }));

      // Set one as primary
      if (contact.organizations.length > 0) {
        contact.organizations[0].is_primary = true;
      }

      this.generatedData.contacts.push(contact);
    }

    this.spinner.succeed(`Generated ${count} contacts`);
  }

  generateOpportunities(count = CONFIG.OPPORTUNITY_COUNT) {
    this.spinner.start(`Generating ${count} opportunities...`);

    for (let i = 0; i < count; i++) {
      const stage = faker.helpers.arrayElement(CONFIG.PIPELINE_STAGES);
      const status = this.getStatusForStage(stage);

      const opportunity = {
        id: faker.string.uuid(),
        name: `${faker.commerce.productName()} Implementation`,
        category: faker.helpers.arrayElement(OPPORTUNITY_CATEGORIES),
        stage,
        status,
        amount: faker.number.int({ min: 10000, max: CONFIG.MAX_AMOUNT }),
        probability: this.getProbabilityForStage(stage),
        expected_close_date: faker.date.future({ years: 1 }),
        company_id: faker.helpers.arrayElement(this.generatedData.organizations).id,
        contact_id: faker.helpers.arrayElement(this.generatedData.contacts).id,
        sales_id: faker.string.uuid(), // Would be actual sales user in production
        description: faker.lorem.paragraph(),
        next_step: faker.lorem.sentence(),
        source: faker.helpers.arrayElement(['website', 'referral', 'cold_call', 'event', 'partner']),
        campaign: Math.random() > 0.5 ? faker.marketing.slogan() : null,
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent()
      };

      // Add participants (2-5 contacts)
      opportunity.participants = faker.helpers.arrayElements(
        this.generatedData.contacts,
        { min: 2, max: 5 }
      ).map(contact => ({
        contact_id: contact.id,
        role: faker.helpers.arrayElement(['decision_maker', 'influencer', 'champion', 'technical_lead', 'budget_holder']),
        is_primary: contact.id === opportunity.contact_id,
        involvement_level: faker.helpers.arrayElement(['high', 'medium', 'low']),
        added_at: faker.date.past({ years: 0.5 })
      }));

      this.generatedData.opportunities.push(opportunity);
    }

    this.spinner.succeed(`Generated ${count} opportunities`);
  }

  generateActivities(count = CONFIG.ACTIVITY_COUNT) {
    this.spinner.start(`Generating ${count} activities...`);

    for (let i = 0; i < count; i++) {
      const activityType = faker.helpers.arrayElement(ACTIVITY_TYPES);
      const activity = {
        id: faker.string.uuid(),
        type: activityType,
        subject: this.getActivitySubject(activityType),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'cancelled']),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
        opportunity_id: Math.random() > 0.3 ? faker.helpers.arrayElement(this.generatedData.opportunities).id : null,
        contact_id: faker.helpers.arrayElement(this.generatedData.contacts).id,
        assigned_to: faker.string.uuid(), // Would be actual user in production
        due_date: faker.date.future({ years: 0.5 }),
        completed_at: Math.random() > 0.5 ? faker.date.recent() : null,
        interaction_type: faker.helpers.arrayElement(INTERACTION_TYPES),
        outcome: Math.random() > 0.5 ? faker.lorem.sentence() : null,
        created_at: faker.date.past({ years: 0.5 }),
        updated_at: faker.date.recent()
      };

      // Add participants for meetings/calls
      if (['meeting', 'call'].includes(activityType)) {
        activity.participants = faker.helpers.arrayElements(
          this.generatedData.contacts,
          { min: 2, max: 4 }
        ).map(contact => ({
          contact_id: contact.id,
          participated: Math.random() > 0.2,
          notes: Math.random() > 0.5 ? faker.lorem.sentence() : null
        }));
      }

      this.generatedData.activities.push(activity);
    }

    this.spinner.succeed(`Generated ${count} activities`);
  }

  generateNotes(count = CONFIG.NOTE_COUNT) {
    this.spinner.start(`Generating ${count} notes...`);

    for (let i = 0; i < count; i++) {
      const isOpportunityNote = Math.random() > 0.4;

      const note = {
        id: faker.string.uuid(),
        text: faker.lorem.paragraphs({ min: 1, max: 3 }),
        type: faker.helpers.arrayElement(['general', 'meeting', 'call', 'email', 'internal']),
        created_by: faker.string.uuid(), // Would be actual user in production
        created_at: faker.date.past({ years: 0.5 }),
        updated_at: faker.date.recent()
      };

      if (isOpportunityNote) {
        note.opportunity_id = faker.helpers.arrayElement(this.generatedData.opportunities).id;
        note.table = 'opportunity_notes';
      } else {
        note.contact_id = faker.helpers.arrayElement(this.generatedData.contacts).id;
        note.table = 'contact_notes';
      }

      this.generatedData.notes.push(note);
    }

    this.spinner.succeed(`Generated ${count} notes`);
  }

  generateTags(count = CONFIG.TAG_COUNT) {
    this.spinner.start(`Generating ${count} tags...`);

    const tagCategories = ['industry', 'priority', 'region', 'product', 'status'];
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'];

    for (let i = 0; i < count; i++) {
      const tag = {
        id: faker.string.uuid(),
        name: faker.commerce.department(),
        category: faker.helpers.arrayElement(tagCategories),
        color: faker.helpers.arrayElement(colors),
        description: faker.lorem.sentence(),
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent()
      };

      this.generatedData.tags.push(tag);
    }

    this.spinner.succeed(`Generated ${count} tags`);
  }

  async insertData() {
    if (CONFIG.DRY_RUN) {
      console.log(chalk.yellow('\n📝 DRY RUN - Data that would be inserted:'));
      console.log(chalk.gray(`  Organizations: ${this.generatedData.organizations.length}`));
      console.log(chalk.gray(`  Contacts: ${this.generatedData.contacts.length}`));
      console.log(chalk.gray(`  Opportunities: ${this.generatedData.opportunities.length}`));
      console.log(chalk.gray(`  Activities: ${this.generatedData.activities.length}`));
      console.log(chalk.gray(`  Notes: ${this.generatedData.notes.length}`));
      console.log(chalk.gray(`  Tags: ${this.generatedData.tags.length}`));

      if (CONFIG.VERBOSE) {
        console.log('\nSample opportunity:');
        console.log(JSON.stringify(this.generatedData.opportunities[0], null, 2));
      }

      return;
    }

    this.spinner.start('Inserting data into database...');

    try {
      // Insert tags
      if (this.generatedData.tags.length > 0) {
        const { error } = await this.supabase
          .from('tags')
          .insert(this.generatedData.tags);
        if (error) throw error;
      }

      // Insert organizations (companies table)
      if (this.generatedData.organizations.length > 0) {
        const { error } = await this.supabase
          .from('companies')
          .insert(this.generatedData.organizations);
        if (error) throw error;
      }

      // Insert contacts
      if (this.generatedData.contacts.length > 0) {
        const contactsWithoutOrgs = this.generatedData.contacts.map(({ organizations, ...contact }) => contact);
        const { error } = await this.supabase
          .from('contacts')
          .insert(contactsWithoutOrgs);
        if (error) throw error;

        // Insert contact-organization relationships
        const contactOrgs = [];
        this.generatedData.contacts.forEach(contact => {
          contact.organizations.forEach(org => {
            contactOrgs.push({
              contact_id: contact.id,
              ...org
            });
          });
        });

        if (contactOrgs.length > 0) {
          const { error: orgError } = await this.supabase
            .from('contact_organizations')
            .insert(contactOrgs);
          if (orgError) throw orgError;
        }
      }

      // Insert opportunities
      if (this.generatedData.opportunities.length > 0) {
        const opportunitiesWithoutParticipants = this.generatedData.opportunities.map(
          ({ participants, ...opp }) => opp
        );
        const { error } = await this.supabase
          .from('opportunities')
          .insert(opportunitiesWithoutParticipants);
        if (error) throw error;

        // Insert opportunity participants
        const oppParticipants = [];
        this.generatedData.opportunities.forEach(opp => {
          opp.participants.forEach(participant => {
            oppParticipants.push({
              opportunity_id: opp.id,
              ...participant
            });
          });
        });

        if (oppParticipants.length > 0) {
          const { error: partError } = await this.supabase
            .from('opportunity_participants')
            .insert(oppParticipants);
          if (partError) throw partError;
        }
      }

      // Insert activities
      if (this.generatedData.activities.length > 0) {
        const activitiesWithoutParticipants = this.generatedData.activities.map(
          ({ participants, ...activity }) => activity
        );
        const { error } = await this.supabase
          .from('activities')
          .insert(activitiesWithoutParticipants);
        if (error) throw error;

        // Insert interaction participants
        const interactionParticipants = [];
        this.generatedData.activities.forEach(activity => {
          if (activity.participants) {
            activity.participants.forEach(participant => {
              interactionParticipants.push({
                activity_id: activity.id,
                ...participant
              });
            });
          }
        });

        if (interactionParticipants.length > 0) {
          const { error: partError } = await this.supabase
            .from('interaction_participants')
            .insert(interactionParticipants);
          if (partError) throw partError;
        }
      }

      // Insert notes
      const opportunityNotes = this.generatedData.notes
        .filter(note => note.table === 'opportunity_notes')
        .map(({ table, ...note }) => note);

      const contactNotes = this.generatedData.notes
        .filter(note => note.table === 'contact_notes')
        .map(({ table, ...note }) => note);

      if (opportunityNotes.length > 0) {
        const { error } = await this.supabase
          .from('opportunity_notes')
          .insert(opportunityNotes);
        if (error) throw error;
      }

      if (contactNotes.length > 0) {
        const { error } = await this.supabase
          .from('contact_notes')
          .insert(contactNotes);
        if (error) throw error;
      }

      this.spinner.succeed('Data inserted successfully');

      // Print summary
      console.log(chalk.green('\n✨ Seed data generation complete!'));
      console.log(chalk.gray(`  Organizations: ${this.generatedData.organizations.length}`));
      console.log(chalk.gray(`  Contacts: ${this.generatedData.contacts.length}`));
      console.log(chalk.gray(`  Opportunities: ${this.generatedData.opportunities.length}`));
      console.log(chalk.gray(`  Activities: ${this.generatedData.activities.length}`));
      console.log(chalk.gray(`  Notes: ${this.generatedData.notes.length}`));
      console.log(chalk.gray(`  Tags: ${this.generatedData.tags.length}`));

    } catch (error) {
      this.spinner.fail(`Failed to insert data: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  // Helper methods
  getStatusForStage(stage) {
    if (stage === 'closed_won') return 'won';
    if (stage === 'closed_lost') return 'lost';
    if (stage === 'nurturing') return 'stalled';
    return 'open';
  }

  getProbabilityForStage(stage) {
    const probabilities = {
      lead: 10,
      qualified: 25,
      needs_analysis: 40,
      proposal: 60,
      negotiation: 80,
      closed_won: 100,
      closed_lost: 0,
      nurturing: 20
    };
    return probabilities[stage] || CONFIG.DEFAULT_PROBABILITY;
  }

  getActivitySubject(type) {
    const subjects = {
      meeting: faker.helpers.arrayElement(['Product Demo', 'Requirements Review', 'Contract Negotiation', 'Kickoff Meeting']),
      call: faker.helpers.arrayElement(['Discovery Call', 'Follow-up Call', 'Check-in Call', 'Support Call']),
      email: faker.helpers.arrayElement(['Proposal Sent', 'Information Request', 'Thank You Note', 'Meeting Follow-up']),
      task: faker.helpers.arrayElement(['Prepare Proposal', 'Send Contract', 'Schedule Demo', 'Review Requirements']),
      note: faker.helpers.arrayElement(['Internal Note', 'Customer Feedback', 'Meeting Notes', 'Action Items']),
      event: faker.helpers.arrayElement(['Conference', 'Webinar', 'Training', 'Product Launch'])
    };
    return subjects[type] || faker.lorem.sentence();
  }

  async run() {
    try {
      await this.initialize();
      await this.cleanDatabase();

      // Override counts if --count provided
      const count = CONFIG.COUNT ? parseInt(CONFIG.COUNT) : null;

      // Generate data
      this.generateOrganizations(count || CONFIG.ORGANIZATION_COUNT);
      this.generateContacts(count || CONFIG.CONTACT_COUNT);
      this.generateOpportunities(count || CONFIG.OPPORTUNITY_COUNT);
      this.generateActivities(count || CONFIG.ACTIVITY_COUNT);
      this.generateNotes(count || CONFIG.NOTE_COUNT);
      this.generateTags(count || CONFIG.TAG_COUNT);

      // Insert into database
      await this.insertData();

      console.log(chalk.blue('\n🎉 Seed data generation completed successfully!'));

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      if (CONFIG.VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }
}

// Run the generator
const generator = new SeedDataGenerator();
generator.run();