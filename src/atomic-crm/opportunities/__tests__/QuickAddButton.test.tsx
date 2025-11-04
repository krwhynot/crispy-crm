import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAddButton } from '../QuickAddButton';

// Mock dependencies
vi.mock('../hooks/useQuickAdd');
vi.mock('ra-core', () => ({
  useGetList: vi.fn(() => ({
    data: [
      { id: 1, name: 'Principal A' },
      { id: 2, name: 'Principal B' },
    ],
    isLoading: false,
  })),
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('QuickAddButton', () => {
  it('renders button with correct text', () => {
    render(<QuickAddButton />);
    // Button contains both emoji and text
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('⚡ Quick Add');
  });

  it('has correct variant and size', () => {
    render(<QuickAddButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-background'); // outline variant includes bg-background
  });

  it('opens dialog when clicked', () => {
    render(<QuickAddButton />);
    const button = screen.getByRole('button');

    // Dialog should not be visible initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the button
    fireEvent.click(button);

    // Dialog should now be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Quick Add Booth Visitor')).toBeInTheDocument();
  });

  it('ensures minimum touch target size', () => {
    render(<QuickAddButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
    expect(button).toHaveClass('min-w-[44px]');
  });
});