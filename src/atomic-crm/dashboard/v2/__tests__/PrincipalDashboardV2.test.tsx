import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PrincipalDashboardV2 } from '../PrincipalDashboardV2';

// Mock React Admin hooks
const mockUseGetIdentity = vi.fn();
const mockUseGetList = vi.fn();
const mockUseGetOne = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockNotify = vi.fn();
const mockRefresh = vi.fn();

vi.mock('react-admin', () => ({
  useGetIdentity: () => mockUseGetIdentity(),
  useGetList: (...args: any[]) => mockUseGetList(...args),
  useGetOne: (...args: any[]) => mockUseGetOne(...args),
  useCreate: () => ({ create: mockCreate }),
  useUpdate: () => [mockUpdate],
  useNotify: () => mockNotify,
  useRefresh: () => mockRefresh,
}));

// Mock usePrefs hook
const mockUsePrefs = vi.fn();

vi.mock('../hooks/usePrefs', () => ({
  usePrefs: (...args: any[]) => mockUsePrefs(...args),
}));

// Mock useResizableColumns hook
vi.mock('../hooks/useResizableColumns', () => ({
  useResizableColumns: () => ({
    containerRef: { current: null },
    widths: [40, 30, 30],
    onMouseDown: () => vi.fn(),
  }),
}));

// Mock PrincipalContext
const mockSetSelectedPrincipal = vi.fn();

vi.mock('../context/PrincipalContext', () => ({
  PrincipalProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  usePrincipalContext: () => ({
    selectedPrincipalId: null,
    setSelectedPrincipal: mockSetSelectedPrincipal,
  }),
}));

