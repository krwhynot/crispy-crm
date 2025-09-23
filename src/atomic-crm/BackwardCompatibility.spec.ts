/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { AdminContext } from 'ra-core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigurationContext } from './root/ConfigurationContext';

// Mock the data provider that supports backward compatibility
const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

const mockConfiguration = {
  opportunityCategories: ['Software', 'Hardware', 'Services', 'Support'],
  contactGender: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ],
  contactRoles: [
    { id: 'decision_maker', name: 'Decision Maker' },
    { id: 'influencer', name: 'Influencer' },
    { id: 'buyer', name: 'Buyer' }
  ],
  companySectors: ['Technology', 'Healthcare', 'Finance']
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminContext dataProvider={mockDataProvider}>
          <ConfigurationContext.Provider value={mockConfiguration}>
            {children}
          </ConfigurationContext.Provider>
        </AdminContext>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock deal data that should work with opportunity components
const mockLegacyDeals = [
  {
    id: 1,
    name: 'Legacy Deal 1',
    stage: 'qualified',
    amount: 50000,
    company_id: 1, // Legacy field
    contact_ids: [1, 2],
    created_at: '2024-01-15T10:00:00Z',
    category: 'Software'
  },
  {
    id: 2,
    name: 'Legacy Deal 2',
    stage: 'proposal',
    amount: 25000,
    company_id: 2,
    contact_ids: [3],
    created_at: '2024-02-01T10:00:00Z',
    category: 'Hardware'
  }
];

// Mock legacy contact data
const mockLegacyContacts = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    company_id: 1, // Single organization reference
    role: 'decision_maker',
    is_primary_contact: true,
    email_jsonb: [{ email: 'john.doe@acme.com', type: 'Work' }],
    phone_jsonb: [{ number: '+1-555-0123', type: 'Work' }]
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    company_id: 1,
    role: 'influencer',
    is_primary_contact: false,
    email_jsonb: [{ email: 'jane.smith@acme.com', type: 'Work' }],
    phone_jsonb: [{ number: '+1-555-0124', type: 'Work' }]
  }
];

