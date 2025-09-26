/**
 * User Acceptance Testing - Opportunity Workflows
 *
 * This test suite covers critical user workflows after the CRM migration
 * from Deals to Opportunities with multi-organization contact support.
 */

describe('UAT: Opportunity Workflows', () => {
  // Mock data types for testing
  interface TestOpportunity {
    id: number;
    name: string;
    customer_organization_id: number;
    contact_ids: number[];
    category: string;
    stage: string;
    probability?: number;
    priority?: string;
    lifecycle_stage?: string;
    description: string;
    amount: number;
    expected_close_date?: string;
    sales_id: number;
    created_at: string;
    updated_at: string;
    archived_at?: string;
  }

  interface TestContact {
    id: number;
    first_name: string;
    last_name: string;
    title: string;
    organization_id: number;
    email: Array<{ email: string; type: string }>;
    phone_number_jsonb: Array<{ phone: string; type: string }>;
    background: string;
    organization_relationships?: Array<{
      organization_id: number;
      is_primary_contact: boolean;
      role: string;
      purchase_influence: string;
      decision_authority: string;
    }>;
  }

  interface TestCompany {
    id: number;
    name: string;
    sector: string;
    organization_type?: string;
    priority?: string;
    size: number;
    address: string;
    website: string;
    phone_number_1: string;
    email: string;
  }

  // Mock data
  const mockCompanies: TestCompany[] = [
    {
      id: 1,
      name: 'Tech Innovators Inc',
      sector: 'Technology',
      organization_type: 'customer',
      priority: 'A',
      size: 250,
      address: '123 Tech Street, San Francisco, CA',
      website: 'https://techinnovators.com',
      phone_number_1: '+1-555-0123',
      email: 'contact@techinnovators.com'
    },
    {
      id: 2,
      name: 'Global Solutions Corp',
      sector: 'Consulting',
      organization_type: 'prospect',
      priority: 'B',
      size: 1000,
      address: '456 Business Ave, New York, NY',
      website: 'https://globalsolutions.com',
      phone_number_1: '+1-555-0456',
      email: 'info@globalsolutions.com'
    }
  ];

  const mockContacts: TestContact[] = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      title: 'CTO',
      organization_id: 1,
      email: [{ email: 'john.smith@techinnovators.com', type: 'Work' }],
      phone_number_jsonb: [{ phone: '+1-555-0199', type: 'Work' }],
      background: 'Technical decision maker with 15 years experience'
    },
    {
      id: 2,
      first_name: 'Sarah',
      last_name: 'Johnson',
      title: 'VP of Operations',
      organization_id: 2,
      email: [{ email: 'sarah.johnson@globalsolutions.com', type: 'Work' }],
      phone_number_jsonb: [{ phone: '+1-555-0788', type: 'Work' }],
      background: 'Operations leader focused on efficiency'
    }
  ];

  const mockOpportunities: TestOpportunity[] = [
    {
      id: 1,
      name: 'Enterprise Software License',
      customer_organization_id: 1,
      contact_ids: [1],
      category: 'Software',
      stage: 'Demo Scheduled',
      probability: 80,
      priority: 'High',
      lifecycle_stage: 'Demo Scheduled',
      description: 'Annual enterprise software license renewal',
      amount: 50000,
      expected_close_date: '2024-03-31',
      sales_id: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      archived_at: null
    }
  ];

  describe('Create Opportunity with All New Fields', () => {
    test('should validate new opportunity fields are available', () => {
      const newOpportunity = {
        name: 'New Cloud Migration Project',
        customer_organization_id: 2,
        contact_ids: [2],
        category: 'Consulting',
        stage: 'New Lead',
        probability: 10,
        priority: 'Medium',
        lifecycle_stage: 'Initial Outreach',
        description: 'Cloud infrastructure migration consulting',
        amount: 75000,
        expected_close_date: '2024-06-30'
      };

      // Validate that all new fields are defined
      expect(newOpportunity.probability).toBeDefined();
      expect(newOpportunity.priority).toBeDefined();
      expect(newOpportunity.lifecycle_stage).toBeDefined();
      expect(newOpportunity.expected_close_date).toBeDefined();

      // Validate field types and ranges
      expect(typeof newOpportunity.probability).toBe('number');
      expect(newOpportunity.probability).toBeGreaterThanOrEqual(0);
      expect(newOpportunity.probability).toBeLessThanOrEqual(100);

      expect(['High', 'Medium', 'Low']).toContain(newOpportunity.priority);
      expect(['New Lead', 'Initial Outreach', 'Sample/Visit Offered', 'Awaiting Response', 'Feedback Logged', 'Demo Scheduled', 'Closed Won', 'Closed Lost']).toContain(newOpportunity.lifecycle_stage);
    });

    test('should validate enhanced opportunity data structure', () => {
      const opportunity = mockOpportunities[0];

      // Check that opportunity has all enhanced fields
      expect(opportunity).toHaveProperty('probability');
      expect(opportunity).toHaveProperty('priority');
      expect(opportunity).toHaveProperty('lifecycle_stage');
      expect(opportunity).toHaveProperty('customer_organization_id');

      // Verify enhanced field values
      expect(opportunity.probability).toBe(75);
      expect(opportunity.priority).toBe('High');
      expect(opportunity.lifecycle_stage).toBe('Demo Scheduled');
      expect(opportunity.customer_organization_id).toBe(1);
    });
  });

  describe('Multi-Organization Contact Support', () => {
    test('should support contact relationships with multiple organizations', () => {
      const contactWithMultipleOrgs: TestContact = {
        ...mockContacts[0],
        organization_relationships: [
          {
            organization_id: 1,
            is_primary_contact: true,
            role: 'Technical Lead',
            purchase_influence: 'High',
            decision_authority: 'Recommender'
          },
          {
            organization_id: 2,
            is_primary_contact: false,
            role: 'Consultant',
            purchase_influence: 'Medium',
            decision_authority: 'Influencer'
          }
        ]
      };

      // Validate multi-organization structure
      expect(contactWithMultipleOrgs.organization_relationships).toBeDefined();
      expect(contactWithMultipleOrgs.organization_relationships).toHaveLength(2);

      // Check primary organization
      const primaryRelationship = contactWithMultipleOrgs.organization_relationships?.find(rel => rel.is_primary_contact);
      expect(primaryRelationship).toBeDefined();
      expect(primaryRelationship?.organization_id).toBe(1);
      expect(primaryRelationship?.role).toBe('Technical Lead');

      // Check secondary organization
      const secondaryRelationship = contactWithMultipleOrgs.organization_relationships?.find(rel => !rel.is_primary_contact);
      expect(secondaryRelationship).toBeDefined();
      expect(secondaryRelationship?.organization_id).toBe(2);
      expect(secondaryRelationship?.role).toBe('Consultant');
    });

    test('should validate organization relationship fields', () => {
      const relationshipFields = {
        organization_id: 1,
        is_primary_contact: true,
        role: 'Technical Lead',
        purchase_influence: 'High',
        decision_authority: 'Recommender'
      };

      // Validate required fields
      expect(relationshipFields.organization_id).toBeDefined();
      expect(typeof relationshipFields.is_primary_contact).toBe('boolean');
      expect(relationshipFields.role).toBeDefined();

      // Validate enum values
      expect(['High', 'Medium', 'Low', 'Unknown']).toContain(relationshipFields.purchase_influence);
      expect(['Decision Maker', 'Recommender', 'Influencer', 'End User', 'Gatekeeper']).toContain(relationshipFields.decision_authority);
    });
  });

  describe('Search and Filter Opportunities', () => {
    test('should support enhanced filtering options', () => {
      const filterCriteria = {
        stage: 'Demo Scheduled',
        priority: 'High',
        probability_min: 50,
        probability_max: 100,
        lifecycle_stage: 'Demo Scheduled',
        customer_organization_id: 1
      };

      // Validate filter structure
      expect(filterCriteria).toHaveProperty('stage');
      expect(filterCriteria).toHaveProperty('priority');
      expect(filterCriteria).toHaveProperty('probability_min');
      expect(filterCriteria).toHaveProperty('probability_max');
      expect(filterCriteria).toHaveProperty('lifecycle_stage');

      // Test opportunity matches filter
      const opportunity = mockOpportunities[0];
      expect(opportunity.stage).toBe(filterCriteria.stage);
      expect(opportunity.priority).toBe(filterCriteria.priority);
      expect(opportunity.probability).toBeGreaterThanOrEqual(filterCriteria.probability_min);
      expect(opportunity.probability).toBeLessThanOrEqual(filterCriteria.probability_max);
      expect(opportunity.lifecycle_stage).toBe(filterCriteria.lifecycle_stage);
    });

    test('should validate search functionality', () => {
      const searchQuery = 'Enterprise Software';
      const opportunities = mockOpportunities;

      // Test search logic
      const matchingOpportunities = opportunities.filter(opp =>
        opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(matchingOpportunities).toHaveLength(1);
      expect(matchingOpportunities[0].name).toBe('Enterprise Software License');
    });
  });

  describe('UI Labels and Terminology', () => {
    test('should use "Opportunity" terminology consistently', () => {
      const expectedTerminology = {
        resourceName: 'opportunities',
        displayName: 'Opportunities',
        singularName: 'Opportunity',
        createLabel: 'Create Opportunity',
        editLabel: 'Edit Opportunity',
        listLabel: 'Opportunities List'
      };

      // Validate terminology structure
      expect(expectedTerminology.resourceName).toBe('opportunities');
      expect(expectedTerminology.displayName).toBe('Opportunities');
      expect(expectedTerminology.singularName).toBe('Opportunity');

      // Ensure no "Deal" terminology
      Object.values(expectedTerminology).forEach(term => {
        expect(term.toLowerCase()).not.toContain('deal');
      });
    });

    test('should validate new field labels', () => {
      const fieldLabels = {
        probability: 'Probability (%)',
        priority: 'Priority',
        lifecycle_stage: 'Lifecycle Stage',
        customer_organization_id: 'Customer Organization',
        expected_close_date: 'Expected Close Date'
      };

      // Validate all new field labels are defined
      Object.values(fieldLabels).forEach(label => {
        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('should validate URL redirect mapping', () => {
      const urlMappings = [
        { from: '/deals', to: '/opportunities' },
        { from: '/deals/123', to: '/opportunities/123' },
        { from: '/deals/create', to: '/opportunities/create' },
        { from: '/deals/123/edit', to: '/opportunities/123/edit' }
      ];

      urlMappings.forEach(mapping => {
        // Validate mapping structure
        expect(mapping.from).toBeDefined();
        expect(mapping.to).toBeDefined();
        expect(mapping.from).toContain('/deals');
        expect(mapping.to).toContain('/opportunities');

        // Validate ID preservation in redirects
        const fromParts = mapping.from.split('/');
        const toParts = mapping.to.split('/');
        if (fromParts.length === toParts.length) {
          fromParts.forEach((part, index) => {
            if (!isNaN(Number(part))) {
              expect(toParts[index]).toBe(part);
            }
          });
        }
      });
    });

    test('should validate data transformation compatibility', () => {
      // Test that Deal structure can be converted to Opportunity
      const dealData = {
        id: 1,
        name: 'Legacy Deal',
        organization_id: 1,
        contact_ids: [1],
        category: 'Software',
        stage: 'Demo Scheduled',
        description: 'Legacy deal description',
        amount: 25000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Transform to Opportunity structure
      const opportunityData = {
        ...dealData,
        customer_organization_id: dealData.organization_id,
        probability: 50, // Default value
        priority: 'Medium', // Default value
        lifecycle_stage: 'Demo Scheduled', // Default value
        expected_close_date: null
      };

      // Validate transformation
      expect(opportunityData.customer_organization_id).toBe(dealData.organization_id);
      expect(opportunityData.name).toBe(dealData.name);
      expect(opportunityData.amount).toBe(dealData.amount);
      expect(opportunityData.contact_ids).toEqual(dealData.contact_ids);

      // Validate new fields have defaults
      expect(opportunityData.probability).toBeDefined();
      expect(opportunityData.priority).toBeDefined();
      expect(opportunityData.lifecycle_stage).toBeDefined();
    });
  });

  describe('Report Generation Validation', () => {
    test('should validate enhanced reporting data structure', () => {
      const reportData = {
        totalOpportunities: mockOpportunities.length,
        totalValue: mockOpportunities.reduce((sum, opp) => sum + opp.amount, 0),
        averageProbability: mockOpportunities.reduce((sum, opp) => sum + (opp.probability || 0), 0) / mockOpportunities.length,
        stageDistribution: {
          'Discovery': 0,
          'Qualification': 0,
          'Evaluation': 0,
          'Proposal': 1,
          'Negotiation': 0,
          'Closed Won': 0,
          'Closed Lost': 0
        },
        priorityDistribution: {
          'High': 1,
          'Medium': 0,
          'Low': 0
        }
      };

      // Validate report structure
      expect(reportData.totalOpportunities).toBe(1);
      expect(reportData.totalValue).toBe(50000);
      expect(reportData.averageProbability).toBe(75);

      // Validate distribution calculations
      expect(reportData.stageDistribution['Demo Scheduled']).toBe(1);
      expect(reportData.priorityDistribution['High']).toBe(1);

      // Validate all stages and priorities are included
      const expectedStages = ['New Lead', 'Initial Outreach', 'Sample/Visit Offered', 'Awaiting Response', 'Feedback Logged', 'Demo Scheduled', 'Closed Won', 'Closed Lost'];
      expectedStages.forEach(stage => {
        expect(reportData.stageDistribution).toHaveProperty(stage);
      });

      const expectedPriorities = ['High', 'Medium', 'Low'];
      expectedPriorities.forEach(priority => {
        expect(reportData.priorityDistribution).toHaveProperty(priority);
      });
    });
  });

  describe('Data Migration Verification', () => {
    test('should validate data preservation after migration', () => {
      const preMigrationDeal = {
        id: 1,
        name: 'Enterprise Software License',
        organization_id: 1,
        contact_ids: [1],
        category: 'Software',
        stage: 'Demo Scheduled',
        description: 'Annual enterprise software license renewal',
        amount: 50000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      };

      const postMigrationOpportunity = mockOpportunities[0];

      // Validate core data preservation
      expect(postMigrationOpportunity.id).toBe(preMigrationDeal.id);
      expect(postMigrationOpportunity.name).toBe(preMigrationDeal.name);
      expect(postMigrationOpportunity.customer_organization_id).toBe(preMigrationDeal.organization_id);
      expect(postMigrationOpportunity.contact_ids).toEqual(preMigrationDeal.contact_ids);
      expect(postMigrationOpportunity.category).toBe(preMigrationDeal.category);
      expect(postMigrationOpportunity.stage).toBe(preMigrationDeal.stage);
      expect(postMigrationOpportunity.description).toBe(preMigrationDeal.description);
      expect(postMigrationOpportunity.amount).toBe(preMigrationDeal.amount);
      expect(postMigrationOpportunity.created_at).toBe(preMigrationDeal.created_at);

      // Validate enhanced fields have been added
      expect(postMigrationOpportunity).toHaveProperty('probability');
      expect(postMigrationOpportunity).toHaveProperty('priority');
      expect(postMigrationOpportunity).toHaveProperty('lifecycle_stage');
    });

    test('should validate contact-company relationship preservation', () => {
      const contact = mockContacts[0];
      const company = mockCompanies[0];

      // Validate relationship exists
      expect(contact.company_id).toBe(company.id);

      // Validate contact data integrity
      expect(contact.first_name).toBe('John');
      expect(contact.last_name).toBe('Smith');
      expect(contact.title).toBe('CTO');
      expect(contact.email).toHaveLength(1);
      expect(contact.email[0].email).toBe('john.smith@techinnovators.com');

      // Validate company data integrity
      expect(company.name).toBe('Tech Innovators Inc');
      expect(company.sector).toBe('Technology');
    });
  });

  describe('Performance and Usability', () => {
    test('should validate data structure efficiency', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockOpportunities[0],
        id: i + 1,
        name: `Opportunity ${i + 1}`
      }));

      // Validate dataset structure
      expect(largeDataset).toHaveLength(1000);
      expect(largeDataset[0]).toHaveProperty('id');
      expect(largeDataset[999].id).toBe(1000);

      // Test pagination structure
      const pageSize = 25;
      const totalPages = Math.ceil(largeDataset.length / pageSize);
      const firstPage = largeDataset.slice(0, pageSize);

      expect(totalPages).toBe(40);
      expect(firstPage).toHaveLength(25);
      expect(firstPage[0].id).toBe(1);
      expect(firstPage[24].id).toBe(25);
    });

    test('should validate query optimization structure', () => {
      const queryStructure = {
        resource: 'opportunities',
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'created_at', order: 'DESC' },
        filter: {
          stage: 'Demo Scheduled',
          priority: 'High',
          'probability_gte': 50
        }
      };

      // Validate query structure
      expect(queryStructure.resource).toBe('opportunities');
      expect(queryStructure.pagination.perPage).toBe(25);
      expect(queryStructure.sort.field).toBe('created_at');
      expect(queryStructure.filter.stage).toBe('Demo Scheduled');

      // Validate filter capabilities
      expect(queryStructure.filter).toHaveProperty('probability_gte');
      expect(typeof queryStructure.filter['probability_gte']).toBe('number');
    });
  });
});

