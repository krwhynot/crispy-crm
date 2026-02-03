/**
 * useSegmentNames Hook Tests
 *
 * Verifies that both playbook AND operator segment IDs resolve
 * via static lookup (no async fetch), preventing infinite loops
 * in useResourceNamesBase.
 *
 * Key regression test: Operator segment IDs (33333333-...) must
 * NOT be passed to useResourceNamesBase, which would trigger
 * an infinite loop when segmentsHandler.getMany can't resolve them.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSegmentNames } from "../useSegmentNames";
import { PLAYBOOK_CATEGORY_IDS } from "../../validation/segments";
import { OPERATOR_SEGMENT_IDS } from "../../validation/operatorSegments";

// Track what IDs are passed to useResourceNamesBase
let capturedIds: string[] | undefined;

vi.mock("../hooks/useResourceNamesBase", () => ({
  useResourceNamesBase: (
    _resource: string,
    ids: string[] | undefined,
    _extractor: unknown,
    _prefix: string
  ) => {
    capturedIds = ids;
    return {
      namesMap: {},
      loading: false,
    };
  },
}));

describe("useSegmentNames", () => {
  beforeEach(() => {
    capturedIds = undefined;
  });

  it("resolves playbook segment IDs without async fetch", () => {
    const playbookId = PLAYBOOK_CATEGORY_IDS["Major Broadline"];
    const { result } = renderHook(() => useSegmentNames([playbookId]));

    // Playbook IDs should NOT be passed to useResourceNamesBase
    expect(capturedIds).toEqual([]);

    // Should resolve instantly from static map
    expect(result.current.getSegmentName(playbookId)).toBe("Major Broadline");
  });

  it("resolves operator segment IDs without async fetch", () => {
    const operatorId = OPERATOR_SEGMENT_IDS["Full-Service Restaurant"];
    const { result } = renderHook(() => useSegmentNames([operatorId]));

    // Operator IDs should NOT be passed to useResourceNamesBase
    expect(capturedIds).toEqual([]);

    // Should resolve instantly from static map
    expect(result.current.getSegmentName(operatorId)).toBe("Full-Service Restaurant");
  });

  it("resolves child operator segment IDs without async fetch", () => {
    const childId = OPERATOR_SEGMENT_IDS["Fine Dining"];
    const { result } = renderHook(() => useSegmentNames([childId]));

    expect(capturedIds).toEqual([]);
    expect(result.current.getSegmentName(childId)).toBe("Fine Dining");
  });

  it("resolves mixed playbook and operator IDs without async fetch", () => {
    const playbookId = PLAYBOOK_CATEGORY_IDS["Specialty/Regional"];
    const operatorId = OPERATOR_SEGMENT_IDS["Hotels & Lodging"];

    const { result } = renderHook(() => useSegmentNames([playbookId, operatorId]));

    // Neither should be passed to async fetch
    expect(capturedIds).toEqual([]);

    expect(result.current.getSegmentName(playbookId)).toBe("Specialty/Regional");
    expect(result.current.getSegmentName(operatorId)).toBe("Hotels & Lodging");
  });

  it("passes unknown IDs to useResourceNamesBase for async fetch", () => {
    const unknownId = "99999999-9999-4999-8999-000000000001";
    renderHook(() => useSegmentNames([unknownId]));

    // Unknown ID should be passed through
    expect(capturedIds).toEqual([unknownId]);
  });

  it("filters out known IDs and only passes unknown ones", () => {
    const playbookId = PLAYBOOK_CATEGORY_IDS["GPO"];
    const operatorId = OPERATOR_SEGMENT_IDS["Catering"];
    const unknownId = "99999999-9999-4999-8999-000000000002";

    renderHook(() => useSegmentNames([playbookId, operatorId, unknownId]));

    // Only the unknown ID should be passed to async fetch
    expect(capturedIds).toEqual([unknownId]);
  });

  it("includes operator segments in segmentMap", () => {
    const operatorId = OPERATOR_SEGMENT_IDS["Healthcare"];
    const { result } = renderHook(() => useSegmentNames([operatorId]));

    expect(result.current.segmentMap[operatorId]).toBe("Healthcare");
  });

  it("returns fallback for truly unknown IDs", () => {
    const unknownId = "99999999-9999-4999-8999-000000000099";
    const { result } = renderHook(() => useSegmentNames([unknownId]));

    // Falls back to "Playbook #id" when not in any static map and not async-fetched
    expect(result.current.getSegmentName(unknownId)).toBe(`Playbook #${unknownId}`);
  });

  it("handles undefined input", () => {
    const { result } = renderHook(() => useSegmentNames(undefined));

    expect(capturedIds).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("handles empty array input", () => {
    const { result } = renderHook(() => useSegmentNames([]));

    expect(capturedIds).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
