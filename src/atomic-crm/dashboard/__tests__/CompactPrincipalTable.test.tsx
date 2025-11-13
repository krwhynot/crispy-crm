import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CompactPrincipalTable } from '../CompactPrincipalTable';

describe('CompactPrincipalTable', () => {
  it('shows maximum 5 rows initially', () => {
    const mockData = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Principal ${i}`,
      opportunityCount: i * 2,
      weeklyActivities: i * 3,
      assignedReps: []
    }));

    render(
      <BrowserRouter>
        <CompactPrincipalTable data={mockData} />
      </BrowserRouter>
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6); // 5 data + 1 header
  });

  it('shows expand link when more than 5 rows', () => {
    const mockData = Array(10).fill(null).map((_, i) => ({
      id: i,
      name: `Principal ${i}`,
      opportunityCount: i * 2,
      weeklyActivities: i * 3,
      assignedReps: []
    }));

    render(
      <BrowserRouter>
        <CompactPrincipalTable data={mockData} />
      </BrowserRouter>
    );

    expect(screen.getByText('Show all 10 principals')).toBeInTheDocument();
  });

  it('uses compact row height', () => {
    const mockData = [{
      id: 1,
      name: 'Test',
      opportunityCount: 1,
      weeklyActivities: 2,
      assignedReps: []
    }];

    const { container } = render(
      <BrowserRouter>
        <CompactPrincipalTable data={mockData} />
      </BrowserRouter>
    );
    const row = container.querySelector('tbody tr');

    expect(row).toHaveClass('h-9');
  });
});
