import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuickLoggerPanel } from '../QuickLoggerPanel';

describe('QuickLoggerPanel', () => {
  it('should render panel headers', () => {
    render(<QuickLoggerPanel />);

    expect(screen.getByText('Log Activity')).toBeInTheDocument();
    expect(screen.getByText('Quick capture for calls, meetings, and notes')).toBeInTheDocument();
  });

  it('should show New Activity button when not logging', () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole('button', { name: /new activity/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('h-11'); // 44px touch target
  });

  it('should show form when New Activity is clicked', () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole('button', { name: /new activity/i });
    fireEvent.click(button);

    expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
  });
});
