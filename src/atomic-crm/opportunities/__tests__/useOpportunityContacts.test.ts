import { renderHook, waitFor } from "@testing-library/react";
import { useOpportunityContacts } from "../useOpportunityContacts";
import { useGetMany } from "react-admin";
import { describe, it, expect, vi } from "vitest";
import type * as ReactAdmin from "react-admin";
import type { RaRecord } from "ra-core";
import { mockUseGetManyReturn } from "@/tests/utils";

vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useGetMany: vi.fn(),
  };
});

interface ContactRecord extends RaRecord {
  firstName: string;
  lastName: string;
}

describe("useOpportunityContacts", () => {
  it("returns primary contact when contact_ids has values", async () => {
    vi.mocked(useGetMany<ContactRecord>).mockReturnValue(
      mockUseGetManyReturn<ContactRecord>({
        data: [{ id: 1, firstName: "John", lastName: "Doe" }],
        isLoading: false,
      })
    );

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
    vi.mocked(useGetMany<ContactRecord>).mockReturnValue(
      mockUseGetManyReturn<ContactRecord>({
        data: [],
        isLoading: false,
      })
    );

    const { result } = renderHook(() => useOpportunityContacts([]));

    expect(result.current.primaryContact).toBeNull();
  });
});
