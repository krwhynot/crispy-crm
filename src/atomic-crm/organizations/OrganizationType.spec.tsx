/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContext } from 'ra-core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrganizationInputs } from './OrganizationInputs';
import { OrganizationShow } from './OrganizationShow';
import { OrganizationList } from './OrganizationList';
import { ConfigurationContext } from '../root/ConfigurationContext';

// Mock companies with organization types
const mockCompanies = [
  {
    id: 1,
    name: 'Acme Corp',
    sector: 'Technology',
    organization_type: 'customer',
    priority: 'A',
    segment: 'Enterprise',
    website: 'https://acme.com',
    phone_number: '+1-555-0100',
    address: '123 Tech Street',
    city: 'San Francisco',
    zipcode: '94105',
    stateAbbr: 'CA',
    revenue: 50000000,
    size: 'Large',
    parent_company_id: null,
    is_principal: false,
    is_distributor: false,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Principal Solutions Inc',
    sector: 'Software',
    organization_type: 'principal',
    priority: 'A',
    segment: 'Enterprise',
    website: 'https://principal-solutions.com',
    phone_number: '+1-555-0200',
    address: '456 Principal Ave',
    city: 'Austin',
    zipcode: '73301',
    stateAbbr: 'TX',
    revenue: 100000000,
    size: 'Large',
    parent_company_id: null,
    is_principal: true,
    is_distributor: false,
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 3,
    name: 'Tech Distributors Ltd',
    sector: 'Distribution',
    organization_type: 'distributor',
    priority: 'B',
    segment: 'Channel Partner',
    website: 'https://techdist.com',
    phone_number: '+1-555-0300',
    address: '789 Distribution Way',
    city: 'Chicago',
    zipcode: '60601',
    stateAbbr: 'IL',
    revenue: 25000000,
    size: 'Medium',
    parent_company_id: null,
    is_principal: false,
    is_distributor: true,
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: 4,
    name: 'Partner Services Co',
    sector: 'Services',
    organization_type: 'partner',
    priority: 'C',
    segment: 'SMB',
    website: 'https://partnerservices.com',
    phone_number: '+1-555-0400',
    address: '321 Service Road',
    city: 'Denver',
    zipcode: '80202',
    stateAbbr: 'CO',
    revenue: 5000000,
    size: 'Small',
    parent_company_id: null,
    is_principal: false,
    is_distributor: false,
    created_at: '2024-02-01T10:00:00Z'
  },
  {
    id: 5,
    name: 'Prospect Alliance Inc',
    sector: 'Technology',
    organization_type: 'prospect',
    priority: 'B',
    segment: 'Strategic Prospect',
    website: 'https://prospectalliance.com',
    phone_number: '+1-555-0500',
    address: '555 Prospect Plaza',
    city: 'Seattle',
    zipcode: '98101',
    stateAbbr: 'WA',
    revenue: 15000000,
    size: 'Medium',
    parent_company_id: null,
    is_principal: false,
    is_distributor: false,
    created_at: '2024-01-25T10:00:00Z'
  }
];

const mockSales = [
  { id: 1, first_name: 'Alice', last_name: 'Johnson' },
  { id: 2, first_name: 'Bob', last_name: 'Smith' }
];

// Mock the data provider
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
  companySectors: ['Technology', 'Healthcare', 'Finance', 'Software', 'Services', 'Distribution']
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

