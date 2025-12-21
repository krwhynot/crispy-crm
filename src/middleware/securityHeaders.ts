/**
 * Security Headers Configuration
 *
 * Implements security headers for production readiness:
 * - Content Security Policy (CSP) - enforced in production, report-only in development
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 *
 * Based on OWASP recommendations and Atomic CRM security requirements.
 * Engineering Constitution: SINGLE SOURCE OF TRUTH - CSP config centralized in config/csp-config.ts
 */

import { getCSPConfig, buildCSPHeader } from "@/config/csp-config";

interface SecurityHeadersConfig {
  environment: "development" | "production";
}

/**
 * Get all security headers for the application
 * Uses centralized CSP configuration from config/csp-config.ts
 */
export function getSecurityHeaders(_config: SecurityHeadersConfig): Record<string, string> {
  const cspConfig = getCSPConfig();
  const cspHeader = buildCSPHeader(cspConfig);

  const headers: Record<string, string> = {
    // HTTP Strict Transport Security
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Prevent embedding in frames
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // XSS Protection (legacy browsers)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy
    "Permissions-Policy": [
      "geolocation=()",
      "camera=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  };

  // Add CSP header - enforced in production, report-only in development
  if (cspConfig.reportOnly) {
    headers["Content-Security-Policy-Report-Only"] = cspHeader;
  } else {
    headers["Content-Security-Policy"] = cspHeader;
  }

  return headers;
}

/**
 * Default configuration for different environments
 * CSP specifics are now centralized in config/csp-config.ts
 */
export const defaultConfigs = {
  development: {
    environment: "development" as const,
  },
  production: {
    environment: "production" as const,
  },
};

/**
 * Express/Connect middleware function for security headers
 */
export function securityHeadersMiddleware(config?: Partial<SecurityHeadersConfig>) {
  const environment = process.env.NODE_ENV === "production" ? "production" : "development";
  const fullConfig = {
    ...defaultConfigs[environment],
    ...config,
  };

  const headers = getSecurityHeaders(fullConfig);

  return (_req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    // Set all security headers
    Object.entries(headers).forEach(([name, value]) => {
      res.setHeader(name, value);
    });
    next();
  };
}
