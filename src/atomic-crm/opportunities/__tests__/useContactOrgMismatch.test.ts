import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContactOrgMismatch } from "../useContactOrgMismatch";
import { useGetMany } from "react-admin";
import type { Contact } from "../../../types";
import type * as ReactAdmin from "react-admin";

// Mock react-admin - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useGetMany: vi.fn(),
  };
});

const mockUseGetMany = vi.mocked(useGetMany);

describe("useContactOrgMismatch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns no mismatch when contacts match customer org", () => {
    const contacts: Partial<Contact>[] = [
      { id: 1, first_name: "John", last_name: "Doe", organization_id: 100 },
      { id: 2, first_name: "Jane", last_name: "Smith", organization_id: 100 },
    ];

    mockUseGetMany.mockReturnValue({
      data: contacts as Contact[],
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useContactOrgMismatch([1, 2], 100) // Customer org is 100
    );

    expect(result.current.hasMismatch).toBe(false);
    expect(result.current.mismatchedContacts).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("detects mismatch when contact org differs from customer org", () => {
    const contacts: Partial<Contact>[] = [
      { id: 1, first_name: "John", last_name: "Doe", organization_id: 200 }, // Different org!
      { id: 2, first_name: "Jane", last_name: "Smith", organization_id: 100 }, // Matches
    ];

    mockUseGetMany.mockReturnValue({
      data: contacts as Contact[],
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useContactOrgMismatch([1, 2], 100) // Customer org is 100
    );

    expect(result.current.hasMismatch).toBe(true);
    expect(result.current.mismatchedContacts).toHaveLength(1);
    expect(result.current.mismatchedContacts[0].contact.first_name).toBe("John");
    expect(result.current.mismatchedContacts[0].contactOrgId).toBe(200);
  });

  it("handles all contacts mismatched", () => {
    const contacts: Partial<Contact>[] = [
      { id: 1, first_name: "John", last_name: "Doe", organization_id: 200 },
      { id: 2, first_name: "Jane", last_name: "Smith", organization_id: 300 },
    ];

    mockUseGetMany.mockReturnValue({
      data: contacts as Contact[],
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useContactOrgMismatch([1, 2], 100) // Customer org is 100
    );

    expect(result.current.hasMismatch).toBe(true);
    expect(result.current.mismatchedContacts).toHaveLength(2);
  });

  it("returns no mismatch when customerOrganizationId is null", () => {
    mockUseGetMany.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useContactOrgMismatch([1, 2], null));

    expect(result.current.hasMismatch).toBe(false);
    expect(result.current.mismatchedContacts).toHaveLength(0);
  });

  it("returns no mismatch when contactIds is empty", () => {
    mockUseGetMany.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useContactOrgMismatch([], 100));

    expect(result.current.hasMismatch).toBe(false);
    expect(result.current.mismatchedContacts).toHaveLength(0);
  });

  it("handles loading state correctly", () => {
    mockUseGetMany.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isFetching: true,
      isPending: true,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useContactOrgMismatch([1, 2], 100));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasMismatch).toBe(false);
  });

  it("ignores contacts without organization_id", () => {
    const contacts: Partial<Contact>[] = [
      { id: 1, first_name: "John", last_name: "Doe", organization_id: null }, // No org
      { id: 2, first_name: "Jane", last_name: "Smith", organization_id: undefined }, // No org
      { id: 3, first_name: "Bob", last_name: "Wilson", organization_id: 100 }, // Matches
    ];

    mockUseGetMany.mockReturnValue({
      data: contacts as Contact[],
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useContactOrgMismatch([1, 2, 3], 100));

    // Contacts without org_id are not considered mismatched
    expect(result.current.hasMismatch).toBe(false);
    expect(result.current.mismatchedContacts).toHaveLength(0);
  });

  it("handles string vs number ID comparison correctly", () => {
    // This tests the String() coercion in the comparison
    const contacts: Partial<Contact>[] = [
      { id: 1, first_name: "John", last_name: "Doe", organization_id: "100" as unknown as number },
    ];

    mockUseGetMany.mockReturnValue({
      data: contacts as Contact[],
      isLoading: false,
      error: null,
      isFetching: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(
      () => useContactOrgMismatch([1], 100) // Number 100 should match string "100"
    );

    expect(result.current.hasMismatch).toBe(false);
  });
});
