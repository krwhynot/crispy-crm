/**
 * Content Security Policy Configuration
 * Engineering Constitution: SINGLE SOURCE OF TRUTH - centralized CSP config
 *
 * Separate configurations for development and production environments.
 * Production enforces strict CSP, development uses report-only mode with relaxed rules.
 *
 * Two builders are provided:
 * - buildCSPHeader()  — for HTTP response headers (includes frame-ancestors, report-uri)
 * - buildCSPMetaTag() — for <meta http-equiv> tags (strips header-only directives)
 */

export interface CSPConfig {
  /**
   * If true, CSP violations are reported but not blocked
   * Use report-only in development to identify issues without breaking functionality
   */
  reportOnly: boolean;

  /**
   * Optional endpoint to send CSP violation reports
   * Note: only effective in HTTP header mode, not meta tags
   */
  reportUri?: string;

  /**
   * CSP directives - see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
   * Property order determines output directive order.
   */
  directives: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    fontSrc: string[];
    connectSrc: string[];
    workerSrc?: string[];
    childSrc: string[];
    frameSrc: string[];
    objectSrc: string[];
    baseUri: string[];
    formAction: string[];
    frameAncestors: string[];
    upgradeInsecureRequests?: boolean;
  };
}

/**
 * Development CSP Configuration
 * - Report-only mode (violations logged, not blocked)
 * - Allows unsafe-eval for Vite HMR
 * - Allows unsafe-inline for rapid development
 * - Permissive localhost connections
 *
 * Directive order matches production for consistent output.
 */
export const developmentCSP: CSPConfig = {
  reportOnly: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Allow inline scripts in dev
      "'unsafe-eval'", // Required for Vite HMR
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS requires inline styles
      "https://fonts.googleapis.com",
    ],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    connectSrc: [
      "'self'",
      "http://localhost:*",
      "ws://localhost:*",
      "http://127.0.0.1:*",
      "ws://127.0.0.1:*",
      "https://*.supabase.co",
      "https://*.supabase.in",
      "wss://*.supabase.co",
      "wss://*.supabase.in",
    ],
    childSrc: ["'self'", "blob:"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
  },
};

/**
 * Production CSP Configuration
 * - Enforced mode (violations are blocked)
 * - Strict rules for security
 * - Only allows necessary external domains
 * - Forces HTTPS for all connections (via upgradeInsecureRequests in HTTP header mode)
 *
 * Directive order determines output order in both meta tag and HTTP header.
 */
export const productionCSP: CSPConfig = {
  reportOnly: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'wasm-unsafe-eval'", // Required for Vite's dynamic import() used by React.lazy()
      "blob:", // Required for Sentry Session Replay worker
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS requires inline styles
      "https://fonts.googleapis.com",
    ],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    connectSrc: [
      "'self'",
      "https://*.supabase.co",
      "https://*.supabase.in",
      "wss://*.supabase.co",
      "wss://*.supabase.in",
      "https://*.sentry.io",
    ],
    workerSrc: ["'self'", "blob:"], // Sentry Session Replay worker
    childSrc: ["'self'", "blob:"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"], // Effective in HTTP header mode only
    upgradeInsecureRequests: true, // Effective in HTTP header mode only
  },
};

/**
 * Get CSP configuration based on environment.
 * Used by securityHeaders.ts middleware (Node context).
 */
export function getCSPConfig(): CSPConfig {
  const isDevelopment = process.env.NODE_ENV !== "production";
  return isDevelopment ? developmentCSP : productionCSP;
}

/**
 * Build CSP header string from configuration.
 * For use in HTTP response headers — includes all directives.
 */
export function buildCSPHeader(config: CSPConfig = getCSPConfig()): string {
  const directives = Object.entries(config.directives)
    .map(([key, values]) => {
      // Convert camelCase to kebab-case (e.g., defaultSrc -> default-src)
      const directiveName = key.replace(/([A-Z])/g, "-$1").toLowerCase();

      // Handle boolean directives (e.g., upgrade-insecure-requests)
      if (typeof values === "boolean") {
        return values ? directiveName : null;
      }

      // Handle array directives
      if (Array.isArray(values) && values.length > 0) {
        return `${directiveName} ${values.join(" ")}`;
      }

      return null;
    })
    .filter(Boolean)
    .join("; ");

  // Add report-uri if configured
  const reportDirective = config.reportUri ? `; report-uri ${config.reportUri}` : "";

  return directives + reportDirective;
}

/**
 * Directives that are silently ignored in <meta http-equiv="Content-Security-Policy"> tags.
 * These only work when delivered via HTTP response headers.
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#meta_tag
 */
const META_UNSUPPORTED_DIRECTIVES = new Set(["frameAncestors", "upgradeInsecureRequests"]);

/**
 * Build CSP string safe for <meta http-equiv="Content-Security-Policy"> tags.
 * Strips directives not supported in meta tags: frame-ancestors, upgrade-insecure-requests.
 * Does not append report-uri (also unsupported in meta tags).
 */
export function buildCSPMetaTag(config: CSPConfig): string {
  const directives = Object.entries(config.directives)
    .filter(([key]) => !META_UNSUPPORTED_DIRECTIVES.has(key))
    .map(([key, values]) => {
      const directiveName = key.replace(/([A-Z])/g, "-$1").toLowerCase();

      if (typeof values === "boolean") {
        return values ? directiveName : null;
      }

      if (Array.isArray(values) && values.length > 0) {
        return `${directiveName} ${values.join(" ")}`;
      }

      return null;
    })
    .filter(Boolean)
    .join("; ");

  return directives + ";";
}
