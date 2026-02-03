/**
 * Tests for OPERATOR_SEGMENT_NAMES_BY_ID reverse lookup
 *
 * Verifies that every operator segment UUID resolves to the correct name.
 * This reverse map is critical for synchronous segment name resolution
 * in useSegmentNames, preventing async fetch loops.
 */

import { describe, it, expect } from "vitest";
import {
  OPERATOR_SEGMENT_IDS,
  OPERATOR_SEGMENT_NAMES_BY_ID,
  OPERATOR_PARENT_SEGMENTS,
  OPERATOR_CHILD_SEGMENTS,
} from "../operatorSegments";

describe("OPERATOR_SEGMENT_NAMES_BY_ID", () => {
  it("has an entry for every operator segment ID", () => {
    const allIds = Object.values(OPERATOR_SEGMENT_IDS);
    for (const id of allIds) {
      expect(OPERATOR_SEGMENT_NAMES_BY_ID[id]).toBeDefined();
    }
  });

  it("has the same count as OPERATOR_SEGMENT_IDS", () => {
    expect(Object.keys(OPERATOR_SEGMENT_NAMES_BY_ID).length).toBe(
      Object.keys(OPERATOR_SEGMENT_IDS).length
    );
  });

  it("resolves parent segment IDs to correct names", () => {
    for (const name of OPERATOR_PARENT_SEGMENTS) {
      const id = OPERATOR_SEGMENT_IDS[name];
      expect(OPERATOR_SEGMENT_NAMES_BY_ID[id]).toBe(name);
    }
  });

  it("resolves child segment IDs to correct names", () => {
    for (const name of OPERATOR_CHILD_SEGMENTS) {
      const id = OPERATOR_SEGMENT_IDS[name];
      expect(OPERATOR_SEGMENT_NAMES_BY_ID[id]).toBe(name);
    }
  });

  it("returns undefined for unknown IDs", () => {
    expect(OPERATOR_SEGMENT_NAMES_BY_ID["unknown-uuid"]).toBeUndefined();
  });

  it("returns undefined for playbook category IDs", () => {
    // Playbook IDs use 22222222-... pattern, operator uses 33333333-...
    expect(OPERATOR_SEGMENT_NAMES_BY_ID["22222222-2222-4222-8222-000000000001"]).toBeUndefined();
  });
});
