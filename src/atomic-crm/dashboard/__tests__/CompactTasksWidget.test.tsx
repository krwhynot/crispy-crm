import { render, screen } from '@testing-library/react';
import { CompactTasksWidget } from '../CompactTasksWidget';

describe('CompactTasksWidget', () => {
  it('shows maximum 4 tasks', () => {
    const mockTasks = Array(10).fill(null).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      priority: i % 2 === 0 ? 'high' : 'normal'
    }));

    render(<CompactTasksWidget tasks={mockTasks} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
  });

  it('shows total count in header', () => {
    const mockTasks = Array(8).fill(null).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      priority: 'normal'
    }));

    render(<CompactTasksWidget tasks={mockTasks} />);

    expect(screen.getByText('8')).toBeInTheDocument();
  });
});
