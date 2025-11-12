import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TestMemoryRouter } from 'ra-core';
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

describe('CompactGridDashboard', () => {
  it('renders all widget components', () => {
    render(
      <TestMemoryRouter>
        <CompactGridDashboard />
      </TestMemoryRouter>
    );

    expect(screen.getByText('Principal Table')).toBeInTheDocument();
    expect(screen.getByText('Tasks Widget')).toBeInTheDocument();
  });

  it('renders with 3-column grid layout', () => {
    const { container } = render(
      <TestMemoryRouter>
        <CompactGridDashboard />
      </TestMemoryRouter>
    );
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('lg:grid-cols-[40%_30%_30%]');
  });
});
