import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrincipalPipelineTable } from '../PrincipalPipelineTable';

// Mock the usePrincipalPipeline hook
vi.mock('../../hooks/usePrincipalPipeline', () => ({
  usePrincipalPipeline: () => ({
    data: [
      {
        id: 1,
        name: 'Acme Corporation',
        totalPipeline: 5,
        activeThisWeek: 3,
        activeLastWeek: 1,
        momentum: 'increasing',
        nextAction: 'Demo scheduled Friday',
      },
    ],
    loading: false,
    error: null,
  }),
}));

describe('PrincipalPipelineTable', () => {
  it('should render table headers correctly', () => {
    render(<PrincipalPipelineTable />);

    expect(screen.getByText('Pipeline by Principal')).toBeInTheDocument();
    expect(screen.getByText('Track opportunity momentum across your customer accounts')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /principal/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /this week/i })).toBeInTheDocument();
  });

  it('should apply premium hover effects class', () => {
    const { container } = render(<PrincipalPipelineTable />);
    const rows = container.querySelectorAll('.table-row-premium');
    expect(rows.length).toBeGreaterThan(0);
  });
});
