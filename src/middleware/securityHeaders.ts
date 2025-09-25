/**
 * Security Headers Configuration
 *
 * Implements security headers for production readiness:
 * - Content Security Policy (CSP) - initially in report-only mode
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 *
 * Based on OWASP recommendations and Atomic CRM security requirements.
 */

interface SecurityHeadersConfig {
  environment: 'development' | 'production';
  reportUri?: string;
  allowedDomains?: string[];
}

/**
 * Generate Content Security Policy header value
 * Starts in report-only mode to identify violations before enforcement
 */
export function generateCSP(config: SecurityHeadersConfig): string {
  // Base CSP policy for Atomic CRM
  const policy = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Vite development server in dev mode
      config.environment === 'development' ? "'unsafe-eval'" : null,
      // Hash-based script allowlist for inline scripts
      "'sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E='", // For main script
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Needed for Tailwind CSS and dynamic styles
      // Supabase and external stylesheets
      'fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'fonts.gstatic.com',
      'data:', // For inline fonts
    ],
    'img-src': [
      "'self'",
      'data:', // For base64 encoded images
      'blob:', // For uploaded images
      // Supabase storage
      '*.supabase.co',
      // Allow specific domains for user avatars and logos
      'https:', // Allow HTTPS images only
    ],
    'connect-src': [
      "'self'",
      // Supabase backend
      '*.supabase.co',
      'wss://*.supabase.co', // WebSocket connections
      // Allow configured domains
      ...(config.allowedDomains || []),
    ],
    'frame-src': ["'none'"], // Prevent embedding
    'object-src': ["'none'"], // Prevent plugin content
    'base-uri': ["'self'"], // Restrict base URI
    'form-action': ["'self'"], // Restrict form submissions
    'frame-ancestors': ["'none'"], // Prevent being embedded
    'upgrade-insecure-requests': [], // Force HTTPS in production
  };

  // Convert policy object to CSP string
  const cspString = Object.entries(policy)
    .map(([directive, values]) => {
      if (Array.isArray(values) && values.length === 0) {
        return directive; // Directives without values
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');

  // Add report URI if provided
  if (config.reportUri) {
    return `${cspString}; report-uri ${config.reportUri}`;
  }

  return cspString;
}

/**
 * Get all security headers for the application
 */
export function getSecurityHeaders(config: SecurityHeadersConfig): Record<string, string> {
  const headers: Record<string, string> = {
    // Content Security Policy (start in report-only mode)
    'Content-Security-Policy-Report-Only': generateCSP(config),

    // HTTP Strict Transport Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Prevent embedding in frames
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy
    'Permissions-Policy': [
      'geolocation=()',
      'camera=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),
  };

  // In production, upgrade to enforced CSP after testing
  if (config.environment === 'production') {
    // TODO: After CSP report-only testing, switch to enforced mode:
    // delete headers['Content-Security-Policy-Report-Only'];
    // headers['Content-Security-Policy'] = generateCSP(config);
  }

  return headers;
}

/**
 * Default configuration for different environments
 */
export const defaultConfigs = {
  development: {
    environment: 'development' as const,
    allowedDomains: [
      'localhost:*',
      '127.0.0.1:*',
      'ws://localhost:*',
      'ws://127.0.0.1:*',
    ],
  },
  production: {
    environment: 'production' as const,
    reportUri: '/api/csp-report', // TODO: Implement CSP reporting endpoint
    allowedDomains: [
      // TODO: Add production domain allowlist
      'https://yourdomain.com',
    ],
  },
};

/**
 * Express/Connect middleware function for security headers
 */
export function securityHeadersMiddleware(config?: Partial<SecurityHeadersConfig>) {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const fullConfig = {
    ...defaultConfigs[environment],
    ...config,
  };

  const headers = getSecurityHeaders(fullConfig);

  return (_req: any, res: any, next: any) => {
    // Set all security headers
    Object.entries(headers).forEach(([name, value]) => {
      res.setHeader(name, value);
    });
    next();
  };
}