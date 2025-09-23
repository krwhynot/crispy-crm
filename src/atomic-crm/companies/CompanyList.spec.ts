/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContext } from 'ra-core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyList } from './CompanyList';
import { ConfigurationContext } from '../root/ConfigurationContext';

// Mock companies data with enhanced organization features
const mockCompanies = [
  {
    id: 1,
    name: 'Acme Corp',
    sector: 'Technology',
    organization_type: 'customer',
    priority: 'A',
    segment: 'Enterprise',
    size: 'Large',
    revenue: 50000000,
    website: 'https://acme.com',
    phone_number: '+1-555-0100',
    address: '123 Tech Street',
    city: 'San Francisco',
    stateAbbr: 'CA',
    country: 'USA',
    is_principal: false,
    is_distributor: false,
    created_at: '2024-01-15T10:00:00Z',
    sales_id: 1
  },
  {
    id: 2,
    name: 'Principal Solutions Inc',
    sector: 'Software',
    organization_type: 'principal',
    priority: 'A',
    segment: 'Enterprise',
    size: 'Large',
    revenue: 100000000,
    website: 'https://principal-solutions.com',
    phone_number: '+1-555-0200',
    address: '456 Principal Ave',
    city: 'Austin',
    stateAbbr: 'TX',
    country: 'USA',
    is_principal: true,
    is_distributor: false,
    created_at: '2024-01-10T10:00:00Z',
    sales_id: 1
  },
  {
    id: 3,
    name: 'Tech Distributors Ltd',
    sector: 'Distribution',
    organization_type: 'distributor',
    priority: 'B',
    segment: 'Channel Partner',
    size: 'Medium',
    revenue: 25000000,
    website: 'https://techdist.com',
    phone_number: '+1-555-0300',
    address: '789 Distribution Way',
    city: 'Chicago',
    stateAbbr: 'IL',
    country: 'USA',
    is_principal: false,
    is_distributor: true,
    created_at: '2024-01-20T10:00:00Z',
    sales_id: 2
  },
  {
    id: 4,
    name: 'Vendor Services Co',
    sector: 'Services',
    organization_type: 'vendor',
    priority: 'C',
    segment: 'SMB',
    size: 'Small',
    revenue: 5000000,
    website: 'https://vendorservices.com',
    phone_number: '+1-555-0400',
    address: '321 Service Road',
    city: 'Denver',
    stateAbbr: 'CO',
    country: 'USA',
    is_principal: false,
    is_distributor: false,
    created_at: '2024-02-01T10:00:00Z',
    sales_id: 1
  },
  {
    id: 5,
    name: 'Prospect Tech Inc',
    sector: 'Technology',
    organization_type: 'prospect',
    priority: 'B',
    segment: 'Mid-Market',
    size: 'Medium',
    revenue: 15000000,
    website: 'https://prospecttech.com',
    phone_number: '+1-555-0500',
    address: '555 Prospect Plaza',
    city: 'Seattle',
    stateAbbr: 'WA',
    country: 'USA',
    is_principal: false,
    is_distributor: false,
    created_at: '2024-01-25T10:00:00Z',
    sales_id: 2
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

describe('CompanyList - Enhanced Organization Features', () => {
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

          if (params.filter.size) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.size === params.filter.size
            );
          }

          if (params.filter.is_principal !== undefined) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.is_principal === params.filter.is_principal
            );
          }

          if (params.filter.is_distributor !== undefined) {
            filteredCompanies = filteredCompanies.filter(company =>
              company.is_distributor === params.filter.is_distributor
            );
          }

          if (params.filter.q) {
            const query = params.filter.q.toLowerCase();
            filteredCompanies = filteredCompanies.filter(company =>
              company.name.toLowerCase().includes(query) ||
              company.sector?.toLowerCase().includes(query) ||
              company.segment?.toLowerCase().includes(query) ||
              company.city?.toLowerCase().includes(query)
            );
          }
        }

        // Apply sorting
        if (params.sort) {
          filteredCompanies.sort((a, b) => {
            const aValue = a[params.sort.field as keyof typeof a];
            const bValue = b[params.sort.field as keyof typeof b];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return params.sort.order === 'ASC'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
              return params.sort.order === 'ASC' ? aValue - bValue : bValue - aValue;
            }

            return 0;
          });
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
  });

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
      expect(screen.getByText('Vendor Services Co')).toBeInTheDocument();
      expect(screen.getByText('Prospect Tech Inc')).toBeInTheDocument();
    });
  });

  it('should display organization types correctly', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Principal')).toBeInTheDocument();
      expect(screen.getByText('Distributor')).toBeInTheDocument();
      expect(screen.getByText('Vendor')).toBeInTheDocument();
      expect(screen.getByText('Prospect')).toBeInTheDocument();
    });
  });

  it('should display priority levels with visual indicators', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument(); // High priority
      expect(screen.getByText('B')).toBeInTheDocument(); // Medium-High priority
      expect(screen.getByText('C')).toBeInTheDocument(); // Medium priority
    });
  });

  it('should display company segments', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('Channel Partner')).toBeInTheDocument();
      expect(screen.getByText('SMB')).toBeInTheDocument();
      expect(screen.getByText('Mid-Market')).toBeInTheDocument();
    });
  });

  it('should display company sizes', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Large')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Small')).toBeInTheDocument();
    });
  });

  it('should display revenue information', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('$50,000,000')).toBeInTheDocument();
      expect(screen.getByText('$100,000,000')).toBeInTheDocument();
      expect(screen.getByText('$25,000,000')).toBeInTheDocument();
      expect(screen.getByText('$5,000,000')).toBeInTheDocument();
      expect(screen.getByText('$15,000,000')).toBeInTheDocument();
    });
  });

  it('should filter by organization type', async () => {
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

  it('should filter by priority level', async () => {
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

  it('should filter by sector', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Apply sector filter
    const sectorFilter = screen.getByLabelText(/sector/i);
    fireEvent.change(sectorFilter, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'companies',
        expect.objectContaining({
          filter: expect.objectContaining({
            sector: 'Technology'
          })
        })
      );
    });
  });

  it('should filter by company size', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Apply size filter
    const sizeFilter = screen.getByLabelText(/size/i);
    fireEvent.change(sizeFilter, { target: { value: 'Large' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'companies',
        expect.objectContaining({
          filter: expect.objectContaining({
            size: 'Large'
          })
        })
      );
    });
  });

  it('should filter principal companies', async () => {
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
    fireEvent.click(principalFilter);

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

  it('should filter distributor companies', async () => {
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
    fireEvent.click(distributorFilter);

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

  it('should perform full-text search across multiple fields', async () => {
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

  it('should search by city/location', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Search by city
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'San Francisco' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'companies',
        expect.objectContaining({
          filter: expect.objectContaining({
            q: 'San Francisco'
          })
        })
      );
    });
  });

  it('should sort by organization type', async () => {
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

  it('should sort by priority level', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Click priority column header to sort
    const priorityHeader = screen.getByText(/priority/i);
    fireEvent.click(priorityHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'companies',
        expect.objectContaining({
          sort: { field: 'priority', order: 'ASC' }
        })
      );
    });
  });

  it('should sort by revenue', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Click revenue column header to sort
    const revenueHeader = screen.getByText(/revenue/i);
    fireEvent.click(revenueHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'companies',
        expect.objectContaining({
          sort: { field: 'revenue', order: 'DESC' }
        })
      );
    });
  });

  it('should display account managers correctly', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  it('should handle pagination with large datasets', async () => {
    const manyCompanies = Array.from({ length: 50 }, (_, i) => ({
      ...mockCompanies[0],
      id: i + 1,
      name: `Company ${i + 1}`,
      organization_type: i % 2 === 0 ? 'customer' : 'prospect'
    }));

    mockDataProvider.getList.mockResolvedValue({
      data: manyCompanies.slice(0, 25),
      total: 50,
    });

    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Company 1')).toBeInTheDocument();
    });

    // Check pagination controls exist
    expect(screen.getByText(/1-25 of 50/i)).toBeInTheDocument();
  });

  it('should support combined filters', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Apply multiple filters
    const orgTypeFilter = screen.getByLabelText(/organization type/i);
    fireEvent.change(orgTypeFilter, { target: { value: 'customer' } });

    const priorityFilter = screen.getByLabelText(/priority/i);
    fireEvent.change(priorityFilter, { target: { value: 'A' } });

    const sectorFilter = screen.getByLabelText(/sector/i);
    fireEvent.change(sectorFilter, { target: { value: 'Technology' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'companies',
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_type: 'customer',
            priority: 'A',
            sector: 'Technology'
          })
        })
      );
    });
  });

  it('should display special indicators for principal and distributor companies', async () => {
    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show special badges or indicators
      const principalRow = screen.getByText('Principal Solutions Inc').closest('tr');
      expect(principalRow).toBeInTheDocument();

      const distributorRow = screen.getByText('Tech Distributors Ltd').closest('tr');
      expect(distributorRow).toBeInTheDocument();

      // These companies should have special visual indicators
      expect(screen.getByText('Principal')).toBeInTheDocument();
      expect(screen.getByText('Distributor')).toBeInTheDocument();
    });
  });

  it('should handle empty results gracefully', async () => {
    mockDataProvider.getList.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(
      <TestWrapper>
        <CompanyList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no companies found/i)).toBeInTheDocument();
    });
  });
});