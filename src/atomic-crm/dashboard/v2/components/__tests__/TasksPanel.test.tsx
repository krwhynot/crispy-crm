import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TasksPanel } from '../TasksPanel';

// Mock React Admin hooks
const mockUseGetList = vi.fn();
const mockUpdate = vi.fn();
const mockNotify = vi.fn();
const mockRefresh = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-admin', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
  useUpdate: () => [mockUpdate, { isLoading: false }],
  useNotify: () => mockNotify,
  useRefresh: () => mockRefresh,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock PrincipalContext
const mockUsePrincipalContext = vi.fn();

vi.mock('../../context/PrincipalContext', () => ({
  usePrincipalContext: () => mockUsePrincipalContext(),
}));

// Mock usePrefs
const mockUsePrefs = vi.fn();

vi.mock('../../hooks/usePrefs', () => ({
  usePrefs: (key: string, defaultValue: any) => mockUsePrefs(key, defaultValue),
}));

describe('TasksPanel - Later Bucket', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock principal context
    mockUsePrincipalContext.mockReturnValue({
      selectedPrincipalId: null,
      setSelectedPrincipal: vi.fn(),
    });

    // Mock usePrefs to return grouping state
    mockUsePrefs.mockReturnValue(['due', vi.fn()]);

    // Mock tasks data with "Later" bucket
    mockUseGetList.mockReturnValue({
      data: [
        {
          task_id: 1,
          task_title: 'Later task 1',
          due_date: '2025-12-01',
          priority: 'medium',
          principal_id: 1,
          principal_name: 'Test Principal',
        },
        {
          task_id: 2,
          task_title: 'Later task 2',
          due_date: '2025-12-15',
          priority: 'low',
          principal_id: 1,
          principal_name: 'Test Principal',
        },
      ],
      isLoading: false,
      error: null,
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  it('should have aria-expanded on Later bucket toggle', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TasksPanel assignee={null} currentUserId="123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const laterButton = screen.getByRole('button', { name: /Later/ });
      expect(laterButton).toHaveAttribute('aria-expanded');
    });
  });

  it('should toggle aria-expanded when clicked', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <TasksPanel assignee={null} currentUserId="123" />
      </QueryClientProvider>
    );

    const laterButton = await screen.findByRole('button', { name: /Later/ });

    // Initially collapsed
    expect(laterButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    await user.click(laterButton);

    // Should be expanded
    expect(laterButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should have aria-controls pointing to tasks container', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TasksPanel assignee={null} currentUserId="123" />
      </QueryClientProvider>
    );

    const laterButton = await screen.findByRole('button', { name: /Later/ });
    const ariaControls = laterButton.getAttribute('aria-controls');

    expect(ariaControls).toBeTruthy();
    expect(ariaControls).toMatch(/later-tasks/);

    // Verify the controlled element exists
    const tasksContainer = document.getElementById(ariaControls!);
    expect(tasksContainer).toBeInTheDocument();
  });

  it('should have role=region on tasks container', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TasksPanel assignee={null} currentUserId="123" />
      </QueryClientProvider>
    );

    const laterButton = await screen.findByRole('button', { name: /Later/ });
    const ariaControls = laterButton.getAttribute('aria-controls');
    const tasksContainer = document.getElementById(ariaControls!);

    expect(tasksContainer).toHaveAttribute('role', 'region');
  });

  it('should toggle aria-hidden on tasks container', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <TasksPanel assignee={null} currentUserId="123" />
      </QueryClientProvider>
    );

    const laterButton = await screen.findByRole('button', { name: /Later/ });
    const ariaControls = laterButton.getAttribute('aria-controls');
    const tasksContainer = document.getElementById(ariaControls!);

    // Initially hidden (collapsed)
    expect(tasksContainer).toHaveAttribute('aria-hidden', 'true');

    // Click to expand
    await user.click(laterButton);

    // Should not be hidden
    expect(tasksContainer).toHaveAttribute('aria-hidden', 'false');
  });
});
