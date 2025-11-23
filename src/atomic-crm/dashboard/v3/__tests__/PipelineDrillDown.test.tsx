import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock react-admin's useDataProvider
const mockGetList = vi.fn();
vi.mock('react-admin', () => ({
  useDataProvider: () => ({
    getList: mockGetList,
  }),
}));

// Mock useCurrentSale
vi.mock('../hooks/useCurrentSale', () => ({
  useCurrentSale: () => ({
    salesId: 1,
    loading: false,
  }),
}));

// Import after mocks
import { PipelineDrillDownSheet } from '../components/PipelineDrillDownSheet';
import type { OpportunitySummary } from '../hooks/usePrincipalOpportunities';

// Test wrapper with Router
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

// Create mock opportunity data
function createMockOpportunity(overrides: Partial<OpportunitySummary> = {}): any {
  return {
    id: 1,
    name: 'Test Opportunity',
    stage: 'Proposal',
    amount: 50000,
    probability: 75,
    last_activity_date: '2025-01-15',
    expected_close_date: '2025-02-28',
    ...overrides,
  };
}

describe('Pipeline Drill-Down Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PipelineDrillDownSheet', () => {
    it('should render sheet with principal name when open', async () => {
      mockGetList.mockResolvedValue({ data: [] });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('should show loading state while fetching opportunities', async () => {
      // Create a promise that never resolves to simulate loading
      mockGetList.mockReturnValue(new Promise(() => {}));

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Loading opportunities...')).toBeInTheDocument();
    });

    it('should display opportunities when loaded', async () => {
      mockGetList.mockResolvedValue({
        data: [
          createMockOpportunity({ id: 1, name: 'Big Deal' }),
          createMockOpportunity({ id: 2, name: 'Small Deal' }),
        ],
      });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Big Deal')).toBeInTheDocument();
        expect(screen.getByText('Small Deal')).toBeInTheDocument();
      });
    });

    it('should show empty state when no opportunities exist', async () => {
      mockGetList.mockResolvedValue({ data: [] });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No opportunities found for this principal')).toBeInTheDocument();
      });
    });

    it('should show error state on fetch failure', async () => {
      mockGetList.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load opportunities')).toBeInTheDocument();
      });
    });

    it('should display opportunity count', async () => {
      mockGetList.mockResolvedValue({
        data: [
          createMockOpportunity({ id: 1 }),
          createMockOpportunity({ id: 2 }),
          createMockOpportunity({ id: 3 }),
        ],
      });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('3 opportunities')).toBeInTheDocument();
      });
    });

    it('should use singular form for single opportunity', async () => {
      mockGetList.mockResolvedValue({
        data: [createMockOpportunity({ id: 1 })],
      });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('1 opportunity')).toBeInTheDocument();
      });
    });

    it('should call onClose when sheet is closed', async () => {
      mockGetList.mockResolvedValue({ data: [] });
      const onClose = vi.fn();

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={onClose}
          />
        </TestWrapper>
      );

      // Find and click the close button (X icon)
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not fetch when sheet is closed', async () => {
      mockGetList.mockResolvedValue({ data: [] });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={false}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      // Should not call getList when sheet is closed
      expect(mockGetList).not.toHaveBeenCalled();
    });

    it('should fetch opportunities filtered by organization_id', async () => {
      mockGetList.mockResolvedValue({ data: [] });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={456}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockGetList).toHaveBeenCalledWith('opportunities', expect.objectContaining({
          filter: { organization_id: 456 },
        }));
      });
    });
  });

  describe('Opportunity Card Accessibility', () => {
    it('should have accessible labels on opportunity cards', async () => {
      mockGetList.mockResolvedValue({
        data: [createMockOpportunity({ id: 1, name: 'Premium Deal' })],
      });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const card = screen.getByRole('button', { name: /view premium deal/i });
        expect(card).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation on opportunity cards', async () => {
      mockGetList.mockResolvedValue({
        data: [createMockOpportunity({ id: 1, name: 'Test Deal' })],
      });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const card = screen.getByRole('button', { name: /view test deal/i });
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Pipeline Summary Stats', () => {
    it('should calculate total pipeline value', async () => {
      mockGetList.mockResolvedValue({
        data: [
          createMockOpportunity({ id: 1, amount: 30000 }),
          createMockOpportunity({ id: 2, amount: 20000 }),
        ],
      });

      render(
        <TestWrapper>
          <PipelineDrillDownSheet
            principalId={123}
            principalName="Acme Corp"
            isOpen={true}
            onClose={vi.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        // Total should be $50,000
        expect(screen.getByText('$50,000')).toBeInTheDocument();
      });
    });
  });
});
