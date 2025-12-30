import { renderHook, waitFor } from "@testing-library/react";
import { useOpportunityContacts } from "../hooks/useOpportunityContacts";
import { useGetMany } from "react-admin";
import { describe, it, expect, vi } from "vitest";
import type * as ReactAdmin from "react-admin";

vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useGetMany: vi.fn(),
  };
});

describe("useOpportunityContacts", () => {
  it("returns primary contact when contact_ids has values", async () => {
    (useGetMany as any).mockReturnValue({
      data: [{ id: 1, firstName: "John", lastName: "Doe" }],
      isLoading: false,
    });

    const { result } = renderHook(() => useOpportunityContacts([1, 2]));

    await waitFor(() => {
      expect(result.current.primaryContact).toEqual({
        id: 1,
        firstName: "John",
        lastName: "Doe",
      });
    });
  });

  it("returns null when contact_ids is empty", () => {
    (useGetMany as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useOpportunityContacts([]));

    expect(result.current.primaryContact).toBeNull();
  });
});
