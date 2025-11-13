import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityFeed, type ActivityFeedVariant } from '../ActivityFeed';
import { TestMemoryRouter } from 'ra-core';

// Mock react-admin hooks
const mockUseGetList = vi.fn();
vi.mock('react-admin', () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

// Mock utilities
vi.mock('@/atomic-crm/utils/formatRelativeTime', () => ({
  formatRelativeTime: (date: string) => '2 hours ago',
}));

vi.mock('@/atomic-crm/utils/getActivityIcon', () => ({
  getActivityIcon: () => {
    const Icon = () => <svg data-testid="activity-icon" />;
    return Icon;
  },
}));

describe('ActivityFeed', () => {
  const mockActivities = [
    {
      id: 1,
      type: 'Call',
      principal_name: 'Acme Corp',
      created_at: '2025-11-13T10:00:00Z',
      activity_date: '2025-11-13T10:00:00Z',
      notes: 'Discussed Q4 proposals',
    },
    {
      id: 2,
      type: 'Email',
      principal_name: 'TechStart Inc',
      created_at: '2025-11-13T09:30:00Z',
      activity_date: '2025-11-13T09:30:00Z',
      notes: 'Sent follow-up documentation',
    },
    {
      id: 3,
      type: 'Meeting',
      principal_name: 'Global Foods',
      created_at: '2025-11-13T08:00:00Z',
      activity_date: '2025-11-13T08:00:00Z',
      notes: 'Product demo session',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Variant: Sidebar', () => {
    it('should render loading state with sidebar variant', () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      expect(screen.getByText('RECENT ACTIVITY')).toBeInTheDocument();
      expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument();
    });

    it('should render activities with principal names for sidebar variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      // Check header
      expect(screen.getByText('RECENT ACTIVITY')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Count badge

      // Check activities display principal names
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('TechStart Inc')).toBeInTheDocument();
      expect(screen.getByText('Global Foods')).toBeInTheDocument();

      // Check relative time displays
      expect(screen.getAllByText('2 hours ago')).toHaveLength(3);
    });

    it('should render empty state for sidebar variant', () => {
      mockUseGetList.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      expect(screen.getByText('RECENT ACTIVITY')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });

    it('should render error state for sidebar variant', () => {
      mockUseGetList.mockReturnValue({
        data: [],
        isPending: false,
        error: new Error('Failed to fetch'),
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      expect(screen.getByText('RECENT ACTIVITY')).toBeInTheDocument();
      expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
    });

    it('should use DashboardWidget wrapper for sidebar variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      const { container } = render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      // DashboardWidget adds specific styling classes
      const widget = container.querySelector('.h-8');
      expect(widget).toBeInTheDocument();
    });

    it('should fetch 7 activities by default for sidebar variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        'activities',
        expect.objectContaining({
          pagination: { page: 1, perPage: 7 },
        })
      );
    });
  });

  describe('Variant: Compact', () => {
    it('should render activities with notes for compact variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" />
        </TestMemoryRouter>
      );

      // Check header
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Check activities display notes
      expect(screen.getByText('Discussed Q4 proposals')).toBeInTheDocument();
      expect(screen.getByText('Sent follow-up documentation')).toBeInTheDocument();
      expect(screen.getByText('Product demo session')).toBeInTheDocument();
    });

    it('should show "View all" link for compact variant when >= 4 items', () => {
      const fourActivities = [...mockActivities, { ...mockActivities[0], id: 4 }];

      mockUseGetList.mockReturnValue({
        data: fourActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" />
        </TestMemoryRouter>
      );

      expect(screen.getByText('View all activities →')).toBeInTheDocument();
    });

    it('should not show "View all" link for compact variant when < 4 items', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities.slice(0, 3),
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" />
        </TestMemoryRouter>
      );

      expect(screen.queryByText('View all activities →')).not.toBeInTheDocument();
    });

    it('should fetch 4 activities by default for compact variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" />
        </TestMemoryRouter>
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        'activities',
        expect.objectContaining({
          pagination: { page: 1, perPage: 4 },
        })
      );
    });

    it('should not use DashboardWidget wrapper for compact variant by default', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      const { container } = render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" />
        </TestMemoryRouter>
      );

      // Should have h-full class from plain div wrapper
      const wrapper = container.querySelector('.h-full');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Variant: Full', () => {
    it('should render activities with full details for full variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="full" />
        </TestMemoryRouter>
      );

      // Check header
      expect(screen.getByText('Recent Activities')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Check activity types display
      expect(screen.getByText('Call')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Meeting')).toBeInTheDocument();

      // Check notes display
      expect(screen.getByText('Discussed Q4 proposals')).toBeInTheDocument();
    });

    it('should fetch 10 activities by default for full variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="full" />
        </TestMemoryRouter>
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        'activities',
        expect.objectContaining({
          pagination: { page: 1, perPage: 10 },
        })
      );
    });

    it('should use DashboardWidget wrapper for full variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="full" />
        </TestMemoryRouter>
      );

      // Full variant includes role="button" and tabIndex
      const activityButton = screen.getAllByRole('button')[0];
      expect(activityButton).toBeInTheDocument();
    });
  });

  describe('Prop Overrides', () => {
    it('should respect custom maxItems prop', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" maxItems={15} />
        </TestMemoryRouter>
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        'activities',
        expect.objectContaining({
          pagination: { page: 1, perPage: 15 },
        })
      );
    });

    it('should respect custom title prop', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" title="Custom Title" />
        </TestMemoryRouter>
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    });

    it('should respect showViewAllLink=false override', () => {
      const fourActivities = [...mockActivities, { ...mockActivities[0], id: 4 }];

      mockUseGetList.mockReturnValue({
        data: fourActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="compact" showViewAllLink={false} />
        </TestMemoryRouter>
      );

      expect(screen.queryByText('View all activities →')).not.toBeInTheDocument();
    });

    it('should respect dateRangeFilter="all" override', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" dateRangeFilter="all" />
        </TestMemoryRouter>
      );

      // Should not include date filter
      expect(mockUseGetList).toHaveBeenCalledWith(
        'activities',
        expect.objectContaining({
          filter: {
            deleted_at: null,
          },
        })
      );
    });
  });

  describe('Date Filtering', () => {
    it('should filter by last 7 days by default', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      // Should include date filter with PostgREST syntax
      expect(mockUseGetList).toHaveBeenCalledWith(
        'activities',
        expect.objectContaining({
          filter: expect.objectContaining({
            'created_at@gte': expect.any(String),
            deleted_at: null,
          }),
        })
      );
    });
  });

  describe('Navigation', () => {
    it('should include activity icons for all variants', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      // Should have icons for each activity
      const icons = screen.getAllByTestId('activity-icon');
      expect(icons).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for full variant', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="full" />
        </TestMemoryRouter>
      );

      // Full variant includes aria-label
      const firstActivity = screen.getAllByRole('button')[0];
      expect(firstActivity).toHaveAttribute('aria-label', expect.stringContaining('View activity'));
    });

    it('should render activity icons for all variants', () => {
      mockUseGetList.mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <ActivityFeed variant="sidebar" />
        </TestMemoryRouter>
      );

      // Verify icons are rendered (actual aria-hidden attribute is set in component)
      const icons = screen.getAllByTestId('activity-icon');
      expect(icons.length).toBe(3);
    });
  });
});
