import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calculatePriority, PriorityIndicator as PriorityIndicatorComponent } from '../PriorityIndicator';

describe('PriorityIndicator - calculatePriority', () => {
  it('should return "high" when principal has overdue tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const principal = {
      tasks: [
        { due_date: yesterday.toISOString().split('T')[0], status: 'Active' }
      ],
      activities: []
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('high');
  });

  it('should return "high" when principal has low activity (< 3 this week)', () => {
    const principal = {
      tasks: [],
      activities: [
        { created_at: new Date().toISOString(), type: 'Call' },
        { created_at: new Date().toISOString(), type: 'Email' }
      ]
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('high');
  });

  it('should return "medium" when principal has tasks due in next 48 hours', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const principal = {
      tasks: [
        { due_date: tomorrow.toISOString().split('T')[0], status: 'Active' }
      ],
      activities: [
        { created_at: new Date().toISOString(), type: 'Call' },
        { created_at: new Date().toISOString(), type: 'Email' },
        { created_at: new Date().toISOString(), type: 'Meeting' }
      ]
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('medium');
  });

  it('should return "low" when principal is on track with good activity', () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const principal = {
      tasks: [
        { due_date: nextWeek.toISOString().split('T')[0], status: 'Active' }
      ],
      activities: [
        { created_at: new Date().toISOString(), type: 'Call' },
        { created_at: new Date().toISOString(), type: 'Email' },
        { created_at: new Date().toISOString(), type: 'Meeting' }
      ]
    };

    const priority = calculatePriority(principal);
    expect(priority).toBe('low');
  });
});

describe('PriorityIndicator - Component', () => {
  it('should render red indicator for high priority', () => {
    render(<PriorityIndicatorComponent priority="high" />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('bg-destructive/10');
  });

  it('should render yellow indicator for medium priority', () => {
    render(<PriorityIndicatorComponent priority="medium" />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('bg-warning/10');
  });

  it('should render green indicator for low priority', () => {
    render(<PriorityIndicatorComponent priority="low" />);
    const indicator = screen.getByTestId('priority-indicator');
    expect(indicator).toHaveClass('bg-success/10');
  });

  it('should render icon matching priority', () => {
    const { rerender } = render(
      <PriorityIndicatorComponent priority="high" />
    );
    let icon = screen.getByTestId('priority-icon');
    expect(icon).toHaveTextContent('⚠️');

    rerender(<PriorityIndicatorComponent priority="medium" />);
    icon = screen.getByTestId('priority-icon');
    expect(icon).toHaveTextContent('⚡');

    rerender(<PriorityIndicatorComponent priority="low" />);
    icon = screen.getByTestId('priority-icon');
    expect(icon).toHaveTextContent('✅');
  });
});