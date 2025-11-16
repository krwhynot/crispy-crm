import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RightSlideOver } from '../RightSlideOver';

// Mock React Admin hooks
const mockUseGetOne = vi.fn();
const mockUseGetList = vi.fn();
const mockUpdate = vi.fn();
const mockNotify = vi.fn();
const mockRefresh = vi.fn();

vi.mock('react-admin', () => ({
  useGetOne: (...args: any[]) => mockUseGetOne(...args),
  useGetList: (...args: any[]) => mockUseGetList(...args),
  useUpdate: () => [mockUpdate],
  useNotify: () => mockNotify,
  useRefresh: () => mockRefresh,
}));

// Mock usePrefs hook
const mockSetActiveTab = vi.fn();

vi.mock('../../hooks/usePrefs', () => ({
  usePrefs: () => ['details', mockSetActiveTab],
}));

describe('RightSlideOver', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset mocks
    mockOnClose.mockClear();
    mockUseGetOne.mockClear();
    mockUseGetList.mockClear();
    mockUpdate.mockClear();
    mockNotify.mockClear();
    mockRefresh.mockClear();
    mockSetActiveTab.mockClear();
  });

  it('should show empty state when no opportunity selected', () => {
    // Mock useGetOne to return disabled query
    mockUseGetOne.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    // Mock useGetList to return disabled query
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={null} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Select an opportunity to view details')).toBeInTheDocument();
  });

  it('should load and display opportunity details', async () => {
    const mockOpportunity = {
      id: 123,
      name: 'Test Opportunity',
      stage: 'qualification',
      priority: 'high',
      estimated_close_date: '2025-12-31',
      customer_organization_name: 'Acme Corp',
      principal_organization_name: 'Principal Inc',
      notes: 'Test notes',
      days_in_stage: 5,
      nb_interactions: 10,
    };

    // Mock useGetOne to return opportunity data
    mockUseGetOne.mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      error: null,
    });

    // Mock useGetList to return activities
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Verify opportunity name is displayed
    expect(screen.getByText('Test Opportunity')).toBeInTheDocument();

    // Verify details tab shows opportunity information
    expect(screen.getByLabelText('Stage')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    const mockOpportunity = {
      id: 123,
      name: 'Test Opportunity',
      stage: 'qualification',
      priority: 'high',
      estimated_close_date: '2025-12-31',
    };

    // Mock useGetOne to return opportunity data
    mockUseGetOne.mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      error: null,
    });

    // Mock useGetList to return activities
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </QueryClientProvider>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click History tab
    const historyTab = screen.getByRole('tab', { name: /History/i });
    await user.click(historyTab);

    // Verify setActiveTab was called
    expect(mockSetActiveTab).toHaveBeenCalledWith('history');
  });

  it('should display loading state while fetching opportunity', () => {
    // Mock useGetOne to return loading state
    mockUseGetOne.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    // Mock useGetList to return loading state
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display activities in history tab', async () => {
    const user = userEvent.setup();
    const mockOpportunity = {
      id: 123,
      name: 'Test Opportunity',
      stage: 'qualification',
      priority: 'high',
    };

    const mockActivities = [
      {
        id: 1,
        type: 'call',
        subject: 'Follow-up call',
        activity_date: '2025-11-15T10:00:00Z',
      },
      {
        id: 2,
        type: 'email',
        subject: 'Sent proposal',
        activity_date: '2025-11-14T15:30:00Z',
      },
    ];

    // Mock useGetOne to return opportunity data
    mockUseGetOne.mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      error: null,
    });

    // Mock useGetList to return activities
    mockUseGetList.mockReturnValue({
      data: mockActivities,
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </QueryClientProvider>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click History tab
    const historyTab = screen.getByRole('tab', { name: /History/i });
    await user.click(historyTab);

    // Verify activities are displayed
    expect(screen.getByText('Follow-up call')).toBeInTheDocument();
    expect(screen.getByText('Sent proposal')).toBeInTheDocument();
  });

  it('should show empty state when no activities', async () => {
    const user = userEvent.setup();
    const mockOpportunity = {
      id: 123,
      name: 'Test Opportunity',
      stage: 'qualification',
      priority: 'high',
    };

    // Mock useGetOne to return opportunity data
    mockUseGetOne.mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      error: null,
    });

    // Mock useGetList to return empty activities
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </QueryClientProvider>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click History tab
    const historyTab = screen.getByRole('tab', { name: /History/i });
    await user.click(historyTab);

    // Verify empty state is displayed
    expect(screen.getByText('No activity recorded')).toBeInTheDocument();
  });

  it('should update stage when changed', async () => {
    const user = userEvent.setup();
    const mockOpportunity = {
      id: 123,
      name: 'Test Opportunity',
      stage: 'qualification',
      priority: 'high',
    };

    // Mock useGetOne to return opportunity data
    mockUseGetOne.mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      error: null,
    });

    // Mock useGetList to return activities
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    // Mock successful update
    mockUpdate.mockResolvedValue({ data: { ...mockOpportunity, stage: 'proposal' } });

    render(
      <QueryClientProvider client={queryClient}>
        <RightSlideOver isOpen={true} onClose={mockOnClose} opportunityId={123} />
      </QueryClientProvider>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click stage select
    const stageSelect = screen.getByRole('combobox', { name: /stage/i });
    await user.click(stageSelect);

    // Select new stage (proposal)
    const proposalOption = screen.getByRole('option', { name: /proposal/i });
    await user.click(proposalOption);

    // Verify update was called
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'opportunities',
        expect.objectContaining({
          id: 123,
          data: { stage: 'proposal' },
        })
      );
    });

    // Verify success notification
    expect(mockNotify).toHaveBeenCalledWith('Stage updated successfully', { type: 'success' });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
