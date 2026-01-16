/**
 * Avatar and logo processing utilities
 *
 * Extracted from data provider commons for reuse in transformer registry
 * following Engineering Constitution principle #1: Single unified data provider
 */

import { fetchWithTimeout, DOMAINS_NOT_SUPPORTING_FAVICON } from "./avatar";
import type { Contact } from "../types";
import type { Organization } from "../validation/organizations";
import { emailAndTypeSchema } from "../validation/contacts";

/**
 * Generate SHA-256 hash of a string
 *
 * @param string - String to hash
 * @returns Promise resolving to hex string hash
 */
export async function hash(string: string): Promise<string> {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Get Gravatar URL for an email address
 *
 * @param email - Email address to generate Gravatar URL for
 * @returns Promise resolving to Gravatar URL
 */
export async function getGravatarUrl(email: string): Promise<string> {
  const hashEmail = await hash(email);
  return `https://www.gravatar.com/avatar/${hashEmail}?d=404`;
}

/**
 * Get favicon URL for a domain
 *
 * @param domain - Domain to get favicon for
 * @returns Promise resolving to favicon URL or null if not available
 */
export async function getFaviconUrl(domain: string): Promise<string | null> {
  if (DOMAINS_NOT_SUPPORTING_FAVICON.includes(domain)) {
    return null;
  }

  try {
    const faviconUrl = `https://${domain}/favicon.ico`;
    const response = await fetchWithTimeout(faviconUrl);
    if (response.ok) {
      return faviconUrl;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Generate avatar URL for a contact
 *
 * Tries multiple strategies in order:
 * 1. Gravatar from email addresses
 * 2. Favicon from email domain
 * 3. Future: LinkedIn profile image
 *
 * @param record - Contact record with email information
 * @returns Promise resolving to avatar URL or null if none found
 */
export async function getContactAvatar(record: Partial<Contact>): Promise<string | null> {
  if (!record.email || !record.email.length) {
    return null;
  }

  for (const { value: email } of record.email) {
    // Step 1: Try to get Gravatar image
    const gravatarUrl = await getGravatarUrl(email);
    try {
      const gravatarResponse = await fetch(gravatarUrl);
      if (gravatarResponse.ok) {
        return gravatarUrl;
      }
    } catch {
      // Gravatar not found
    }

    // Step 2: Try to get favicon from email domain
    const domain = email.split("@")[1] ?? "";
    const faviconUrl = await getFaviconUrl(domain);
    if (faviconUrl) {
      return faviconUrl;
    }

    // TD-004 [P2] LinkedIn avatar integration - Step 3: Try to get image from LinkedIn
    // Effort: 2-3 days | Options: Direct LinkedIn API (OAuth) or third-party (Clearbit/Hunter)
    // Prerequisite: Product decision on build vs buy approach
    // Tracker: docs/technical-debt-tracker.md
  }

  return null;
}

/**
 * Generate logo/avatar for an organization
 *
 * Tries multiple strategies in order:
 * 1. Future: LinkedIn company logo
 * 2. Website favicon using favicon.show service
 *
 * @param record - Organization record with website information
 * @returns Promise resolving to logo object or null if none found
 */
export async function getOrganizationAvatar(record: Partial<Organization>): Promise<{
  src: string;
  title: string;
} | null> {
  // TD-004 [P2] LinkedIn avatar integration - Step 1: Try to get company logo from LinkedIn
  // Effort: 2-3 days | Options: Direct LinkedIn API (OAuth) or third-party (Clearbit/Hunter)
  // Prerequisite: Product decision on build vs buy approach
  // Tracker: docs/technical-debt-tracker.md

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

/**
 * Process contact avatar during create/update
 *
 * Generates avatar if none provided, following the contact avatar strategy
 *
 * @param contactData - Contact data being processed
 * @returns Promise resolving to updated contact data
 */
export async function processContactAvatar(
  contactData: Partial<Contact>
): Promise<Partial<Contact>> {
  // Only generate avatar if none provided and we have email
  if (!contactData.avatar && contactData.email) {
    const avatarUrl = await getContactAvatar(contactData);
    if (avatarUrl) {
      contactData.avatar = {
        src: avatarUrl,
        title: "Generated avatar",
      };
    }
  }

  return contactData;
}

/**
 * Process organization logo during create/update
 *
 * Generates logo if none provided and file object doesn't have src,
 * following the organization logo strategy
 *
 * @param organizationData - Organization data being processed
 * @returns Promise resolving to updated organization data
 */
export async function processOrganizationLogo(
  organizationData: Partial<Organization>
): Promise<Partial<Organization>> {
  // Only process if logo exists but doesn't have src (newly uploaded file)
  if (organizationData.logo && !organizationData.logo.src) {
    const logoInfo = await getOrganizationAvatar(organizationData);
    if (logoInfo) {
      organizationData.logo = {
        ...organizationData.logo,
        src: logoInfo.src,
        title: logoInfo.title,
      };
    }
  }

  return organizationData;
}

/**
 * Extract domain from email address
 *
 * @param email - Email address to extract domain from
 * @returns Domain part of the email address
 */
export function extractEmailDomain(email: string): string {
  return email.split("@")[1] ?? "";
}

/**
 * Extract local part (username) from email address.
 * Counterpart to extractEmailDomain().
 *
 * @param email - Email address to extract local part from
 * @returns Local part (username) of the email, or empty string if invalid
 *
 * @example
 * extractEmailLocalPart("john.doe@example.com")
 * // => "john.doe"
 *
 * @example
 * extractEmailLocalPart("")
 * // => ""
 */
export function extractEmailLocalPart(email: string): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[0] ?? "";
}

/**
 * Check if email has a valid format for avatar generation
 *
 * Uses the same validation as contact forms (Zod schema)
 * to maintain single source of truth.
 *
 * @param email - Email address to validate
 * @returns True if email is valid for avatar generation
 */
export function isValidEmailForAvatar(email: string): boolean {
  const result = emailAndTypeSchema.shape.value.safeParse(email);
  return result.success;
}

/**
 * Generate fallback avatar URL for use when all other methods fail
 *
 * @param name - Name to use for generating fallback avatar
 * @returns URL for a generated avatar service
 */
export function getFallbackAvatarUrl(name: string): string {
  // Using a simple avatar generation service as fallback
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
}

/**
 * Get organization name for logo generation
 *
 * @param organization - Organization record
 * @returns Organization name or fallback
 */
export function getOrganizationName(organization: Partial<Organization>): string {
  return organization.name || "Unknown Organization";
}

/**
 * Clean website URL for favicon processing
 *
 * Removes protocol and trailing slash to get clean domain
 *
 * @param website - Website URL to clean
 * @returns Clean domain string
 */
export function cleanWebsiteUrl(website: string): string {
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
