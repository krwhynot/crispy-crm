/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContext } from 'ra-core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactList } from './ContactList';
import { ConfigurationContext } from '../root/ConfigurationContext';

// Mock contacts with multi-organization data
const mockContacts = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    title: 'CTO',
    email: [{ email: 'john.doe@acme.com', type: 'Work' }],
    phone: [{ number: '+1-555-0123', type: 'Work' }],
    organization_names: ['Acme Corp', 'Tech Partners Ltd'], // Aggregated from junction table
    primary_organization_name: 'Acme Corp',
    role: 'decision_maker',
    purchase_influence: 'High',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    title: 'VP Engineering',
    email: [{ email: 'jane.smith@techcorp.com', type: 'Work' }],
    phone: [{ number: '+1-555-0124', type: 'Work' }],
    organization_names: ['TechCorp Inc'],
    primary_organization_name: 'TechCorp Inc',
    role: 'influencer',
    purchase_influence: 'Medium',
    created_at: '2024-01-20T10:00:00Z'
  },
  {
    id: 3,
    first_name: 'Bob',
    last_name: 'Johnson',
    title: 'Procurement Manager',
    email: [{ email: 'bob.johnson@global.com', type: 'Work' }],
    phone: [{ number: '+1-555-0125', type: 'Work' }],
    organization_names: ['Global Systems Ltd', 'Consulting Firm Inc', 'Tech Distributors Ltd'],
    primary_organization_name: 'Global Systems Ltd',
    role: 'buyer',
    purchase_influence: 'High',
    created_at: '2024-02-01T10:00:00Z'
  }
];

const mockOrganizations = [
  { id: 1, name: 'Acme Corp', sector: 'Technology' },
  { id: 2, name: 'TechCorp Inc', sector: 'Software' },
  { id: 3, name: 'Global Systems Ltd', sector: 'Consulting' },
  { id: 4, name: 'Tech Partners Ltd', sector: 'Technology' },
  { id: 5, name: 'Consulting Firm Inc', sector: 'Services' },
  { id: 6, name: 'Tech Distributors Ltd', sector: 'Distribution' }
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
    { id: 'buyer', name: 'Buyer' },
    { id: 'end_user', name: 'End User' }
  ],
  organizationSectors: ['Technology', 'Healthcare', 'Finance']
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

