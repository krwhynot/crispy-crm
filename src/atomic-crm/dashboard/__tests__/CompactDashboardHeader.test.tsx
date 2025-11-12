import { render, screen } from '@testing-library/react';
import { CompactDashboardHeader } from '../CompactDashboardHeader';

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
