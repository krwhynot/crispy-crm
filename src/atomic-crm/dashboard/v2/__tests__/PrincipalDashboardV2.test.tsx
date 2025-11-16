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

  it('should render sidebar collapse button', async () => {
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

    // Collapse button should be present
    const collapseButton = screen.getByLabelText('Collapse filters sidebar');
    expect(collapseButton).toBeInTheDocument();

    // Rail button should not be visible when sidebar is open
    expect(screen.queryByLabelText('Open filters sidebar')).not.toBeInTheDocument();
  });

  it('should handle keyboard shortcuts for column navigation', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Verify columns exist with correct IDs
    expect(document.getElementById('col-opportunities')).toBeInTheDocument();
    expect(document.getElementById('col-tasks')).toBeInTheDocument();
    expect(document.getElementById('col-logger')).toBeInTheDocument();

    // Test keyboard shortcuts don't throw errors
    await userEvent.keyboard('1');
    await userEvent.keyboard('2');
    await userEvent.keyboard('3');
  });

  it('should render RightSlideOver component when closed', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Slide-over should not be visible initially (no dialog role)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should handle Escape key to close slide-over', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('filters-sidebar')).toBeInTheDocument();
    });

    // Initially no dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Pressing Escape when no dialog is open shouldn't throw
    await userEvent.keyboard('{Escape}');

    // Still no dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render filter controls in sidebar', async () => {
    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <PrincipalDashboardV2 />
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Wait for sidebar to render
    const sidebar = await screen.findByTestId('filters-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Verify health filter checkboxes exist (using findByRole with timeout)
    const activeCheckbox = await screen.findByRole('checkbox', { name: /Active/i }, { timeout: 3000 });
    expect(activeCheckbox).toBeInTheDocument();
  }, 10000); // 10 second timeout

  it('should use usePrefs hook for state management', async () => {
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

    // Verify usePrefs was called for filters and sidebar state
    expect(mockUsePrefs).toHaveBeenCalledWith('filters', expect.any(Object));
    expect(mockUsePrefs).toHaveBeenCalledWith('sidebarOpen', true);
  });

  it('should render resizable column separators', async () => {
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

    // Verify resize handles are present
    const resizeHandles = screen.getAllByLabelText(/Resize.*column/i);
    expect(resizeHandles).toHaveLength(2); // Two separators between 3 columns
  });
});
