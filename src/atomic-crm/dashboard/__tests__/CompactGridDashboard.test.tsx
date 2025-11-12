import { render, screen } from '@testing-library/react';
import { CompactGridDashboard } from '../CompactGridDashboard';

describe('CompactGridDashboard', () => {
  it('renders with 3-column grid layout', () => {
    const { container } = render(<CompactGridDashboard />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('lg:grid-cols-[40%_30%_30%]');
  });

  it('uses compact spacing', () => {
    const { container } = render(<CompactGridDashboard />);
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('gap-4');
  });
});
