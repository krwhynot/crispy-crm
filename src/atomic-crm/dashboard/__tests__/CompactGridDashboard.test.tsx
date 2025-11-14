import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AdminContext } from 'react-admin';
import { QueryClient } from '@tanstack/react-query';
import { CompactGridDashboard } from '../CompactGridDashboard';

// Mock the individual widgets
vi.mock('../CompactPrincipalTable', () => ({
  CompactPrincipalTable: () => <div>Principal Table</div>
}));
vi.mock('../CompactTasksWidget', () => ({
  CompactTasksWidget: () => <div>Tasks Widget</div>
}));
vi.mock('../CompactDashboardHeader', () => ({
  CompactDashboardHeader: () => <div>Dashboard Header</div>
}));
vi.mock('../ActivityFeed', () => ({
  ActivityFeed: () => <div>Activity Feed</div>
}));

// Mock useGetList to return test data
vi.mock('react-admin', async () => {
  const actual = await vi.importActual('react-admin');
  return {
    ...actual,
    useGetList: vi.fn(() => ({
      data: [],
      isPending: false,
      error: null
    }))
  };
});

// Create a test wrapper with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const dataProvider = {
    getList: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
    getOne: vi.fn(() => Promise.resolve({ data: {} })),
    getMany: vi.fn(() => Promise.resolve({ data: [] })),
    getManyReference: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
    create: vi.fn(() => Promise.resolve({ data: {} })),
    update: vi.fn(() => Promise.resolve({ data: {} })),
    updateMany: vi.fn(() => Promise.resolve({ data: [] })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    deleteMany: vi.fn(() => Promise.resolve({ data: [] })),
  };

  return (
    <AdminContext dataProvider={dataProvider} queryClient={queryClient}>
      {children}
    </AdminContext>
  );
};

describe('CompactGridDashboard', () => {
  it('renders all widget components', () => {
    render(
      <TestWrapper>
        <CompactGridDashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Principal Table')).toBeInTheDocument();
    expect(screen.getByText('Tasks Widget')).toBeInTheDocument();
    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
  });

  it('renders with 3-column grid layout', () => {
    const { container } = render(
      <TestWrapper>
        <CompactGridDashboard />
      </TestWrapper>
    );
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('lg:grid-cols-[40%_30%_30%]');
  });
});
