/**
 * Avatar utilities barrel export
 *
 * Provides utilities for avatar/favicon generation:
 * - fetchWithTimeout: HTTP fetch with configurable timeout
 * - DOMAINS_NOT_SUPPORTING_FAVICON: Email domains to skip for favicon lookup
 */
export { fetchWithTimeout } from "./fetchWithTimeout";
export { DOMAINS_NOT_SUPPORTING_FAVICON } from "./unsupportedDomains.const";