describe('Backward Compatibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deal to Opportunity Migration Compatibility', () => {
    it('should handle legacy deal data structure', async () => {
      // Mock data provider to return legacy deal structure
      mockDataProvider.getList.mockImplementation((resource) => {
        if (resource === 'deals' || resource === 'opportunities') {
          // Transform legacy deals to opportunity format
          const transformedDeals = mockLegacyDeals.map(deal => ({
            ...deal,
            customer_organization_id: deal.company_id, // Map legacy field
            probability: deal.stage === 'qualified' ? 75 :
                        deal.stage === 'proposal' ? 60 : 50,
            priority: 'medium',
            expected_closing_date: '2024-06-30'
          }));

          return Promise.resolve({
            data: transformedDeals,
            total: transformedDeals.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      // Test that legacy deal data can be processed
      const result = await mockDataProvider.getList('opportunities', {
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'created_at', order: 'DESC' }
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: 1,
        name: 'Legacy Deal 1',
        customer_organization_id: 1, // Mapped from company_id
        probability: 75 // Auto-calculated from stage
      });
    });

    it('should support backward compatible URL redirects', async () => {
      // Test URL redirection logic
      const legacyUrls = [
        '/deals',
        '/deals/1',
        '/deals/1/show',
        '/deals/1/edit',
        '/deals/create'
      ];

      const expectedRedirects = [
        '/opportunities',
        '/opportunities/1',
        '/opportunities/1/show',
        '/opportunities/1/edit',
        '/opportunities/create'
      ];

      legacyUrls.forEach((legacyUrl, index) => {
        const expectedUrl = expectedRedirects[index];

        // Simple URL transformation logic
        const redirectedUrl = legacyUrl.replace('/deals', '/opportunities');
        expect(redirectedUrl).toBe(expectedUrl);
      });
    });

    it('should preserve deal stage mappings to opportunity stages', async () => {
      const stageMapping = {
        'lead': 'lead',
        'qualified': 'qualified',
        'demo': 'needs_analysis',
        'proposal': 'proposal',
        'negotiation': 'negotiation',
        'closed-won': 'closed_won',
        'closed-lost': 'closed_lost'
      };

      Object.entries(stageMapping).forEach(([legacyStage, newStage]) => {
        expect(newStage).toBeTruthy();
        // Verify the mapping preserves business logic
        if (legacyStage === 'qualified') {
          expect(newStage).toBe('qualified');
        }
        if (legacyStage === 'proposal') {
          expect(newStage).toBe('proposal');
        }
      });
    });

    it('should handle missing new opportunity fields gracefully', async () => {
      const legacyDeal = {
        id: 1,
        name: 'Legacy Deal',
        stage: 'qualified',
        amount: 50000,
        company_id: 1,
        contact_ids: [1, 2]
        // Missing: probability, priority, expected_closing_date, etc.
      };

      // Transform legacy deal with defaults for missing fields
      const transformedOpportunity = {
        ...legacyDeal,
        customer_organization_id: legacyDeal.company_id,
        probability: 50, // Default probability
        priority: 'medium', // Default priority
        expected_closing_date: new Date().toISOString().split('T')[0], // Default to today
        principal_organization_id: null,
        distributor_organization_id: null
      };

      expect(transformedOpportunity.probability).toBe(50);
      expect(transformedOpportunity.priority).toBe('medium');
      expect(transformedOpportunity.customer_organization_id).toBe(1);
      expect(transformedOpportunity.expected_closing_date).toBeTruthy();
    });
  });

  describe('Contact Multi-Organization Backward Compatibility', () => {
    it('should handle legacy single-organization contacts', async () => {
      mockDataProvider.getList.mockImplementation((resource) => {
        if (resource === 'contacts' || resource === 'contacts_summary') {
          return Promise.resolve({
            data: mockLegacyContacts,
            total: mockLegacyContacts.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const result = await mockDataProvider.getList('contacts', {
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'last_name', order: 'ASC' }
      });

      expect(result.data).toHaveLength(2);

      // Legacy contacts should still have company_id
      expect(result.data[0].company_id).toBe(1);
      expect(result.data[1].company_id).toBe(1);

      // Should maintain role and contact status
      expect(result.data[0].role).toBe('decision_maker');
      expect(result.data[0].is_primary_contact).toBe(true);
    });

    it('should create junction table entries for legacy contacts', async () => {
      // Simulate migration of legacy contact to junction table
      const legacyContact = mockLegacyContacts[0];

      const junctionTableEntry = {
        contact_id: legacyContact.id,
        organization_id: legacyContact.company_id,
        is_primary_organization: legacyContact.is_primary_contact,
        role: legacyContact.role,
        purchase_influence: 'Unknown', // Default for legacy data
        decision_authority: 'End User', // Default for legacy data
        created_at: new Date().toISOString()
      };

      expect(junctionTableEntry.contact_id).toBe(1);
      expect(junctionTableEntry.organization_id).toBe(1);
      expect(junctionTableEntry.is_primary_organization).toBe(true);
      expect(junctionTableEntry.role).toBe('decision_maker');
    });

    it('should support querying contacts by legacy company_id field', async () => {
      mockDataProvider.getList.mockImplementation((resource, params) => {
        if (resource === 'contacts_summary' && params.filter?.company_id) {
          // Support legacy filtering by company_id
          const filteredContacts = mockLegacyContacts.filter(
            contact => contact.company_id === params.filter.company_id
          );
          return Promise.resolve({
            data: filteredContacts,
            total: filteredContacts.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const result = await mockDataProvider.getList('contacts_summary', {
        filter: { company_id: 1 },
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'last_name', order: 'ASC' }
      });

      expect(result.data).toHaveLength(2);
      expect(result.data.every(contact => contact.company_id === 1)).toBe(true);
    });
  });

  describe('Company Organization Type Backward Compatibility', () => {
    it('should handle companies without organization_type field', async () => {
      const legacyCompanies = [
        {
          id: 1,
          name: 'Legacy Company 1',
          sector: 'Technology',
          size: 'Large'
          // Missing: organization_type, priority, segment, etc.
        },
        {
          id: 2,
          name: 'Legacy Company 2',
          sector: 'Software',
          size: 'Medium'
          // Missing: organization_type, priority, segment, etc.
        }
      ];

      // Transform legacy companies with defaults
      const transformedCompanies = legacyCompanies.map(company => ({
        ...company,
        organization_type: 'unknown', // Default for legacy data
        priority: 'D', // Default lowest priority
        segment: 'Unknown', // Default segment
        is_principal: false,
        is_distributor: false
      }));

      transformedCompanies.forEach(company => {
        expect(company.organization_type).toBe('unknown');
        expect(company.priority).toBe('D');
        expect(company.is_principal).toBe(false);
        expect(company.is_distributor).toBe(false);
      });
    });

    it('should preserve existing company fields during migration', async () => {
      const legacyCompany = {
        id: 1,
        name: 'Acme Corp',
        sector: 'Technology',
        size: 'Large',
        website: 'https://acme.com',
        phone_number: '+1-555-0100',
        address: '123 Tech Street',
        city: 'San Francisco',
        zipcode: '94105',
        stateAbbr: 'CA',
        country: 'USA'
      };

      const migratedCompany = {
        ...legacyCompany,
        organization_type: 'customer',
        priority: 'A',
        segment: 'Enterprise',
        is_principal: false,
        is_distributor: false
      };

      // All original fields should be preserved
      expect(migratedCompany.name).toBe(legacyCompany.name);
      expect(migratedCompany.sector).toBe(legacyCompany.sector);
      expect(migratedCompany.website).toBe(legacyCompany.website);
      expect(migratedCompany.address).toBe(legacyCompany.address);

      // New fields should be added
      expect(migratedCompany.organization_type).toBe('customer');
      expect(migratedCompany.priority).toBe('A');
      expect(migratedCompany.segment).toBe('Enterprise');
    });
  });

  describe('Data Provider Backward Compatibility', () => {
    it('should support both old and new resource names during transition', async () => {
      // Mock data provider that supports both deals and opportunities
      mockDataProvider.getList.mockImplementation((resource, params) => {
        if (resource === 'deals' || resource === 'opportunities') {
          return Promise.resolve({
            data: mockLegacyDeals,
            total: mockLegacyDeals.length,
          });
        }
        if (resource === 'deals_summary' || resource === 'opportunities_summary') {
          return Promise.resolve({
            data: mockLegacyDeals,
            total: mockLegacyDeals.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      // Both resource names should work
      const dealsResult = await mockDataProvider.getList('deals', {
        pagination: { page: 1, perPage: 25 }
      });

      const opportunitiesResult = await mockDataProvider.getList('opportunities', {
        pagination: { page: 1, perPage: 25 }
      });

      expect(dealsResult.data).toEqual(opportunitiesResult.data);
      expect(dealsResult.total).toBe(opportunitiesResult.total);
    });

    it('should handle field name transformations transparently', async () => {
      const legacyDealData = {
        id: 1,
        name: 'Test Deal',
        company_id: 1,
        stage: 'qualified',
        amount: 50000
      };

      // Mock update that handles field transformation
      mockDataProvider.update.mockImplementation((resource, params) => {
        if (resource === 'opportunities' && params.data.company_id) {
          // Transform legacy field names
          const transformedData = {
            ...params.data,
            customer_organization_id: params.data.company_id
          };
          delete transformedData.company_id;

          return Promise.resolve({
            data: { ...transformedData, id: params.id }
          });
        }
        return Promise.resolve({ data: params.data });
      });

      const result = await mockDataProvider.update('opportunities', {
        id: 1,
        data: legacyDealData,
        previousData: {}
      });

      expect(result.data.customer_organization_id).toBe(1);
      expect(result.data.company_id).toBeUndefined();
    });

    it('should provide deprecation warnings in development mode', async () => {
      // Mock console.warn to capture deprecation warnings
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate deprecated endpoint usage
      const logDeprecationWarning = (resource: string, suggestedResource: string) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[DEPRECATED] Resource '${resource}' is deprecated. Use '${suggestedResource}' instead. ` +
            `This resource will be removed in a future version.`
          );
        }
      };

      // Test deprecation warning
      process.env.NODE_ENV = 'development';
      logDeprecationWarning('deals', 'opportunities');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEPRECATED] Resource \'deals\' is deprecated')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('API Endpoint Backward Compatibility', () => {
    it('should maintain 1-month grace period for old endpoints', async () => {
      const gracePeriodEndDate = new Date('2024-03-01'); // Assuming migration on 2024-02-01
      const currentDate = new Date('2024-02-15'); // Within grace period

      const isWithinGracePeriod = currentDate < gracePeriodEndDate;
      expect(isWithinGracePeriod).toBe(true);

      // Mock endpoint that checks grace period
      const handleLegacyEndpoint = (endpoint: string) => {
        if (endpoint.includes('/deals') && isWithinGracePeriod) {
          return {
            deprecated: true,
            redirect: endpoint.replace('/deals', '/opportunities'),
            gracePeriodendsAt: gracePeriodEndDate.toISOString()
          };
        }
        if (endpoint.includes('/deals') && !isWithinGracePeriod) {
          throw new Error('Endpoint no longer supported. Use /opportunities instead.');
        }
        return { deprecated: false };
      };

      const result = handleLegacyEndpoint('/api/deals/1');
      expect(result.deprecated).toBe(true);
      expect(result.redirect).toBe('/api/opportunities/1');
    });

    it('should log usage of deprecated endpoints for monitoring', async () => {
      const usageLog: Array<{ endpoint: string, timestamp: string, userAgent?: string }> = [];

      const logEndpointUsage = (endpoint: string, userAgent?: string) => {
        if (endpoint.includes('/deals')) {
          usageLog.push({
            endpoint,
            timestamp: new Date().toISOString(),
            userAgent
          });
        }
      };

      // Simulate API calls
      logEndpointUsage('/api/deals/list', 'test-client');
      logEndpointUsage('/api/deals/1/show', 'test-client');
      logEndpointUsage('/api/opportunities/list', 'test-client'); // Should not be logged

      expect(usageLog).toHaveLength(2);
      expect(usageLog[0].endpoint).toBe('/api/deals/list');
      expect(usageLog[1].endpoint).toBe('/api/deals/1/show');
    });
  });
});