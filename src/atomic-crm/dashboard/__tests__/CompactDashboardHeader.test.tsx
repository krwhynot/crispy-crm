import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CompactDashboardHeader } from '../CompactDashboardHeader';

// Mock react-admin hooks
vi.mock('react-admin', () => ({
  useRefresh: vi.fn(() => vi.fn()),
}));

describe('CompactDashboardHeader', () => {
  it('displays title and date on single line', () => {
    render(<CompactDashboardHeader />);

    expect(screen.getByText(/Principal Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Week of/)).toBeInTheDocument();
  });

  it('has compact height styling', () => {
    const { container } = render(<CompactDashboardHeader />);
    const header = container.firstChild;

    expect(header).toHaveClass('h-8');
  });
});
