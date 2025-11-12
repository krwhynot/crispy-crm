/**
 * Tests for RecentActivityFeed Component
 *
 * Following TDD principles - writing tests first to define expected behavior.
 *
 * Test coverage:
 * - Rendering with activities
 * - Empty state
 * - Loading state
 * - Error state
 * - Row click navigation
 * - Footer link navigation
 * - formatRelativeTime usage
 * - getActivityIcon usage
 * - Accessibility features
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecentActivityFeed } from "../RecentActivityFeed";
import { TestWrapper } from "@/test-utils";
import userEvent from "@testing-library/user-event";
import * as reactAdmin from "react-admin";
import type { ActivityRecord } from "../../types";

// Mock react-admin hooks
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useGetList: vi.fn(),
  };
});

// Mock the utility functions
vi.mock("@/atomic-crm/utils/formatRelativeTime", () => ({
  formatRelativeTime: vi.fn((date) => {
    // Simple mock implementation
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d ago`;
  }),
}));

vi.mock("@/atomic-crm/utils/getActivityIcon", () => ({
  getActivityIcon: vi.fn((type) => {
    const icons = {
      Call: () => "📞",
      Email: () => "📧",
      Meeting: () => "🤝",
      Note: () => "📝",
    };
    return icons[type as keyof typeof icons] || (() => "📋");
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe("RecentActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActivities: ActivityRecord[] = [
    {
      id: 1,
      activity_type: "interaction",
      type: "Call",
      subject: "Follow-up call",
      description: "Discussed product pricing",
      activity_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      contact_id: 101,
      organization_id: 201,
      opportunity_id: 301,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      activity_type: "interaction",
      type: "Email",
      subject: "Proposal sent",
      description: "Sent detailed proposal",
      activity_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      contact_id: 102,
      organization_id: 202,
      opportunity_id: 302,
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      activity_type: "interaction",
      type: "Meeting",
      subject: "Demo meeting",
      description: "Product demonstration",
      activity_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      contact_id: 103,
      organization_id: 203,
      opportunity_id: 303,
      created_at: new Date().toISOString(),
    },
  ];

  describe("Success State", () => {
    it("should render activities in table format", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
      });

      // Check that count badge is displayed
      expect(screen.getByText("3")).toBeInTheDocument();

      // Check that all activities are rendered
      expect(screen.getByText(/Follow-up call/i)).toBeInTheDocument();
      expect(screen.getByText(/Proposal sent/i)).toBeInTheDocument();
      expect(screen.getByText(/Demo meeting/i)).toBeInTheDocument();
    });

    it("should display relative timestamps using formatRelativeTime", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/1d ago/i)).toBeInTheDocument();
      expect(screen.getByText(/3d ago/i)).toBeInTheDocument();
    });

    it("should render activity type icons using getActivityIcon", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      const { container } = render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
      });

      // Icons should be rendered (we mock them as simple functions returning emoji)
      // The actual icon component rendering would be tested in getActivityIcon.test.tsx
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it("should render footer link to activities list", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const link = screen.getByText(/View all activities/i);
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "/activities");
      });
    });
  });

  describe("Interactions", () => {
    it("should navigate to activity detail when row is clicked", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Follow-up call/i)).toBeInTheDocument();
      });

      // Find the row by its content and click it
      const row = screen.getByText(/Follow-up call/i).closest('[role="button"]');
      expect(row).toBeInTheDocument();

      await user.click(row!);

      expect(mockNavigate).toHaveBeenCalledWith("/activities/1");
    });

    it("should support keyboard navigation with Enter key", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Follow-up call/i)).toBeInTheDocument();
      });

      const row = screen.getByText(/Follow-up call/i).closest('[role="button"]');
      expect(row).toBeInTheDocument();

      row?.focus();
      await user.keyboard("{Enter}");

      expect(mockNavigate).toHaveBeenCalledWith("/activities/1");
    });

    it("should support keyboard navigation with Space key", async () => {
      const user = userEvent.setup();

      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Follow-up call/i)).toBeInTheDocument();
      });

      const row = screen.getByText(/Follow-up call/i).closest('[role="button"]');
      expect(row).toBeInTheDocument();

      row?.focus();
      await user.keyboard(" ");

      expect(mockNavigate).toHaveBeenCalledWith("/activities/1");
    });
  });

  describe("Loading State", () => {
    it("should display skeleton rows when loading", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      // Check for loading skeleton (animate-pulse class)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should have skeleton rows with h-8 height matching table rows", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      // Check skeleton height matches table row height
      const skeletons = document.querySelectorAll(".h-8.animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error State", () => {
    it("should display error message when fetch fails", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Network error"),
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load activities/i)).toBeInTheDocument();
      });
    });

    it("should display error message in red text", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Network error"),
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const errorText = screen.getByText(/Failed to load activities/i);
        expect(errorText).toHaveClass("text-destructive");
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty message when no activities", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: [],
        isPending: false,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
      });
    });

    it("should display empty message in muted text", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: [],
        isPending: false,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const emptyText = screen.getByText(/No recent activity/i);
        expect(emptyText).toHaveClass("text-muted-foreground");
      });
    });

    it("should still show footer link in empty state", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: [],
        isPending: false,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const link = screen.getByText(/View all activities/i);
        expect(link).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels on interactive rows", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const rows = screen.getAllByRole("button");
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach((row) => {
          expect(row).toHaveAttribute("aria-label");
        });
      });
    });

    it("should have icons with aria-hidden", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      const { container } = render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
      });

      // Icons should have aria-hidden="true"
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it("should have proper tabIndex for keyboard navigation", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const rows = screen.getAllByRole("button");
        rows.forEach((row) => {
          expect(row).toHaveAttribute("tabIndex", "0");
        });
      });
    });
  });

  describe("Visual Style", () => {
    it("should have h-8 row height matching principal table", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      const { container } = render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
      });

      // Check for h-8 class on rows
      const rows = container.querySelectorAll(".h-8");
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should have hover:bg-muted/30 hover state matching principal table", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      const { container } = render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
      });

      // Check for hover:bg-muted/30 class
      const rows = container.querySelectorAll('[role="button"]');
      rows.forEach((row) => {
        expect(row.className).toContain("hover:bg-muted/30");
      });
    });

    it("should have cursor-pointer on interactive rows", async () => {
      vi.mocked(reactAdmin.useGetList).mockReturnValue({
        data: mockActivities,
        isPending: false,
        error: null,
        total: 3,
      } as any);

      const { container } = render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/RECENT ACTIVITY/i)).toBeInTheDocument();
      });

      const rows = container.querySelectorAll('[role="button"]');
      rows.forEach((row) => {
        expect(row.className).toContain("cursor-pointer");
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch activities from last 7 days", async () => {
      const useGetListMock = vi.mocked(reactAdmin.useGetList);
      useGetListMock.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(useGetListMock).toHaveBeenCalledWith(
          "activities",
          expect.objectContaining({
            filter: expect.objectContaining({
              created_at_gte: expect.any(Date),
            }),
            sort: { field: "created_at", order: "DESC" },
            pagination: { page: 1, perPage: 7 },
          }),
          expect.any(Object)
        );
      });
    });

    it("should sort activities by created_at descending (newest first)", async () => {
      const useGetListMock = vi.mocked(reactAdmin.useGetList);
      useGetListMock.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(useGetListMock).toHaveBeenCalledWith(
          "activities",
          expect.objectContaining({
            sort: { field: "created_at", order: "DESC" },
          }),
          expect.any(Object)
        );
      });
    });

    it("should limit to 7 activities", async () => {
      const useGetListMock = vi.mocked(reactAdmin.useGetList);
      useGetListMock.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
        total: 0,
      } as any);

      render(
        <TestWrapper>
          <RecentActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(useGetListMock).toHaveBeenCalledWith(
          "activities",
          expect.objectContaining({
            pagination: { page: 1, perPage: 7 },
          }),
          expect.any(Object)
        );
      });
    });
  });
});
