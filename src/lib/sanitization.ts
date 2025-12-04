import DOMPurify from 'dompurify';

/**
 * Configuration for different HTML sanitization contexts
 */
export interface SanitizationConfig {
  /** Allow basic text formatting tags like <b>, <i>, <em>, <strong> */
  allowBasicFormatting?: boolean;
  /** Allow links with href attributes */
  allowLinks?: boolean;
  /** Allow list elements <ul>, <ol>, <li> */
  allowLists?: boolean;
  /** Allow headings <h1> through <h6> */
  allowHeadings?: boolean;
  /** Allow paragraph <p> and line break <br> tags */
  allowParagraphs?: boolean;
  /** Custom allowed tags (overrides other options if provided) */
  allowedTags?: string[];
  /** Custom allowed attributes (overrides other options if provided) */
  allowedAttributes?: string[];
}

/**
 * Default safe configuration for general HTML content
 */
const DEFAULT_CONFIG: Required<Pick<SanitizationConfig, 'allowBasicFormatting' | 'allowLinks' | 'allowLists' | 'allowHeadings' | 'allowParagraphs'>> = {
  allowBasicFormatting: true,
  allowLinks: true,
  allowLists: true,
  allowHeadings: true,
  allowParagraphs: true,
};

/**
 * Builds DOMPurify configuration based on sanitization options
 */
function buildPurifyConfig(config: SanitizationConfig = {}): DOMPurify.Config {
  const {
    allowBasicFormatting = DEFAULT_CONFIG.allowBasicFormatting,
    allowLinks = DEFAULT_CONFIG.allowLinks,
    allowLists = DEFAULT_CONFIG.allowLists,
    allowHeadings = DEFAULT_CONFIG.allowHeadings,
    allowParagraphs = DEFAULT_CONFIG.allowParagraphs,
    allowedTags,
    allowedAttributes,
  } = config;

  // If custom tags/attributes are provided, use them directly
  if (allowedTags || allowedAttributes) {
    return {
      ALLOWED_TAGS: allowedTags || [],
      ALLOWED_ATTR: allowedAttributes || [],
      KEEP_CONTENT: true,
    };
  }

  // Build allowed tags based on configuration
  const tags: string[] = [];
  const attributes: string[] = [];

  if (allowBasicFormatting) {
    tags.push('b', 'i', 'em', 'strong', 'u', 's', 'sup', 'sub');
  }

  if (allowLinks) {
    tags.push('a');
    attributes.push('href');
  }

  if (allowLists) {
    tags.push('ul', 'ol', 'li');
  }

  if (allowHeadings) {
    tags.push('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
  }

  if (allowParagraphs) {
    tags.push('p', 'br', 'div');
  }

  // Note: 'style' attribute intentionally excluded to prevent CSS injection attacks
  // Use class-based styling instead
  attributes.push('class');

  return {
    ALLOWED_TAGS: tags,
    ALLOWED_ATTR: attributes,
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  };
}

/**
 * Sanitizes HTML content using DOMPurify with configurable security levels
 *
 * @param htmlContent - The HTML string to sanitize
 * @param config - Sanitization configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(htmlContent: string, config?: SanitizationConfig): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  const purifyConfig = buildPurifyConfig(config);
  return DOMPurify.sanitize(htmlContent, purifyConfig);
}

/**
 * Sanitizes HTML for email templates - allows common email formatting
 */
export function sanitizeEmailHtml(htmlContent: string): string {
  return sanitizeHtml(htmlContent, {
    allowBasicFormatting: true,
    allowLinks: true,
    allowLists: true,
    allowHeadings: true,
    allowParagraphs: true,
  });
}

/**
 * Sanitizes HTML for plain text contexts - strips all tags
 */
export function sanitizeToPlainText(htmlContent: string): string {
  return sanitizeHtml(htmlContent, {
    allowedTags: [],
    allowedAttributes: [],
  });
}

/**
 * Sanitizes HTML for basic formatting only - no links or complex elements
 */
export function sanitizeBasicHtml(htmlContent: string): string {
  return sanitizeHtml(htmlContent, {
    allowBasicFormatting: true,
    allowLinks: false,
    allowLists: false,
    allowHeadings: false,
    allowParagraphs: true,
  });
}

