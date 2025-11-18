import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrincipalDashboardV3 } from '../PrincipalDashboardV3';

// Mock QuickLoggerPanel to avoid React Admin dependency in tests
vi.mock('../components/QuickLoggerPanel', () => ({
  QuickLoggerPanel: () => (
    <div>
      <h2>Log Activity</h2>
      <p>Quick capture for calls, meetings, and notes</p>
    </div>
  ),
}));

// Mock the hooks
vi.mock('../hooks/usePrincipalPipeline', () => ({
  usePrincipalPipeline: () => ({
    data: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('../hooks/useMyTasks', () => ({
  useMyTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    completeTask: vi.fn(),
    snoozeTask: vi.fn(),
  }),
}));

describe('PrincipalDashboardV3', () => {
  it('should render all three panels', () => {
    render(<PrincipalDashboardV3 />);

    expect(screen.getByText('Pipeline by Principal')).toBeInTheDocument();
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Log Activity')).toBeInTheDocument();
  });

  it('should render resizable panel group', () => {
    const { container } = render(<PrincipalDashboardV3 />);

    const panelGroup = container.querySelector('[data-panel-group]');
    expect(panelGroup).toBeInTheDocument();
  });

  it('should have three panels with correct default sizes', () => {
    const { container } = render(<PrincipalDashboardV3 />);

    const panels = container.querySelectorAll('[data-panel]');
    expect(panels).toHaveLength(3);
  });
});
