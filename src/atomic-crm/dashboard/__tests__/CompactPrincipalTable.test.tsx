import { render, screen } from '@testing-library/react';
import { CompactPrincipalTable } from '../CompactPrincipalTable';

describe('CompactPrincipalTable', () => {
  it('shows maximum 5 rows initially', () => {
    const mockData = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Principal ${i}`,
      activity: `${i * 2}/${i * 3}`
    }));

    render(<CompactPrincipalTable data={mockData} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6); // 5 data + 1 header
  });

  it('shows expand link when more than 5 rows', () => {
    const mockData = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Principal ${i}`,
      activity: `${i * 2}/${i * 3}`
    }));

    render(<CompactPrincipalTable data={mockData} />);

    expect(screen.getByText('Show all 10 principals')).toBeInTheDocument();
  });

  it('uses compact row height', () => {
    const mockData = [{id: 1, name: 'Test', activity: '1/2'}];

    const { container } = render(<CompactPrincipalTable data={mockData} />);
    const row = container.querySelector('tbody tr');

    expect(row).toHaveClass('h-9');
  });
});
