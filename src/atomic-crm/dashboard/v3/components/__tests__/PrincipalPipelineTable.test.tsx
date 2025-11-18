import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PrincipalPipelineTable } from '../PrincipalPipelineTable';

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
