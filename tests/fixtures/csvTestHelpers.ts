/**
 * Shared test utilities for CSV import testing
 * Single source of truth for column mapping and data transformation logic
 */

import type { ContactImportSchema } from '../../src/atomic-crm/contacts/useContactImport';

// Column mapping aliases for CSV headers
export const COLUMN_ALIASES: Record<string, string> = {
  'Organizations': 'organization_name',
  'Organizations (DropDown)': 'organization_name',
  'Company': 'organization_name',
  'Organization': 'organization_name',
  'FULL NAME (FIRST, LAST)': '_full_name_source_',
  'Full Name': '_full_name_source_',
  'Name': '_full_name_source_',
  'EMAIL': 'email_work',
  'Email': 'email_work',
  'Work Email': 'email_work',
  'PHONE': 'phone_work',
  'Phone': 'phone_work',
  'Work Phone': 'phone_work',
  'POSITION': 'title',
  'POSITION (DropDown)': 'title',
  'Position': 'title',
  'Title': 'title',
  'LINKEDIN': 'linkedin_url',
  'LinkedIn': 'linkedin_url',
  'NOTES': 'notes',
  'Notes': 'notes',
};

export function mapHeadersToFields(headers: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  headers.forEach(header => {
    if (!header) return;
    const normalized = String(header).trim();
    mapped[header] = COLUMN_ALIASES[normalized] || normalized.toLowerCase().replace(/\s+/g, '_');
  });
  return mapped;
}

export function transformHeaders(headers: string[]): string[] {
  const mappings = mapHeadersToFields(headers);
  return headers.map(header => {
    if (!header) return header;
    return mappings[header] || header;
  });
}

export function transformData(rawData: any[][]): ContactImportSchema[] {
  if (rawData.length < 4) {
    throw new Error('CSV file too short');
  }

  const headers = rawData[2];
  const transformedHeaders = transformHeaders(headers);
  const dataRows = rawData.slice(3);

  return dataRows.map(row => {
    const obj: any = {};
    transformedHeaders.forEach((header, index) => {
      // Handle full name splitting
      if (header === '_full_name_source_') {
        const fullName = row[index] || '';
        const nameParts = fullName.trim().split(/\s+/);

        if (nameParts.length === 0 || fullName.trim() === '') {
          obj.first_name = '';
          obj.last_name = '';
        } else if (nameParts.length === 1) {
          // When a single name is provided (e.g., "Smith" or "Mike"),
          // we assign it to last_name by default. This prioritizes the
          // standard convention of using a last name as the primary identifier
          // in contact lists and is the most predictable behavior for formal names.
          obj.first_name = '';
          obj.last_name = nameParts[0];
        } else {
          obj.first_name = nameParts[0];
          obj.last_name = nameParts.slice(1).join(' ');
        }
      } else {
        obj[header] = row[index];
      }
    });
    return obj as ContactImportSchema;
  });
}
