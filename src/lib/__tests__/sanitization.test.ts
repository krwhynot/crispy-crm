import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeEmailHtml,
  sanitizeToPlainText,
  sanitizeBasicHtml,
} from '../sanitization';

describe('HTML Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous script tags', () => {
      const maliciousHtml = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    it('should remove event handlers', () => {
      const maliciousHtml = '<p onclick="alert(\'XSS\')">Click me</p>';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('Click me');
    });

    it('should allow safe HTML tags', () => {
      const safeHtml = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const sanitized = sanitizeHtml(safeHtml);

      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
      expect(sanitized).toContain('<p>');
    });

    it('should handle empty or non-string input', () => {
      expect(sanitizeHtml('')).toBe('');
      // Intentional: testing null input handling for runtime safety
      expect(sanitizeHtml(null as unknown as string)).toBe('');
      // Intentional: testing undefined input handling for runtime safety
      expect(sanitizeHtml(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeEmailHtml', () => {
    it('should allow email-friendly HTML', () => {
      const emailHtml = `
        <h2>Email Subject</h2>
        <p>Hello <strong>user</strong>,</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <a href="https://example.com">Visit us</a>
      `;
      const sanitized = sanitizeEmailHtml(emailHtml);

      expect(sanitized).toContain('<h2>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>');
      expect(sanitized).toContain('<a href=');
    });

    it('should remove dangerous content from email HTML', () => {
      const maliciousEmail = `
        <h2>Email Subject</h2>
        <script>steal_data()</script>
        <p onclick="malicious()">Click me</p>
        <form><input type="text"></form>
      `;
      const sanitized = sanitizeEmailHtml(maliciousEmail);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('<form>');
      expect(sanitized).not.toContain('<input>');
      expect(sanitized).toContain('Email Subject');
    });
  });

  describe('sanitizeToPlainText', () => {
    it('should strip all HTML tags', () => {
      const htmlContent = '<p><strong>Bold</strong> text with <a href="#">link</a></p>';
      const sanitized = sanitizeToPlainText(htmlContent);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('Bold');
      expect(sanitized).toContain('text with');
      expect(sanitized).toContain('link');
    });
  });

  describe('sanitizeBasicHtml', () => {
    it('should allow basic formatting but not links', () => {
      const htmlContent = '<p><strong>Bold</strong> and <a href="#">link</a></p>';
      const sanitized = sanitizeBasicHtml(htmlContent);

      expect(sanitized).toContain('<strong>');
      expect(sanitized).not.toContain('<a href');
      expect(sanitized).toContain('Bold');
      expect(sanitized).toContain('link'); // Text content preserved
    });
  });

  describe('XSS Prevention', () => {
    const htmlXssVectors = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg onload="alert(\'XSS\')">',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<object data="javascript:alert(\'XSS\')">',
      '<embed src="javascript:alert(\'XSS\')">',
    ];

    htmlXssVectors.forEach((vector) => {
      it(`should neutralize HTML XSS vector: ${vector}`, () => {
        const sanitized = sanitizeHtml(vector);

        // These should be stripped out as they're dangerous HTML elements/attributes
        expect(sanitized).not.toContain('script');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      });
    });

    it('should handle javascript: in href attributes correctly', () => {
      const maliciousLink = '<a href="javascript:alert(\'XSS\')">Click me</a>';
      const sanitized = sanitizeHtml(maliciousLink);

      // DOMPurify should remove or sanitize the javascript: protocol
      expect(sanitized).toContain('Click me'); // Text preserved
      // The href should be sanitized or the tag modified
      expect(sanitized).not.toMatch(/javascript:.*alert/);
    });

    it('should preserve plain text that happens to contain keywords', () => {
      // Plain text (not HTML) that contains these words should be preserved
      const plainText = 'This is a discussion about JavaScript and HTML scripts';
      const sanitized = sanitizeHtml(plainText);

      expect(sanitized).toContain('JavaScript');
      expect(sanitized).toContain('scripts');
    });
  });
});