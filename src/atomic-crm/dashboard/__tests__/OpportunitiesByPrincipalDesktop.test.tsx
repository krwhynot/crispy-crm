import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunitiesByPrincipalDesktop } from '../OpportunitiesByPrincipalDesktop';
import { TestWrapper } from '@/test-utils';

describe('OpportunitiesByPrincipalDesktop', () => {
  it('should render principal rows with inline actions', async () => {
    const mockData = [
      {
        principalId: '1',
        principalName: 'ABC Corp',
        opportunityCount: 5,
        weeklyActivities: 10,
        assignedReps: ['John', 'Jane'],
      }
    ];

    render(
      <TestWrapper>
        <OpportunitiesByPrincipalDesktop data={mockData} />
      </TestWrapper>
    );

    // Check principal name is displayed
    expect(screen.getByText('ABC Corp')).toBeInTheDocument();

    // Check opportunity count
    expect(screen.getByText('5')).toBeInTheDocument();

    // Hover should show inline actions
    const row = screen.getByText('ABC Corp').closest('tr');
    fireEvent.mouseEnter(row!);

    // Actions should be visible on hover
    expect(screen.getByTitle('Log Call (Alt+C)')).toBeInTheDocument();
    expect(screen.getByTitle('Log Email (Alt+E)')).toBeInTheDocument();
  });
});
