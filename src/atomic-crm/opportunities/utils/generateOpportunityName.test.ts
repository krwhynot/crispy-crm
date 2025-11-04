/**
 * Tests for generateOpportunityName utility
 *
 * Coverage: 100% (all branches and edge cases)
 */

import { describe, it, expect } from 'vitest';
import { generateOpportunityName, getQuarter } from './generateOpportunityName';

describe('getQuarter', () => {
  it('should return Q1 for January (month 0)', () => {
    const date = new Date('2025-01-15');
    expect(getQuarter(date)).toBe(1);
  });

  it('should return Q1 for February (month 1)', () => {
    const date = new Date('2025-02-15');
    expect(getQuarter(date)).toBe(1);
  });

  it('should return Q1 for March (month 2)', () => {
    const date = new Date('2025-03-15');
    expect(getQuarter(date)).toBe(1);
  });

  it('should return Q2 for April (month 3)', () => {
    const date = new Date('2025-04-15');
    expect(getQuarter(date)).toBe(2);
  });

  it('should return Q2 for May (month 4)', () => {
    const date = new Date('2025-05-15');
    expect(getQuarter(date)).toBe(2);
  });

  it('should return Q2 for June (month 5)', () => {
    const date = new Date('2025-06-15');
    expect(getQuarter(date)).toBe(2);
  });

  it('should return Q3 for July (month 6)', () => {
    const date = new Date('2025-07-15');
    expect(getQuarter(date)).toBe(3);
  });

  it('should return Q3 for August (month 7)', () => {
    const date = new Date('2025-08-15');
    expect(getQuarter(date)).toBe(3);
  });

  it('should return Q3 for September (month 8)', () => {
    const date = new Date('2025-09-15');
    expect(getQuarter(date)).toBe(3);
  });

  it('should return Q4 for October (month 9)', () => {
    const date = new Date('2025-10-15');
    expect(getQuarter(date)).toBe(4);
  });

  it('should return Q4 for November (month 10)', () => {
    const date = new Date('2025-11-15');
    expect(getQuarter(date)).toBe(4);
  });

  it('should return Q4 for December (month 11)', () => {
    const date = new Date('2025-12-15');
    expect(getQuarter(date)).toBe(4);
  });
});

