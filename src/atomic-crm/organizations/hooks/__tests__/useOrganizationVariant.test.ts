/**
 * Tests for useOrganizationVariant hook
 *
 * Verifies variant detection and helper methods:
 * - Detects quickCreate from URL path
 * - Detects edit mode from record.id
 * - Falls back to create mode
 * - Helper methods return correct values
 */
import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useOrganizationVariant } from "../useOrganizationVariant";

// Mock react-router-dom's useLocation
const mockLocation = vi.fn();
vi.mock("react-router-dom", () => ({
  useLocation: () => mockLocation(),
}));

// Mock react-admin's useRecordContext
const mockRecordContext = vi.fn();
vi.mock("react-admin", () => ({
  useRecordContext: () => mockRecordContext(),
}));

describe("useOrganizationVariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects quickCreate variant from URL path", () => {
    mockLocation.mockReturnValue({ pathname: "/organizations/create/quick", state: null });
    mockRecordContext.mockReturnValue(null);

    const { result } = renderHook(() => useOrganizationVariant());

    expect(result.current.variant).toBe("quickCreate");
    expect(result.current.allowUnknownSegment).toBe(true);
    expect(result.current.isRequired("segment_id")).toBe(true);
    expect(result.current.isRequired("sales_id")).toBe(false); // Not required in quickCreate
  });

  it("detects edit variant from record.id", () => {
    mockLocation.mockReturnValue({ pathname: "/organizations/123", state: null });
    mockRecordContext.mockReturnValue({ id: "123", name: "Test Org" });

    const { result } = renderHook(() => useOrganizationVariant());

    expect(result.current.variant).toBe("edit");
    expect(result.current.allowUnknownSegment).toBe(true);
    expect(result.current.isRequired("name")).toBe(true);
    expect(result.current.shouldPreserve("created_at")).toBe(true);
  });
});
