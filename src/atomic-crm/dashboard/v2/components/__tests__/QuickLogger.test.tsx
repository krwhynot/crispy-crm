import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickLogger } from '../QuickLogger';

// Mock React Admin hooks
const mockCreate = vi.fn();
const mockUseGetList = vi.fn();
const mockNotify = vi.fn();
const mockRefresh = vi.fn();
const mockUseGetIdentity = vi.fn();

vi.mock('react-admin', () => ({
  useCreate: () => ({ create: mockCreate }),
  useGetList: (...args: any[]) => mockUseGetList(...args),
  useNotify: () => mockNotify,
  useRefresh: () => mockRefresh,
  useGetIdentity: () => mockUseGetIdentity(),
}));

// Mock PrincipalContext
const mockUsePrincipalContext = vi.fn();

vi.mock('../../context/PrincipalContext', () => ({
  usePrincipalContext: () => mockUsePrincipalContext(),
}));

describe('QuickLogger', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock principal context with a selected principal
    mockUsePrincipalContext.mockReturnValue({
      selectedPrincipalId: 1,
      setSelectedPrincipal: vi.fn(),
    });

    // Mock identity
    mockUseGetIdentity.mockReturnValue({
      data: { id: 1 },
      isLoading: false,
    });

    // Mock opportunities list
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    // Reset mocks
    mockCreate.mockReset();
    mockNotify.mockReset();
    mockRefresh.mockReset();

    // Simulate async create operation
    mockCreate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <QuickLogger />
      </QueryClientProvider>
    );

    // Fill out form
    await user.type(screen.getByLabelText(/Subject/), 'Test activity');

    // Submit
    const submitButton = screen.getByTestId('quick-logger-submit');
    await user.click(submitButton);

    // During submission, button should be disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
