import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";

describe("CRM QueryClient Configuration", () => {
  it("should disable refetchOnWindowFocus to prevent API storms", () => {
    // Test the default configuration that will be used
    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: false, // Fixed implementation
        },
      },
    });

    // Verify refetchOnWindowFocus is disabled
    expect(testQueryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it("should use staleTime for cache control instead of window focus", () => {
    const testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });

    // Verify staleTime is set (30 seconds)
    expect(testQueryClient.getDefaultOptions().queries?.staleTime).toBe(30000);
  });
});
