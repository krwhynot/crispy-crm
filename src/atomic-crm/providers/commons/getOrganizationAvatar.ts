import type { Company } from "../../types";

// Main function to get the avatar URL
export async function getOrganizationAvatar(record: Partial<Company>): Promise<{
  src: string;
  title: string;
} | null> {
  // TD-004 [P2] LinkedIn avatar integration - Step 1: Try to get company logo from LinkedIn
  // Effort: 2-3 days | Prerequisite: Complete TD-002 (consolidate duplicate code)
  // Options: Direct LinkedIn API (complex OAuth) or third-party service (Clearbit/Hunter)
  // Tracker: docs/technical-debt-tracker.md
  //
  // TD-002 [P2] NOTE: This file is DUPLICATE of utils/avatar.utils.ts
  // Canonical location: src/atomic-crm/utils/avatar.utils.ts
  // Action: Delete this file after updating imports | Effort: 1 day

  // Step 2: Fallback to the favicon from website domain
  if (!record.website) {
    return null;
  }
  const websiteUrlWithoutScheme = record.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return {
    src: `https://favicon.show/${websiteUrlWithoutScheme}`,
    title: "Organization favicon",
  };
}
