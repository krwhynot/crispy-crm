import type { Page } from "@playwright/test";
import {
  mockKpiData,
  mockPipelineData,
  mockActivityTrendData,
  mockTopPrincipalsData,
  mockRepPerformanceData,
} from "./mocks/reports-overview.mock";

/**
 * Mocks the Supabase RPC calls for the Reports Overview page.
 * This intercepts network requests and provides mock data instead of hitting the live API.
 *
 * @param page The Playwright page object.
 */
export async function mockReportsOverview(page: Page) {
  // The URL pattern for Supabase RPC calls
  const rpcUrlPattern = "**/rest/v1/rpc/**";

  await page.route(rpcUrlPattern, async (route) => {
    const request = route.request();
    const url = request.url();

    // Fulfill based on the RPC function name in the URL
    if (url.endsWith("/get_report_kpis")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockKpiData) });
    } else if (url.endsWith("/get_pipeline_by_stage")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockPipelineData) });
    } else if (url.endsWith("/get_activity_trend")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockActivityTrendData) });
    } else if (url.endsWith("/get_top_principals")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockTopPrincipalsData) });
    } else if (url.endsWith("/get_rep_performance")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockRepPerformanceData) });
    } else {
      // For any other RPC call, let it proceed to the network
      await route.continue();
    }
  });
}
