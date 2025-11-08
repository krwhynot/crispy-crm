/**
 * CSV Upload Validator Tests
 * Tests for Phase 1 Security Remediation - Critical Security Features
 *
 * Test Coverage:
 * - File size validation (DoS prevention)
 * - MIME type validation (malicious file prevention)
 * - Binary file detection
 * - Formula injection prevention
 * - Control character sanitization
 */

import { describe, it, expect } from 'vitest';
import {
  validateCsvFile,
  sanitizeCsvValue,
  getSecurePapaParseConfig,
  CSV_UPLOAD_LIMITS,
  type CsvValidationResult,
} from '../csvUploadValidator';

describe('csvUploadValidator', () => {
  describe('validateCsvFile', () => {
    it('should accept valid CSV file', async () => {
      const csvContent = 'name,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com';
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject file exceeding size limit (DoS prevention)', async () => {
      // Create a file larger than 10MB
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].code).toBe('SIZE');
      expect(result.errors![0].message).toContain('exceeds limit');
    });

    it('should reject empty file', async () => {
      const file = new File([], 'empty.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].code).toBe('SIZE');
      expect(result.errors![0].message).toContain('empty');
    });

    it('should reject file without .csv extension', async () => {
      const file = new File(['test'], 'malicious.exe', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.code === 'MIME')).toBe(true);
    });

    it('should detect binary files disguised as CSV (JPEG)', async () => {
      // JPEG magic bytes
      const binaryData = '\xFF\xD8\xFF\xE0\x00\x10JFIF';
      const file = new File([binaryData], 'malicious.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.code === 'BINARY')).toBe(true);
    });

    it('should detect binary files disguised as CSV (ZIP)', async () => {
      // ZIP magic bytes
      const binaryData = 'PK\x03\x04' + '\x00'.repeat(100);
      const file = new File([binaryData], 'archive.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.code === 'BINARY')).toBe(true);
    });

    it('should detect binary files disguised as CSV (EXE)', async () => {
      // Windows executable magic bytes
      const binaryData = 'MZ' + '\x00'.repeat(100);
      const file = new File([binaryData], 'virus.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.code === 'BINARY')).toBe(true);
    });

    it('should reject file without CSV delimiters', async () => {
      const textWithoutDelimiters = 'This is just plain text without any commas or tabs';
      const file = new File([textWithoutDelimiters], 'plain.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors!.some(e => e.code === 'STRUCTURE')).toBe(true);
    });

    it('should warn about unusual MIME type', async () => {
      const csvContent = 'name,email\nJohn,john@test.com';
      const file = new File([csvContent], 'contacts.csv', { type: 'application/octet-stream' });

      const result = await validateCsvFile(file);

      // Should still be valid but with warning
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('MIME type'))).toBe(true);
    });

    it('should warn about control characters', async () => {
      const csvWithControlChars = 'name,email\nJohn\x00Doe,john@test.com';
      const file = new File([csvWithControlChars], 'contacts.csv', { type: 'text/csv' });

      const result = await validateCsvFile(file);

      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('control characters'))).toBe(true);
    });
  });

  describe('sanitizeCsvValue', () => {
    it('should return empty string for null/undefined', () => {
      expect(sanitizeCsvValue(null)).toBe('');
      expect(sanitizeCsvValue(undefined)).toBe('');
      expect(sanitizeCsvValue('')).toBe('');
    });

    it('should prevent formula injection (Excel formula)', () => {
      const malicious = "=cmd|'/c calc'!A0";
      const sanitized = sanitizeCsvValue(malicious);

      expect(sanitized).toBe("'=cmd|'/c calc'!A0");
      expect(sanitized.startsWith("'")).toBe(true);
    });

    it('should prevent formula injection (+ prefix)', () => {
      const malicious = '+1+1';
      const sanitized = sanitizeCsvValue(malicious);

      expect(sanitized).toBe("'+1+1");
    });

    it('should prevent formula injection (- prefix)', () => {
      const malicious = '-1';
      const sanitized = sanitizeCsvValue(malicious);

      expect(sanitized).toBe("'-1");
    });

    it('should prevent formula injection (@ prefix)', () => {
      const malicious = '@SUM(A1:A10)';
      const sanitized = sanitizeCsvValue(malicious);

      expect(sanitized).toBe("'@SUM(A1:A10)");
    });

    it('should remove control characters', () => {
      const withControlChars = 'John\x00\x01\x02Doe';
      const sanitized = sanitizeCsvValue(withControlChars);

      expect(sanitized).toBe('JohnDoe');
      expect(sanitized).not.toMatch(/[\x00-\x1F]/);
    });

    it('should remove HTML/script tags', () => {
      const withHTML = '<script>alert("XSS")</script>John Doe';
      const sanitized = sanitizeCsvValue(withHTML);

      expect(sanitized).toBe('John Doe');
      expect(sanitized).not.toContain('<script>');
    });

    it('should trim whitespace', () => {
      const withWhitespace = '  John Doe  ';
      const sanitized = sanitizeCsvValue(withWhitespace);

      expect(sanitized).toBe('John Doe');
    });

    it('should limit cell length', () => {
      const longText = 'x'.repeat(2000);
      const sanitized = sanitizeCsvValue(longText);

      expect(sanitized.length).toBe(CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH);
    });

    it('should preserve normal text', () => {
      const normalText = 'John Doe';
      const sanitized = sanitizeCsvValue(normalText);

      expect(sanitized).toBe('John Doe');
    });

    it('should handle numbers as strings', () => {
      const numberText = '12345';
      const sanitized = sanitizeCsvValue(numberText);

      expect(sanitized).toBe('12345');
    });

    it('should handle email addresses', () => {
      const email = 'john.doe@example.com';
      const sanitized = sanitizeCsvValue(email);

      expect(sanitized).toBe('john.doe@example.com');
    });
  });

  describe('getSecurePapaParseConfig', () => {
    it('should disable dynamic typing (prevents formula evaluation)', () => {
      const config = getSecurePapaParseConfig();

      expect(config.dynamicTyping).toBe(false);
    });

    it('should set max rows preview limit', () => {
      const config = getSecurePapaParseConfig();

      expect(config.preview).toBe(CSV_UPLOAD_LIMITS.MAX_ROWS);
    });

    it('should have header parsing enabled', () => {
      const config = getSecurePapaParseConfig();

      expect(config.header).toBe(true);
    });

    it('should skip empty lines', () => {
      const config = getSecurePapaParseConfig();

      expect(config.skipEmptyLines).toBe(true);
    });

    it('should sanitize headers via transformHeader', () => {
      const config = getSecurePapaParseConfig();

      expect(config.transformHeader).toBeDefined();

      // Test header transformation
      const maliciousHeader = '  Name <script>  ';
      const transformed = config.transformHeader!(maliciousHeader, 0);

      expect(transformed).toBe('name__script__');
      expect(transformed).not.toContain('<script>');
    });

    it('should sanitize cell values via transform (formula injection)', () => {
      const config = getSecurePapaParseConfig();

      expect(config.transform).toBeDefined();

      // Test formula injection prevention
      const maliciousValue = "=cmd|'/c calc'!A0";
      const transformed = config.transform!(maliciousValue, 'name');

      expect(transformed).toBe("'=cmd|'/c calc'!A0");
    });

    it('should limit cell length via transform', () => {
      const config = getSecurePapaParseConfig();

      const longValue = 'x'.repeat(2000);
      const transformed = config.transform!(longValue, 'name');

      expect(transformed.length).toBeLessThanOrEqual(CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH + 3); // +3 for '...'
    });

    it('should have error handler defined', () => {
      const config = getSecurePapaParseConfig();

      expect(config.error).toBeDefined();
    });
  });

  describe('CSV_UPLOAD_LIMITS', () => {
    it('should have reasonable file size limit', () => {
      expect(CSV_UPLOAD_LIMITS.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
    });

    it('should have reasonable row limit', () => {
      expect(CSV_UPLOAD_LIMITS.MAX_ROWS).toBe(10000);
    });

    it('should have reasonable cell length limit', () => {
      expect(CSV_UPLOAD_LIMITS.MAX_CELL_LENGTH).toBe(1000);
    });

    it('should allow CSV MIME types', () => {
      expect(CSV_UPLOAD_LIMITS.ALLOWED_MIME_TYPES).toContain('text/csv');
      expect(CSV_UPLOAD_LIMITS.ALLOWED_MIME_TYPES).toContain('text/plain');
    });

    it('should allow .csv extension', () => {
      expect(CSV_UPLOAD_LIMITS.ALLOWED_EXTENSIONS).toContain('.csv');
    });
  });
});
