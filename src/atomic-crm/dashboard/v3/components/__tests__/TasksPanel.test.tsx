import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TasksPanel } from '../TasksPanel';

describe('TasksPanel', () => {
  it('should render panel headers and helper text', () => {
    render(<TasksPanel />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText("Today's priorities and upcoming activities")).toBeInTheDocument();
  });

  it('should render task groups', () => {
    render(<TasksPanel />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('should apply interactive-card class to task items', () => {
    const { container } = render(<TasksPanel />);
    const cards = container.querySelectorAll('.interactive-card');
    expect(cards.length).toBeGreaterThan(0);
  });
});
