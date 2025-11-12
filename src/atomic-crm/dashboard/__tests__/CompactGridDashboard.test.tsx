import { render, screen } from '@testing-library/react';
import { CompactGridDashboard } from '../CompactGridDashboard';

// Mock the individual widgets since they need real data
jest.mock('../CompactPrincipalTable', () => ({
  CompactPrincipalTable: () => <div>Principal Table</div>
}));
jest.mock('../CompactTasksWidget', () => ({
  CompactTasksWidget: () => <div>Tasks Widget</div>
}));

describe('CompactGridDashboard', () => {
  it('renders all widget components', () => {
    render(<CompactGridDashboard />);

    expect(screen.getByText('Principal Table')).toBeInTheDocument();
    expect(screen.getByText('Tasks Widget')).toBeInTheDocument();
  });

  it('renders with 3-column grid layout', () => {
    const { container } = render(<CompactGridDashboard />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('lg:grid-cols-[40%_30%_30%]');
  });
});
