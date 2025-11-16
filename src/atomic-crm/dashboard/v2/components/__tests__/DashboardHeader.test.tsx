import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardHeader } from '../DashboardHeader';
import { BrowserRouter } from 'react-router-dom';

// Mock React Admin hooks
const mockUseGetList = vi.fn();

vi.mock('ra-core', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

vi.mock('react-admin', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

// Mock PrincipalContext
const mockUsePrincipalContext = vi.fn();

vi.mock('../../context/PrincipalContext', () => ({
  usePrincipalContext: () => mockUsePrincipalContext(),
}));

describe('DashboardHeader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock principal context
    mockUsePrincipalContext.mockReturnValue({
      selectedPrincipalId: null,
      setSelectedPrincipal: vi.fn(),
    });

    // Mock principals list
    mockUseGetList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  it('should not render global search input', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardHeader />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Search should not be in the document
    expect(screen.queryByLabelText('Global search')).not.toBeInTheDocument();
  });
});