describe('generateOpportunityName', () => {
  describe('with all fields present', () => {
    it('should generate correct format with customer, principal, and Q1 date', () => {
      const result = generateOpportunityName({
        customerName: 'Nobu Miami',
        principalName: 'Ocean Hugger',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Nobu Miami - Ocean Hugger - Q1 2025');
    });

    it('should generate correct format with Q2 date', () => {
      const result = generateOpportunityName({
        customerName: 'Roka Akor',
        principalName: 'Fishpeople',
        date: new Date('2025-04-20'),
      });
      expect(result).toBe('Roka Akor - Fishpeople - Q2 2025');
    });

    it('should generate correct format with Q3 date', () => {
      const result = generateOpportunityName({
        customerName: 'Blue Ribbon',
        principalName: 'Tuna Roll Co',
        date: new Date('2025-07-10'),
      });
      expect(result).toBe('Blue Ribbon - Tuna Roll Co - Q3 2025');
    });

    it('should generate correct format with Q4 date', () => {
      const result = generateOpportunityName({
        customerName: 'Katsuya',
        principalName: 'Ocean Hugger',
        date: new Date('2025-10-30'),
      });
      expect(result).toBe('Katsuya - Ocean Hugger - Q4 2025');
    });

    it('should trim whitespace from customer and principal names', () => {
      const result = generateOpportunityName({
        customerName: '  Nobu Miami  ',
        principalName: '  Ocean Hugger  ',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Nobu Miami - Ocean Hugger - Q1 2025');
    });
  });

  describe('with missing customer', () => {
    it('should generate name with only principal and date', () => {
      const result = generateOpportunityName({
        principalName: 'Ocean Hugger',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Ocean Hugger - Q1 2025');
    });

    it('should handle null customer', () => {
      const result = generateOpportunityName({
        customerName: null,
        principalName: 'Ocean Hugger',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Ocean Hugger - Q1 2025');
    });

    it('should handle empty string customer', () => {
      const result = generateOpportunityName({
        customerName: '',
        principalName: 'Ocean Hugger',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Ocean Hugger - Q1 2025');
    });
  });

  describe('with missing principal', () => {
    it('should generate name with only customer and date', () => {
      const result = generateOpportunityName({
        customerName: 'Nobu Miami',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Nobu Miami - Q1 2025');
    });

    it('should handle null principal', () => {
      const result = generateOpportunityName({
        customerName: 'Nobu Miami',
        principalName: null,
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Nobu Miami - Q1 2025');
    });

    it('should handle empty string principal', () => {
      const result = generateOpportunityName({
        customerName: 'Nobu Miami',
        principalName: '',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Nobu Miami - Q1 2025');
    });
  });

  describe('with both customer and principal missing', () => {
    it('should return empty string when both are undefined', () => {
      const result = generateOpportunityName({
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('');
    });

    it('should return empty string when both are null', () => {
      const result = generateOpportunityName({
        customerName: null,
        principalName: null,
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('');
    });

    it('should return empty string when both are empty strings', () => {
      const result = generateOpportunityName({
        customerName: '',
        principalName: '',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('');
    });

    it('should return empty string when customer is whitespace and principal is null', () => {
      const result = generateOpportunityName({
        customerName: '   ',
        principalName: null,
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('');
    });
  });

  describe('date handling', () => {
    it('should use current date when date is not provided', () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const year = now.getFullYear();

      const result = generateOpportunityName({
        customerName: 'Nobu Miami',
        principalName: 'Ocean Hugger',
      });

      expect(result).toBe(`Nobu Miami - Ocean Hugger - Q${quarter} ${year}`);
    });

    it('should handle different years correctly', () => {
      const result2024 = generateOpportunityName({
        customerName: 'Customer A',
        principalName: 'Principal A',
        date: new Date('2024-06-15'),
      });
      expect(result2024).toBe('Customer A - Principal A - Q2 2024');

      const result2026 = generateOpportunityName({
        customerName: 'Customer B',
        principalName: 'Principal B',
        date: new Date('2026-09-20'),
      });
      expect(result2026).toBe('Customer B - Principal B - Q3 2026');
    });
  });

  describe('truncation at 200 characters', () => {
    it('should truncate to 200 characters when name exceeds limit', () => {
      // Create a long customer name (100 chars) and long principal name (100 chars)
      const longCustomer = 'A'.repeat(100);
      const longPrincipal = 'B'.repeat(100);

      const result = generateOpportunityName({
        customerName: longCustomer,
        principalName: longPrincipal,
        date: new Date('2025-01-15'),
      });

      // Total would be: 100 (customer) + 3 (separator) + 100 (principal) + 3 (separator) + 7 (Q1 2025) = 213 chars
      expect(result.length).toBe(200);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate when name is exactly 200 characters', () => {
      // Calculate exact length: need customer + principal to equal 190 chars
      // Format: "{customer} - {principal} - Q1 2025" = customer + 3 + principal + 3 + 7 = 200
      // So: customer + principal = 187
      const customer = 'A'.repeat(90);
      const principal = 'B'.repeat(97);

      const result = generateOpportunityName({
        customerName: customer,
        principalName: principal,
        date: new Date('2025-01-15'),
      });

      expect(result.length).toBe(200);
      expect(result.endsWith('...')).toBe(false);
    });

    it('should not truncate when name is less than 200 characters', () => {
      const result = generateOpportunityName({
        customerName: 'Short Customer',
        principalName: 'Short Principal',
        date: new Date('2025-01-15'),
      });

      expect(result.length).toBeLessThan(200);
      expect(result).toBe('Short Customer - Short Principal - Q1 2025');
    });

    it('should preserve meaningful content when truncating', () => {
      const longCustomer = 'Very Long Customer Name '.repeat(10); // ~240 chars
      const longPrincipal = 'Very Long Principal Name '.repeat(10); // ~250 chars

      const result = generateOpportunityName({
        customerName: longCustomer,
        principalName: longPrincipal,
        date: new Date('2025-01-15'),
      });

      expect(result.length).toBe(200);
      expect(result.substring(0, 197)).toContain('Very Long Customer Name');
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in names', () => {
      const result = generateOpportunityName({
        customerName: "O'Malley's Irish Pub & Grill",
        principalName: 'Fish & Co.',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe("O'Malley's Irish Pub & Grill - Fish & Co. - Q1 2025");
    });

    it('should handle unicode characters in names', () => {
      const result = generateOpportunityName({
        customerName: 'Café René',
        principalName: 'Señor Fish',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Café René - Señor Fish - Q1 2025');
    });

    it('should handle names with hyphens', () => {
      const result = generateOpportunityName({
        customerName: 'Blue-Ribbon Sushi',
        principalName: 'Ocean-Hugger Foods',
        date: new Date('2025-01-15'),
      });
      expect(result).toBe('Blue-Ribbon Sushi - Ocean-Hugger Foods - Q1 2025');
    });

    it('should handle year boundaries correctly', () => {
      // Use explicit dates to avoid timezone issues
      const endOfYearDate = new Date(2024, 11, 31); // December 31, 2024 (month is 0-indexed)
      const resultEndOfYear = generateOpportunityName({
        customerName: 'Customer',
        principalName: 'Principal',
        date: endOfYearDate,
      });
      expect(resultEndOfYear).toBe('Customer - Principal - Q4 2024');

      const startOfYearDate = new Date(2025, 0, 1); // January 1, 2025 (month is 0-indexed)
      const resultStartOfYear = generateOpportunityName({
        customerName: 'Customer',
        principalName: 'Principal',
        date: startOfYearDate,
      });
      expect(resultStartOfYear).toBe('Customer - Principal - Q1 2025');
    });
  });
});
