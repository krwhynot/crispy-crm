/**
 * Content Security Policy Configuration
 * Engineering Constitution: SINGLE SOURCE OF TRUTH - centralized CSP config
 *
 * Separate configurations for development and production environments.
 * Production enforces strict CSP, development uses report-only mode with relaxed rules.
 */

export interface CSPConfig {
  /**
   * If true, CSP violations are reported but not blocked
   * Use report-only in development to identify issues without breaking functionality
   */
  reportOnly: boolean;

  /**
   * Optional endpoint to send CSP violation reports
   */
  reportUri?: string;

  /**
   * CSP directives - see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
   */
  directives: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
    childSrc: string[];
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
 */
export const developmentCSP: CSPConfig = {
  reportOnly: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Allow inline scripts in dev
      "'unsafe-eval'", // Required for Vite HMR
      "'sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E='", // Main script hash
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS requires inline styles
      "https://fonts.googleapis.com",
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "http:", // Allow HTTP in development
      "*.supabase.co",
      "https://ui-avatars.com", // Avatar generation service
    ],
    connectSrc: [
      "'self'",
      "http://localhost:*",
      "ws://localhost:*",
      "http://127.0.0.1:*",
      "ws://127.0.0.1:*",
      "*.supabase.co",
      "wss://*.supabase.co",
    ],
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    childSrc: ["'self'", "blob:"],
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
 * - Forces HTTPS for all connections
 */
export const productionCSP: CSPConfig = {
  reportOnly: false, // Enforce in production
  reportUri: "/api/csp-report", // Report violations for monitoring
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      // No unsafe-eval or unsafe-inline in production
      "'sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E='", // Main script hash
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS requires inline styles (consider hash-based approach for stricter CSP)
      "https://fonts.googleapis.com",
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:", // Only HTTPS images in production
      "https://*.supabase.co", // Supabase storage
      "https://ui-avatars.com", // Avatar generation service
    ],
    connectSrc: [
      "'self'",
      "https://*.supabase.co", // Supabase API
      "wss://*.supabase.co", // Supabase realtime WebSocket
    ],
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    childSrc: ["'self'", "blob:"],
    baseUri: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true, // Force HTTPS
  },
};

/**
 * Get CSP configuration based on environment
 */
export function getCSPConfig(): CSPConfig {
  const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV !== "production";
  return isDevelopment ? developmentCSP : productionCSP;
}

/**
 * Build CSP header string from configuration
 * Converts CSP config object to header format
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
