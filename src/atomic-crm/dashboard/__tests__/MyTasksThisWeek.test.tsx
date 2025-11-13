import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyTasksThisWeek } from '../MyTasksThisWeek';
import { TestMemoryRouter } from 'ra-core';

// Mock react-admin hooks
const mockGetList = vi.fn();
const mockGetIdentity = vi.fn();
const mockNavigate = vi.fn();

vi.mock('ra-core', async () => {
  const actual = await vi.importActual('ra-core');
  return {
    ...actual,
    useGetList: () => mockGetList(),
    useGetIdentity: () => mockGetIdentity(),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock DashboardWidget to pass through children
vi.mock('../DashboardWidget', () => ({
  DashboardWidget: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-widget">{children}</div>
  ),
}));

describe('MyTasksThisWeek', () => {
  const mockCurrentUserId = 1;
  const today = new Date('2025-11-12T10:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(today);

    mockGetIdentity.mockReturnValue({
      identity: { id: mockCurrentUserId },
    });
  });

  it('should render widget title with count badge', () => {
    mockGetList.mockReturnValue({
      data: [
        {
          id: 1,
          title: 'Follow up call',
          due_date: new Date().toISOString().split('T')[0],
          status: 'Active',
        },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <MyTasksThisWeek />
      </TestMemoryRouter>
    );

    expect(screen.getByText(/MY TASKS/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should show loading skeleton', () => {
    mockGetList.mockReturnValue({
      data: [],
      isPending: true,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <MyTasksThisWeek />
      </TestMemoryRouter>
    );

    expect(screen.getByTestId('tasks-skeleton')).toBeInTheDocument();
  });

  it('should group tasks by urgency (OVERDUE, TODAY, THIS WEEK)', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    mockGetList.mockReturnValue({
      data: [
        { id: 1, title: 'Overdue', due_date: yesterday.toISOString().split('T')[0], status: 'Active' },
        { id: 2, title: 'Today', due_date: today.toISOString().split('T')[0], status: 'Active' },
      ],
      isPending: false,
      error: null,
    });

    render(
      <TestMemoryRouter>
        <MyTasksThisWeek />
      </TestMemoryRouter>
    );

    expect(screen.getAllByText(/OVERDUE/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TODAY/).length).toBeGreaterThan(0);
  });

  it('should have compact row height (h-8)', () => {
    mockGetList.mockReturnValue({
      data: [
        { id: 1, title: 'Task 1', due_date: '2025-11-20', status: 'Active' },
      ],
      isPending: false,
      error: null,
    });

    const { container } = render(
      <TestMemoryRouter>
        <MyTasksThisWeek />
      </TestMemoryRouter>
    );

    const taskRow = container.querySelector('[data-testid="task-row"]');
    expect(taskRow).toHaveClass('h-8');
  });
});