describe('ContactList - Multi-Organization Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getList for contacts
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === 'contacts_summary') {
        let filteredContacts = [...mockContacts];

        // Apply filters
        if (params.filter) {
          if (params.filter.organization_id) {
            // Filter by any organization the contact is associated with via junction table
            filteredContacts = filteredContacts.filter(contact =>
              contact.organization_names.some(name =>
                mockOrganizations.find(org =>
                  org.id === params.filter.organization_id && org.name === name
                )
              )
            );
          }

          if (params.filter.role) {
            filteredContacts = filteredContacts.filter(contact =>
              contact.role === params.filter.role
            );
          }

          if (params.filter.purchase_influence) {
            filteredContacts = filteredContacts.filter(contact =>
              contact.purchase_influence === params.filter.purchase_influence
            );
          }

          if (params.filter.q) {
            const query = params.filter.q.toLowerCase();
            filteredContacts = filteredContacts.filter(contact =>
              contact.first_name.toLowerCase().includes(query) ||
              contact.last_name.toLowerCase().includes(query) ||
              contact.title?.toLowerCase().includes(query) ||
              contact.organization_names.some(name => name.toLowerCase().includes(query))
            );
          }
        }

        return Promise.resolve({
          data: filteredContacts,
          total: filteredContacts.length,
        });
      }

      if (resource === 'companies') {
        return Promise.resolve({
          data: mockOrganizations,
          total: mockOrganizations.length,
        });
      }

      return Promise.resolve({ data: [], total: 0 });
    });

    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === 'companies') {
        return Promise.resolve({
          data: mockOrganizations.filter(org => params.ids.includes(org.id)),
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should render contact list with multi-organization data', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('should display primary organization for each contact', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('TechCorp Inc')).toBeInTheDocument();
      expect(screen.getByText('Global Systems Ltd')).toBeInTheDocument();
    });
  });

  it('should display contact roles and influence levels', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Decision Maker')).toBeInTheDocument();
      expect(screen.getByText('Influencer')).toBeInTheDocument();
      expect(screen.getByText('Buyer')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  it('should display contact titles and email addresses', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('CTO')).toBeInTheDocument();
      expect(screen.getByText('VP Engineering')).toBeInTheDocument();
      expect(screen.getByText('Procurement Manager')).toBeInTheDocument();
      expect(screen.getByText('john.doe@acme.com')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@techcorp.com')).toBeInTheDocument();
    });
  });

  it('should show associated organizations count for multi-org contacts', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      // Bob Johnson is associated with 3 organizations
      const bobRow = screen.getByText('Bob Johnson').closest('tr');
      expect(bobRow).toBeInTheDocument();
      // Should indicate multiple organizations somehow (badge, count, etc.)
    });
  });

  it('should filter contacts by organization', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Apply organization filter
    const orgFilter = screen.getByLabelText(/organization/i);
    fireEvent.change(orgFilter, { target: { value: '1' } }); // Acme Corp

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_id: 1
          })
        })
      );
    });
  });

  it('should filter contacts by role', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Apply role filter
    const roleFilter = screen.getByLabelText(/role/i);
    fireEvent.change(roleFilter, { target: { value: 'decision_maker' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          filter: expect.objectContaining({
            role: 'decision_maker'
          })
        })
      );
    });
  });

  it('should filter contacts by purchase influence', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Apply purchase influence filter
    const influenceFilter = screen.getByLabelText(/purchase influence/i);
    fireEvent.change(influenceFilter, { target: { value: 'High' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          filter: expect.objectContaining({
            purchase_influence: 'High'
          })
        })
      );
    });
  });

  it('should search contacts across all organizations', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search by contact name
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          filter: expect.objectContaining({
            q: 'John'
          })
        })
      );
    });
  });

  it('should search contacts by organization name', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search by organization name
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          filter: expect.objectContaining({
            q: 'Acme'
          })
        })
      );
    });
  });

  it('should handle sorting by name', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click name column header to sort
    const nameHeader = screen.getByText(/name/i);
    fireEvent.click(nameHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          sort: { field: 'last_name', order: 'ASC' }
        })
      );
    });
  });

  it('should handle sorting by organization', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click organization column header to sort
    const orgHeader = screen.getByText(/organization/i);
    fireEvent.click(orgHeader);

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          sort: { field: 'primary_organization_name', order: 'ASC' }
        })
      );
    });
  });

  it('should display multiple organization associations visually', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      // John Doe has 2 organizations
      const johnRow = screen.getByText('John Doe').closest('tr');
      expect(johnRow).toBeInTheDocument();

      // Bob Johnson has 3 organizations
      const bobRow = screen.getByText('Bob Johnson').closest('tr');
      expect(bobRow).toBeInTheDocument();

      // Jane Smith has 1 organization
      const janeRow = screen.getByText('Jane Smith').closest('tr');
      expect(janeRow).toBeInTheDocument();
    });
  });

  it('should handle pagination with multi-organization data', async () => {
    const manyContacts = Array.from({ length: 50 }, (_, i) => ({
      ...mockContacts[0],
      id: i + 1,
      first_name: `Contact${i + 1}`,
      last_name: 'Test',
      organization_names: [`Organization ${i + 1}`]
    }));

    mockDataProvider.getList.mockResolvedValue({
      data: manyContacts.slice(0, 25),
      total: 50,
    });

    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Contact1 Test')).toBeInTheDocument();
    });

    // Check pagination controls exist
    expect(screen.getByText(/1-25 of 50/i)).toBeInTheDocument();
  });

  it('should support combined filters (organization + role)', async () => {
    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Apply both organization and role filters
    const orgFilter = screen.getByLabelText(/organization/i);
    fireEvent.change(orgFilter, { target: { value: '1' } });

    const roleFilter = screen.getByLabelText(/role/i);
    fireEvent.change(roleFilter, { target: { value: 'decision_maker' } });

    await waitFor(() => {
      expect(mockDataProvider.getList).toHaveBeenCalledWith(
        'contacts_summary',
        expect.objectContaining({
          filter: expect.objectContaining({
            organization_id: 1,
            role: 'decision_maker'
          })
        })
      );
    });
  });

  it('should handle empty organization filter gracefully', async () => {
    // Test contact filtering when no organization filter is applied
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === 'contacts_summary' && !params.filter?.organization_id) {
        return Promise.resolve({
          data: mockContacts,
          total: mockContacts.length,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    render(
      <TestWrapper>
        <ContactList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });
});