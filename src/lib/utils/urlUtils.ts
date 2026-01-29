/**
 * URL utility functions for parsing and formatting URLs
 */

/**
 * Extracts the base hostname from a URL string
 * Automatically prepends https:// if protocol is missing
 *
 * @param url - URL string (with or without protocol)
 * @returns hostname (e.g., "example.com")
 *
 * @example
 * getBaseURL("https://www.example.com/path") // "www.example.com"
 * getBaseURL("example.com/path") // "example.com"
 */
export function getBaseURL(url: string): string {
  const urlObject = new URL(url.startsWith("http") ? url : `https://${url}`);
  return urlObject.hostname;
}