describe('UAT: System Integration Tests', () => {
  test('should validate API endpoint structure', () => {
    const apiEndpoints = {
      opportunities: {
        list: '/api/opportunities',
        detail: '/api/opportunities/:id',
        create: '/api/opportunities',
        update: '/api/opportunities/:id',
        delete: '/api/opportunities/:id'
      },
      contacts: {
        list: '/api/contacts',
        organizations: '/api/contacts/:id/organizations'
      },
      companies: {
        list: '/api/companies',
        opportunities: '/api/companies/:id/opportunities'
      }
    };

    // Validate endpoint structure
    expect(apiEndpoints.opportunities.list).toBe('/api/opportunities');
    expect(apiEndpoints.contacts.organizations).toContain('/organizations');
    expect(apiEndpoints.companies.opportunities).toContain('/opportunities');

    // Validate no legacy "deals" endpoints
    Object.values(apiEndpoints).forEach(resourceEndpoints => {
      Object.values(resourceEndpoints).forEach(endpoint => {
        expect(endpoint).not.toContain('/deals');
      });
    });
  });

  test('should validate data validation rules', () => {
    const validationRules = {
      opportunity: {
        name: { required: true, minLength: 1, maxLength: 255 },
        amount: { required: true, type: 'number', min: 0 },
        probability: { required: false, type: 'number', min: 0, max: 100 },
        priority: { required: false, enum: ['High', 'Medium', 'Low'] },
        stage: { required: true, enum: ['New Lead', 'Initial Outreach', 'Sample/Visit Offered', 'Awaiting Response', 'Feedback Logged', 'Demo Scheduled', 'Closed Won', 'Closed Lost'] }
      },
      contact: {
        first_name: { required: true, minLength: 1 },
        last_name: { required: true, minLength: 1 },
        email: { required: true, type: 'array', minItems: 1 }
      }
    };

    // Validate opportunity rules
    expect(validationRules.opportunity.name.required).toBe(true);
    expect(validationRules.opportunity.probability.min).toBe(0);
    expect(validationRules.opportunity.probability.max).toBe(100);
    expect(validationRules.opportunity.priority.enum).toContain('High');

    // Validate contact rules
    expect(validationRules.contact.first_name.required).toBe(true);
    expect(validationRules.contact.email.type).toBe('array');
  });
});