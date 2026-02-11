/**
 * KPI Metric Snapshot Tests
 *
 * Phase 5 Automation — Reporting Audit
 *
 * Validates that a deterministic seed dataset produces exact expected KPI counts.
 * Acts as a contract test: if the counting logic or filter definitions change,
 * this test breaks immediately — forcing review of the metric truth statement
 * in phase-4-report.md Section 3.
 *
 * Seed scenario S0: Known dataset with specific stage distribution.
 * Expected counts derived from the audit's Final Metric Truth Statement.
 *
 * Rollout: nightly → PR-required once stable.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { startOfDay, subDays } from "date-fns";
import { getWeekBoundaries } from "@/atomic-crm/utils/dateUtils";
import type * as ReactAdmin from "react-admin";
import { useKPIMetrics } from "../useKPIMetrics";

// ── Mock setup (matches useKPIMetrics.test.ts pattern) ──────────────────

const mockGetList = vi.fn();

vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useDataProvider: () => ({ getList: mockGetList }),
  };
});

const currentSaleState = {
  salesId: null as number | null,
  loading: false,
  error: null as Error | null,
};

vi.mock("../useCurrentSale", () => ({
  useCurrentSale: () => ({
    salesId: currentSaleState.salesId,
    loading: currentSaleState.loading,
    error: currentSaleState.error,
  }),
}));

// ── Seed scenario S0 ────────────────────────────────────────────────────
// Deterministic dataset simulating a realistic pipeline snapshot.
// All dates relative to a fixed "today" for reproducibility.

function buildSeedData() {
  const today = startOfDay(new Date());
  const { thisWeekStart, thisWeekEnd } = getWeekBoundaries();

  // ── Opportunities ──
  // 3 open (active stages), 2 closed → "Open Opportunities" = 3
  const openOpportunities = [
    { id: 1, stage: "new_lead", last_activity_date: today.toISOString() },
    { id: 2, stage: "initial_outreach", last_activity_date: subDays(today, 5).toISOString() },
    { id: 3, stage: "demo_scheduled", last_activity_date: subDays(today, 2).toISOString() },
  ];

  const closedOpportunities = [
    { id: 4, stage: "closed_won", last_activity_date: subDays(today, 10).toISOString() },
    { id: 5, stage: "closed_lost", last_activity_date: subDays(today, 30).toISOString() },
  ];

  // ── Stale candidates (fetched with last_activity_date < 21 days ago) ──
  // Of the open opps, only those with old activity are candidates
  // id: 6 — new_lead, 10 days stale → exceeds 7d threshold → stale
  // id: 7 — feedback_logged, 25 days stale → exceeds 21d threshold → stale
  // id: 8 — initial_outreach, 22 days stale → exceeds 14d threshold → stale
  const staleCandidates = [
    { id: 6, stage: "new_lead", last_activity_date: subDays(today, 10).toISOString() },
    { id: 7, stage: "feedback_logged", last_activity_date: subDays(today, 25).toISOString() },
    { id: 8, stage: "initial_outreach", last_activity_date: subDays(today, 22).toISOString() },
  ];

  return {
    today,
    thisWeekStart,
    thisWeekEnd,
    allOpportunities: [...openOpportunities, ...closedOpportunities],
    openOpportunities,
    staleCandidates,
    // Expected counts (the metric truth)
    expected: {
      openOpportunitiesCount: 3, // 3 non-closed (excludes closed_won + closed_lost)
      overdueTasksCount: 4, // Mocked: 4 overdue tasks
      activitiesThisWeek: 7, // Mocked: 7 activities this week
      staleDealsCount: 3, // 3 stale candidates (all exceed their stage thresholds)
    },
  };
}

describe("KPI Metric Snapshot (Seed S0)", () => {
  let seed: ReturnType<typeof buildSeedData>;

  beforeEach(() => {
    vi.clearAllMocks();
    currentSaleState.salesId = 42;
    currentSaleState.loading = false;
    currentSaleState.error = null;
    seed = buildSeedData();
  });

  // ────────────────────────────────────────────────────────────────────────
  // 1. Full scenario: all 4 KPIs computed correctly from seed
  // ────────────────────────────────────────────────────────────────────────
  it("produces exact expected counts from seed S0", async () => {
    mockGetList.mockImplementation(
      (resource: string, params: { filter?: Record<string, unknown> }) => {
        if (resource === "opportunities") {
          // Two calls: (1) open count, (2) stale candidates
          const filter = params.filter || {};
          if ("last_activity_date@lt" in filter) {
            // Stale candidates query
            return Promise.resolve({
              data: seed.staleCandidates,
              total: seed.staleCandidates.length,
            });
          }
          // Open opportunities count query
          return Promise.resolve({
            data: seed.openOpportunities.slice(0, 1), // perPage: 1
            total: seed.expected.openOpportunitiesCount,
          });
        }
        if (resource === "tasks") {
          return Promise.resolve({
            data: [],
            total: seed.expected.overdueTasksCount,
          });
        }
        if (resource === "activities") {
          return Promise.resolve({
            data: [],
            total: seed.expected.activitiesThisWeek,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      }
    );

    const { result } = renderHook(() => useKPIMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // ── Exact snapshot assertions ──
    expect(result.current.metrics.openOpportunitiesCount).toBe(
      seed.expected.openOpportunitiesCount
    );
    expect(result.current.metrics.overdueTasksCount).toBe(seed.expected.overdueTasksCount);
    expect(result.current.metrics.activitiesThisWeek).toBe(seed.expected.activitiesThisWeek);
    expect(result.current.metrics.staleDealsCount).toBe(seed.expected.staleDealsCount);
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Closed opportunities are excluded from open count
  //    (regression guard for B3 alignment)
  // ────────────────────────────────────────────────────────────────────────
  it("excludes closed_won and closed_lost from open opportunities count", async () => {
    mockGetList.mockImplementation(
      (resource: string, params: { filter?: Record<string, unknown> }) => {
        if (resource === "opportunities") {
          const filter = params.filter || {};
          if ("last_activity_date@lt" in filter) {
            return Promise.resolve({ data: [], total: 0 });
          }
          // Verify the filter actually excludes closed stages
          const notIn = filter["stage@not_in"] as string[] | undefined;
          expect(notIn).toBeDefined();
          expect(notIn).toContain("closed_won");
          expect(notIn).toContain("closed_lost");
          return Promise.resolve({
            data: [],
            total: seed.expected.openOpportunitiesCount,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      }
    );

    const { result } = renderHook(() => useKPIMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics.openOpportunitiesCount).toBe(
      seed.expected.openOpportunitiesCount
    );
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Activities filter uses ISO week boundaries from getWeekBoundaries()
  //    (regression guard for C2 alignment)
  // ────────────────────────────────────────────────────────────────────────
  it("filters activities using canonical week boundaries", async () => {
    mockGetList.mockImplementation(
      (resource: string, params: { filter?: Record<string, unknown> }) => {
        if (resource === "activities") {
          const filter = params.filter || {};
          const gte = filter["activity_date@gte"] as string;
          const lte = filter["activity_date@lte"] as string;

          // Must use getWeekBoundaries() output (ISO week, Monday start)
          expect(gte).toBeDefined();
          expect(lte).toBeDefined();

          // Parse and verify it's a Monday..Sunday range
          const startDate = new Date(gte);
          const endDate = new Date(lte);
          expect(startDate.getDay()).toBe(1); // Monday
          expect(endDate.getDay()).toBe(0); // Sunday

          return Promise.resolve({
            data: [],
            total: seed.expected.activitiesThisWeek,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      }
    );

    const { result } = renderHook(() => useKPIMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics.activitiesThisWeek).toBe(seed.expected.activitiesThisWeek);
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. G1 guardrail: partial failure returns null (not 0)
  // ────────────────────────────────────────────────────────────────────────
  it("returns null for failed metrics (G1 guardrail), not false zero", async () => {
    mockGetList.mockImplementation(
      (resource: string, params: { filter?: Record<string, unknown> }) => {
        if (resource === "opportunities") {
          const filter = params.filter || {};
          if ("last_activity_date@lt" in filter) {
            return Promise.reject(new Error("stale query failed"));
          }
          return Promise.reject(new Error("open count failed"));
        }
        if (resource === "tasks") {
          return Promise.resolve({ data: [], total: 2 });
        }
        if (resource === "activities") {
          return Promise.resolve({ data: [], total: 5 });
        }
        return Promise.resolve({ data: [], total: 0 });
      }
    );

    const { result } = renderHook(() => useKPIMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Failed queries → null (unknown), not 0
    expect(result.current.metrics.openOpportunitiesCount).toBeNull();
    expect(result.current.metrics.staleDealsCount).toBeNull();
    // Successful queries → actual numbers
    expect(result.current.metrics.overdueTasksCount).toBe(2);
    expect(result.current.metrics.activitiesThisWeek).toBe(5);
    // Partial failure flag
    expect(result.current.hasPartialFailure).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. Zero is a valid count (distinguishable from null/unknown)
  // ────────────────────────────────────────────────────────────────────────
  it("returns 0 (not null) when server confirms zero records", async () => {
    mockGetList.mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(() => useKPIMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics.openOpportunitiesCount).toBe(0);
    expect(result.current.metrics.overdueTasksCount).toBe(0);
    expect(result.current.metrics.activitiesThisWeek).toBe(0);
    expect(result.current.metrics.staleDealsCount).toBe(0);
    expect(result.current.hasPartialFailure).toBe(false);
  });
});