describe('PrincipalDashboardV2', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock identity
    mockUseGetIdentity.mockReturnValue({
      data: { id: '1', fullName: 'Test User' },
      isLoading: false,
    });

    // Default mock for useGetList - returns empty data
    mockUseGetList.mockReturnValue({
      data: [],
      total: 0,
      isLoading: false,
      error: null,
    });

    // Default mock for useGetOne
    mockUseGetOne.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    // Mock usePrefs - default implementation for filters and sidebar
    mockUsePrefs.mockImplementation((key: string, defaultValue: any) => {
      const setters: Record<string, any> = {
        filters: vi.fn(),
        sidebarOpen: vi.fn(),
        rightTab: vi.fn(),
        colWidths: vi.fn(),
      };
      return [defaultValue, setters[key] || vi.fn()];
    });

    // Reset other mocks
    mockCreate.mockClear();
    mockUpdate.mockClear();
    mockNotify.mockClear();
    mockRefresh.mockClear();
    mockSetSelectedPrincipal.mockClear();
  });

  it('should render 3-column layout', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Verify filters sidebar
    expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();

    // Verify 3-column structure by IDs
    expect(document.getElementById('col-opportunities')).toBeInTheDocument();
    expect(document.getElementById('col-tasks')).toBeInTheDocument();
    expect(document.getElementById('col-logger')).toBeInTheDocument();

    // Verify quick logger card
    expect(screen.getByTestId('quick-logger-card')).toBeInTheDocument();
  });

  it('should toggle sidebar visibility', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    const sidebar = screen.getByTestId('filters-sidebar');

    // Initially visible
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse filters sidebar');
    await user.click(collapseButton);

    // Should be hidden
    await waitFor(() => {
      expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    });

    // Rail button should appear
    const railButton = await screen.findByLabelText('Open filters sidebar');
    expect(railButton).toBeInTheDocument();

    // Click rail to reopen
    await user.click(railButton);

    // Should be visible again
    await waitFor(() => {
      expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    });
  });

  it('should handle keyboard shortcuts for column navigation', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
    });

    // Press '1' to scroll to opportunities
    await userEvent.keyboard('1');

    // Verify column has correct ID for scrollIntoView
    const oppColumn = document.getElementById('col-opportunities');
    expect(oppColumn).toBeInTheDocument();

    // Press '2' to scroll to tasks
    await userEvent.keyboard('2');

    const tasksColumn = document.getElementById('col-tasks');
    expect(tasksColumn).toBeInTheDocument();

    // Press '3' to scroll to logger
    await userEvent.keyboard('3');

    const loggerColumn = document.getElementById('col-logger');
    expect(loggerColumn).toBeInTheDocument();
  });

  it('should open slide-over when opportunity clicked', async () => {
    const user = userEvent.setup();

    // Mock opportunities data
    mockUseGetList.mockImplementation((resource: string) => {
      if (resource === 'principal_opportunities') {
        return {
          data: [
            {
              id: 1,
              name: 'Test Opportunity',
              stage: 'qualification',
              priority: 'high',
              principal_organization_id: 10,
              principal_organization_name: 'Principal Inc',
              customer_organization_name: 'Customer Corp',
            },
          ],
          total: 1,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: [],
        total: 0,
        isLoading: false,
        error: null,
      };
    });

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Wait for opportunity to render
    await waitFor(() => {
      expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
    });

    // Click opportunity
    const opportunity = screen.getByText('Test Opportunity');
    await user.click(opportunity);

    // Verify slide-over opens (check for dialog role)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should handle keyboard shortcut H to open slide-over', async () => {
    // Mock opportunities data
    mockUseGetList.mockImplementation((resource: string) => {
      if (resource === 'principal_opportunities') {
        return {
          data: [
            {
              id: 1,
              name: 'Test Opportunity',
              stage: 'qualification',
              priority: 'high',
            },
          ],
          total: 1,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: [],
        total: 0,
        isLoading: false,
        error: null,
      };
    });

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Wait for opportunity to render and click it
    await waitFor(() => {
      expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
    });

    const opportunity = screen.getByText('Test Opportunity');
    await userEvent.click(opportunity);

    // Close slide-over first
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press Escape to close
    await userEvent.keyboard('{Escape}');

    // Wait for slide-over to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Press 'H' to reopen
    await userEvent.keyboard('H');

    // Verify slide-over opens again
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should display active filter count on rail when sidebar collapsed', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Apply a filter first (check a health status checkbox)
    const activeCheckbox = screen.getByRole('checkbox', { name: /Active/i });
    await user.click(activeCheckbox);

    // Collapse sidebar
    const collapseButton = screen.getByLabelText('Collapse filters sidebar');
    await user.click(collapseButton);

    // Wait for rail to appear
    const railButton = await screen.findByLabelText('Open filters sidebar');
    expect(railButton).toBeInTheDocument();

    // Verify filter count badge appears (should show "1")
    const badge = railButton.querySelector('div');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('1');
  });

  it('should persist filter state', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Apply a filter
    const activeCheckbox = screen.getByRole('checkbox', { name: /Active/i });
    await user.click(activeCheckbox);

    // Verify checkbox is checked
    expect(activeCheckbox).toBeChecked();

    // Unmount and remount
    unmount();

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Verify filter persisted
    const activeCheckboxAfter = screen.getByRole('checkbox', { name: /Active/i });
    expect(activeCheckboxAfter).toBeChecked();
  });

  it('should clear all filters when clear button clicked', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Apply multiple filters
    const activeCheckbox = screen.getByRole('checkbox', { name: /Active/i });
    await user.click(activeCheckbox);

    const coolingCheckbox = screen.getByRole('checkbox', { name: /Cooling/i });
    await user.click(coolingCheckbox);

    // Verify checkboxes are checked
    expect(activeCheckbox).toBeChecked();
    expect(coolingCheckbox).toBeChecked();

    // Clear all filters
    const clearButton = screen.getByRole('button', { name: /Clear all/i });
    await user.click(clearButton);

    // Verify checkboxes are unchecked
    expect(activeCheckbox).not.toBeChecked();
    expect(coolingCheckbox).not.toBeChecked();
  });
});