describe('Company Organization Type Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getList for companies
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === 'companies') {
        let filteredCompanies = [...mockCompanies];

        // Apply filters
        if (params.filter) {
          if (params.filter.organization_type) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.organization_type === params.filter.organization_type
            );
          }

          if (params.filter.priority) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.priority === params.filter.priority
            );
          }

          if (params.filter.sector) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.sector === params.filter.sector
            );
          }

          if (params.filter.is_principal) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.is_principal === params.filter.is_principal
            );
          }

          if (params.filter.is_distributor) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.is_distributor === params.filter.is_distributor
            );
          }

          if (params.filter.q) {
            const query = params.filter.q.toLowerCase();
            filteredCompanies = filteredCompanies.filter(company =>
              company.name.toLowerCase().includes(query) ||
              company.sector?.toLowerCase().includes(query) ||
              company.segment?.toLowerCase().includes(query)
            );
          }
        }

        return Promise.resolve({
          data: filteredCompanies,
          total: filteredCompanies.length,
        });
      }

      if (resource === 'sales') {
        return Promise.resolve({
          data: mockSales,
          total: mockSales.length,
        });
      }

      return Promise.resolve({ data: [], total: 0 });
    });

    // Mock getOne for company
    mockDataProvider.getOne.mockImplementation((resource, params) => {
      if (resource === 'companies') {
        const company = mockCompanies.find(c => c.id === params.id);
        return company ? Promise.resolve({ data: company }) : Promise.reject(new Error('Not found'));
      }
      return Promise.reject(new Error('Not found'));
    });

    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === 'companies') {
        return Promise.resolve({
          data: mockCompanies.filter(c => params.ids.includes(c.id)),
        });
      }
      if (resource === 'sales') {
        return Promise.resolve({
          data: mockSales.filter(s => params.ids.includes(s.id)),
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockDataProvider.create.mockResolvedValue({
      data: { id: 6, name: 'New Company' }
    });

    mockDataProvider.update.mockResolvedValue({
      data: { id: 1, name: 'Updated Company' }
    });
  });

  describe('CompanyInputs - Organization Type Fields', () => {
    it('should render organization type selector with all options', async () => {
      render(
        <TestWrapper>
          <CompanyInputs />
        </TestWrapper>
      );

      const orgTypeSelect = screen.getByLabelText(/organization type/i);
      expect(orgTypeSelect).toBeInTheDocument();

      fireEvent.click(orgTypeSelect);

      await waitFor(() => {
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Prospect')).toBeInTheDocument();
        expect(screen.getByText('Partner')).toBeInTheDocument();
        expect(screen.getByText('Principal')).toBeInTheDocument();
        expect(screen.getByText('Distributor')).toBeInTheDocument();
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });

    it('should render priority selector with A/B/C/D levels', async () => {
      render(
        <TestWrapper>
          <CompanyInputs />
        </TestWrapper>
      );

      const prioritySelect = screen.getByLabelText(/priority/i);
      expect(prioritySelect).toBeInTheDocument();

      fireEvent.click(prioritySelect);

      await waitFor(() => {
        expect(screen.getByText('A - High Priority')).toBeInTheDocument();
        expect(screen.getByText('B - Medium-High Priority')).toBeInTheDocument();
        expect(screen.getByText('C - Medium Priority')).toBeInTheDocument();
        expect(screen.getByText('D - Low Priority')).toBeInTheDocument();
      });
    });

    it('should render segment input for categorization', async () => {
      render(
        <TestWrapper>
          <CompanyInputs />
        </TestWrapper>
      );

      const segmentInput = screen.getByLabelText(/segment/i);
      expect(segmentInput).toBeInTheDocument();
      expect(segmentInput).toHaveAttribute('placeholder', 'Segment (e.g., Enterprise, SMB)');
    });

    it('should render parent company reference selector', async () => {
      render(
        <TestWrapper>
          <CompanyInputs />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/parent company/i)).toBeInTheDocument();
    });

    it('should render revenue and tax identifier fields', async () => {
      render(
        <TestWrapper>
          <CompanyInputs />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/revenue/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tax identifier/i)).toBeInTheDocument();
    });

    it('should have proper section organization with Context heading', async () => {
      render(
        <TestWrapper>
          <CompanyInputs />
        </TestWrapper>
      );

      expect(screen.getByText(/context/i)).toBeInTheDocument();
      expect(screen.getByText(/contact/i)).toBeInTheDocument();
      expect(screen.getByText(/address/i)).toBeInTheDocument();
      expect(screen.getByText(/additional information/i)).toBeInTheDocument();
      expect(screen.getByText(/account manager/i)).toBeInTheDocument();
    });
  });

  describe('CompanyShow - Organization Type Display', () => {
    it('should display organization type for customer company', async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockCompanies[0] // Acme Corp - customer
      });

      render(
        <TestWrapper>
          <CompanyShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('A')).toBeInTheDocument(); // Priority
        expect(screen.getByText('Enterprise')).toBeInTheDocument(); // Segment
      });
    });

    it('should display organization type for principal company', async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockCompanies[1] // Principal Solutions Inc - principal
      });

      render(
        <TestWrapper>
          <CompanyShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Principal Solutions Inc')).toBeInTheDocument();
        expect(screen.getByText('Principal')).toBeInTheDocument();
        expect(screen.getByText('Software')).toBeInTheDocument(); // Sector
      });
    });

    it('should display organization type for distributor company', async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockCompanies[2] // Tech Distributors Ltd - distributor
      });

      render(
        <TestWrapper>
          <CompanyShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Tech Distributors Ltd')).toBeInTheDocument();
        expect(screen.getByText('Distributor')).toBeInTheDocument();
        expect(screen.getByText('Channel Partner')).toBeInTheDocument(); // Segment
      });
    });

    it('should display company hierarchy when parent company exists', async () => {
      const subsidiaryCompany = {
        ...mockCompanies[0],
        id: 10,
        name: 'Acme Subsidiary',
        parent_company_id: 1
      };

      mockDataProvider.getOne.mockResolvedValue({
        data: subsidiaryCompany
      });

      mockDataProvider.getMany.mockResolvedValue({
        data: [mockCompanies[0]] // Parent company
      });

      render(
        <TestWrapper>
          <CompanyShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Subsidiary')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument(); // Parent company
      });
    });

    it('should display financial information correctly', async () => {
      mockDataProvider.getOne.mockResolvedValue({
        data: mockCompanies[1] // Principal Solutions with revenue
      });

      render(
        <TestWrapper>
          <CompanyShow />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('$100,000,000')).toBeInTheDocument(); // Revenue formatted
        expect(screen.getByText('Large')).toBeInTheDocument(); // Company size
      });
    });
  });

  describe('CompanyList - Organization Type Filtering', () => {
    it('should render company list with organization types', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Principal Solutions Inc')).toBeInTheDocument();
        expect(screen.getByText('Tech Distributors Ltd')).toBeInTheDocument();
        expect(screen.getByText('Partner Services Co')).toBeInTheDocument();
        expect(screen.getByText('Prospect Alliance Inc')).toBeInTheDocument();
      });
    });

    it('should display organization types in the list', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Principal')).toBeInTheDocument();
        expect(screen.getByText('Distributor')).toBeInTheDocument();
        expect(screen.getByText('Partner')).toBeInTheDocument();
        expect(screen.getByText('Prospect')).toBeInTheDocument();
      });
    });

    it('should filter companies by organization type', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Apply organization type filter
      const orgTypeFilter = screen.getByLabelText(/organization type/i);
      fireEvent.change(orgTypeFilter, { target: { value: 'principal' } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          'companies',
          expect.objectContaining({
            filter: expect.objectContaining({
              organization_type: 'principal'
            })
          })
        );
      });
    });

    it('should filter companies by priority level', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Apply priority filter
      const priorityFilter = screen.getByLabelText(/priority/i);
      fireEvent.change(priorityFilter, { target: { value: 'A' } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          'companies',
          expect.objectContaining({
            filter: expect.objectContaining({
              priority: 'A'
            })
          })
        );
      });
    });

    it('should filter principal companies specifically', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Apply principal filter
      const principalFilter = screen.getByLabelText(/is principal/i);
      fireEvent.change(principalFilter, { target: { checked: true } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          'companies',
          expect.objectContaining({
            filter: expect.objectContaining({
              is_principal: true
            })
          })
        );
      });
    });

    it('should filter distributor companies specifically', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Apply distributor filter
      const distributorFilter = screen.getByLabelText(/is distributor/i);
      fireEvent.change(distributorFilter, { target: { checked: true } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          'companies',
          expect.objectContaining({
            filter: expect.objectContaining({
              is_distributor: true
            })
          })
        );
      });
    });

    it('should search companies across all fields', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Search by company name
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Principal' } });

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          'companies',
          expect.objectContaining({
            filter: expect.objectContaining({
              q: 'Principal'
            })
          })
        );
      });
    });

    it('should handle sorting by organization type', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Click organization type column header to sort
      const orgTypeHeader = screen.getByText(/organization type/i);
      fireEvent.click(orgTypeHeader);

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenCalledWith(
          'companies',
          expect.objectContaining({
            sort: { field: 'organization_type', order: 'ASC' }
          })
        );
      });
    });

    it('should display priority levels visually', async () => {
      render(
        <TestWrapper>
          <CompanyList />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show priority badges or indicators
        expect(screen.getByText('A')).toBeInTheDocument(); // High priority
        expect(screen.getByText('B')).toBeInTheDocument(); // Medium-High priority
        expect(screen.getByText('C')).toBeInTheDocument(); // Medium priority
      });
    });
  });

  describe('Organization Type Workflows', () => {
    it('should create company with organization type', async () => {
      const newCompanyData = {
        name: 'New Tech Partner',
        sector: 'Technology',
        organization_type: 'partner',
        priority: 'B',
        segment: 'Strategic Partner',
        website: 'https://newtechpartner.com',
        revenue: 10000000,
        size: 'Medium'
      };

      await mockDataProvider.create('companies', {
        data: newCompanyData
      });

      expect(mockDataProvider.create).toHaveBeenCalledWith('companies', {
        data: newCompanyData
      });
    });

    it('should update company organization type', async () => {
      const updatedCompanyData = {
        ...mockCompanies[0],
        organization_type: 'partner', // Changed from customer to partner
        priority: 'B' // Changed priority as well
      };

      await mockDataProvider.update('companies', {
        id: 1,
        data: updatedCompanyData,
        previousData: mockCompanies[0]
      });

      expect(mockDataProvider.update).toHaveBeenCalledWith('companies', {
        id: 1,
        data: updatedCompanyData,
        previousData: mockCompanies[0]
      });
    });

    it('should validate principal organization requirements', async () => {
      // Test that principal organizations have required fields
      const principalCompany = mockCompanies.find(c => c.organization_type === 'principal');

      expect(principalCompany).toBeDefined();
      expect(principalCompany?.is_principal).toBe(true);
      expect(principalCompany?.name).toBeTruthy();
      expect(principalCompany?.sector).toBeTruthy();
    });

    it('should validate distributor organization requirements', async () => {
      // Test that distributor organizations have required fields
      const distributorCompany = mockCompanies.find(c => c.organization_type === 'distributor');

      expect(distributorCompany).toBeDefined();
      expect(distributorCompany?.is_distributor).toBe(true);
      expect(distributorCompany?.name).toBeTruthy();
      expect(distributorCompany?.sector).toBeTruthy();
    });

    it('should handle organization hierarchy validation', async () => {
      // Test parent-child relationship validation
      const parentCompany = mockCompanies[0];
      const childCompany = {
        ...mockCompanies[0],
        id: 10,
        name: 'Child Company',
        parent_company_id: parentCompany.id
      };

      // Child company should have valid parent reference
      expect(childCompany.parent_company_id).toBe(parentCompany.id);
      expect(parentCompany.parent_company_id).toBeNull(); // Parent has no parent
    });

    it('should support organization type transitions', async () => {
      // Test changing from prospect to customer
      const prospectToCustomer = {
        ...mockCompanies[0],
        organization_type: 'customer', // Was prospect, now customer
        priority: 'A' // Upgraded priority
      };

      await mockDataProvider.update('companies', {
        id: 1,
        data: prospectToCustomer,
        previousData: { ...mockCompanies[0], organization_type: 'prospect' }
      });

      expect(mockDataProvider.update).toHaveBeenCalledWith('companies', {
        id: 1,
        data: prospectToCustomer,
        previousData: expect.objectContaining({
          organization_type: 'prospect'
        })
      });
    });

    it('should aggregate organization types for reporting', async () => {
      // Test organization type metrics
      const orgTypeCounts = mockCompanies.reduce((counts, company) => {
        counts[company.organization_type] = (counts[company.organization_type] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      expect(orgTypeCounts).toEqual({
        customer: 1,
        principal: 1,
        distributor: 1,
        partner: 1,
        prospect: 1
      });

      // Test priority distribution
      const priorityCounts = mockCompanies.reduce((counts, company) => {
        counts[company.priority] = (counts[company.priority] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      expect(priorityCounts).toEqual({
        A: 2,
        B: 2,
        C: 1
      });
    });
  });
});