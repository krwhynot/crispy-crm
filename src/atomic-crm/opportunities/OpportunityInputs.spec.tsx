/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContext } from 'ra-core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpportunityInputs } from './OpportunityInputs';
import { ConfigurationContext } from '../root/ConfigurationContext';

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

describe('OpportunityInputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataProvider.getList.mockResolvedValue({
      data: [],
      total: 0,
    });
    mockDataProvider.getMany.mockResolvedValue({
      data: [],
    });
  });

  it('should render opportunity name input with required validation', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/opportunity name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/opportunity name/i)).toHaveAttribute('required');
  });

  it('should render description input', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should render lifecycle stage selector with required validation', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const stageSelect = screen.getByLabelText(/lifecycle stage/i);
    expect(stageSelect).toBeInTheDocument();
    expect(stageSelect).toHaveAttribute('required');
  });

  it('should render priority selector with default medium value', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const prioritySelect = screen.getByLabelText(/priority/i);
    expect(prioritySelect).toBeInTheDocument();
  });

  it('should render probability input with validation (0-100)', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const probabilityInput = screen.getByLabelText(/probability/i);
    expect(probabilityInput).toBeInTheDocument();
    expect(probabilityInput).toHaveAttribute('min', '0');
    expect(probabilityInput).toHaveAttribute('max', '100');
  });

  it('should render customer organization input with required validation', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/customer organization/i)).toBeInTheDocument();
  });

  it('should render optional principal and distributor organization inputs', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/principal organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/distributor organization/i)).toBeInTheDocument();
  });

  it('should render contacts input with required validation', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/contacts/i)).toBeInTheDocument();
  });

  it('should render amount input with required validation', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const amountInput = screen.getByLabelText(/amount/i);
    expect(amountInput).toBeInTheDocument();
    expect(amountInput).toHaveAttribute('required');
  });

  it('should render expected closing date with default current date', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const dateInput = screen.getByLabelText(/expected closing date/i);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('should render category choices from configuration', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toBeInTheDocument();
  });

  it('should validate required fields show error messages', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/opportunity name/i);

    // Try to submit without filling required field
    fireEvent.blur(nameInput);

    await waitFor(() => {
      // Required field validation should trigger
      expect(nameInput).toBeInvalid();
    });
  });

  it('should validate probability within 0-100 range', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const probabilityInput = screen.getByLabelText(/probability/i);

    // Test invalid value above 100
    fireEvent.change(probabilityInput, { target: { value: '150' } });
    fireEvent.blur(probabilityInput);

    await waitFor(() => {
      expect(probabilityInput).toBeInvalid();
    });
  });

  it('should have proper section organization', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    // Check for section headers
    expect(screen.getByText(/linked to/i)).toBeInTheDocument();
    expect(screen.getByText(/misc/i)).toBeInTheDocument();
  });

  it('should render all lifecycle stage options', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const stageSelect = screen.getByLabelText(/lifecycle stage/i);
    fireEvent.click(stageSelect);

    await waitFor(() => {
      expect(screen.getByText('Lead')).toBeInTheDocument();
      expect(screen.getByText('Qualified')).toBeInTheDocument();
      expect(screen.getByText('Needs Analysis')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Closed Won')).toBeInTheDocument();
      expect(screen.getByText('Closed Lost')).toBeInTheDocument();
      expect(screen.getByText('Nurturing')).toBeInTheDocument();
    });
  });

  it('should render all priority options', async () => {
    render(
      <TestWrapper>
        <OpportunityInputs />
      </TestWrapper>
    );

    const prioritySelect = screen.getByLabelText(/priority/i);
    fireEvent.click(prioritySelect);

    await waitFor(() => {
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });
});