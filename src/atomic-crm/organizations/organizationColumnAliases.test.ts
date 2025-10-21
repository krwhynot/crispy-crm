/**
 * Unit tests for organization column alias mapping
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeHeader,
  findCanonicalField,
  getUnmappedHeaders,
  mapHeadersToFields,
  getHeaderMappingDescription,
  validateRequiredMappings,
  getAvailableFields,
  getAvailableFieldsWithLabels,
} from './organizationColumnAliases';

describe('normalizeHeader', () => {
  it('should convert to lowercase', () => {
    expect(normalizeHeader('ORGANIZATIONS')).toBe('organizations');
    expect(normalizeHeader('Company Name')).toBe('company name');
  });

  it('should trim whitespace', () => {
    expect(normalizeHeader('  Company  ')).toBe('company');
    expect(normalizeHeader('\tOrganization\n')).toBe('organization');
  });

  it('should remove special characters except spaces, underscores, hyphens, parentheses', () => {
    expect(normalizeHeader('Company@Name!')).toBe('company name');
    expect(normalizeHeader('Priority (A-D)')).toBe('priority (a-d)'); // Parentheses are preserved
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeHeader('Company    Name')).toBe('company name');
  });

  it('should handle empty strings', () => {
    expect(normalizeHeader('')).toBe('');
  });

  it('should handle null/undefined gracefully', () => {
    expect(normalizeHeader(null as any)).toBe('');
    expect(normalizeHeader(undefined as any)).toBe('');
  });
});

describe('findCanonicalField', () => {
  it('should find canonical field for exact match', () => {
    expect(findCanonicalField('name')).toBe('name');
    expect(findCanonicalField('priority')).toBe('priority');
    expect(findCanonicalField('phone')).toBe('phone');
  });

  it('should find canonical field for case-insensitive match', () => {
    expect(findCanonicalField('ORGANIZATIONS')).toBe('name');
    expect(findCanonicalField('Company Name')).toBe('name');
  });

  it('should find canonical field for variations', () => {
    expect(findCanonicalField('organization')).toBe('name');
    expect(findCanonicalField('company')).toBe('name');
    expect(findCanonicalField('business')).toBe('name');
  });

  it('should handle special CSV headers', () => {
    expect(findCanonicalField('PRIORITY-FOCUS (A-D)')).toBe('priority');
    expect(findCanonicalField('PRIORITY-FOCUS (A-D) A-HIGHEST')).toBe('priority');
  });

  it('should return null for unrecognized headers', () => {
    expect(findCanonicalField('unknown_header')).toBe(null);
    expect(findCanonicalField('random_field')).toBe(null);
  });

  it('should handle empty strings', () => {
    expect(findCanonicalField('')).toBe(null);
  });

  it('should handle null/undefined gracefully', () => {
    expect(findCanonicalField(null as any)).toBe(null);
    expect(findCanonicalField(undefined as any)).toBe(null);
  });
});

describe('getUnmappedHeaders', () => {
  it('should identify headers that do not map to any field', () => {
    const headers = ['Organizations', 'Unknown Field', 'PHONE', 'Random Header'];
    const unmapped = getUnmappedHeaders(headers);

    expect(unmapped).toContain('Unknown Field');
    expect(unmapped).toContain('Random Header');
    expect(unmapped).not.toContain('Organizations');
    expect(unmapped).not.toContain('PHONE');
  });

  it('should return empty array when all headers are mapped', () => {
    const headers = ['Organizations', 'PHONE', 'CITY', 'STATE'];
    const unmapped = getUnmappedHeaders(headers);

    expect(unmapped).toEqual([]);
  });

  it('should skip empty headers', () => {
    const headers = ['Organizations', '', '  ', 'PHONE'];
    const unmapped = getUnmappedHeaders(headers);

    expect(unmapped).not.toContain('');
    expect(unmapped).not.toContain('  ');
  });

  it('should handle non-array input gracefully', () => {
    expect(getUnmappedHeaders(null as any)).toEqual([]);
    expect(getUnmappedHeaders(undefined as any)).toEqual([]);
  });
});

describe('mapHeadersToFields', () => {
  it('should map recognized headers to canonical field names', () => {
    const headers = ['Organizations', 'PHONE', 'CITY'];
    const mappings = mapHeadersToFields(headers);

    expect(mappings['Organizations']).toBe('name');
    expect(mappings['PHONE']).toBe('phone');
    expect(mappings['CITY']).toBe('city');
  });

  it('should map unrecognized headers to null', () => {
    const headers = ['Organizations', 'Unknown Field'];
    const mappings = mapHeadersToFields(headers);

    expect(mappings['Organizations']).toBe('name');
    expect(mappings['Unknown Field']).toBe(null);
  });

  it('should handle empty array', () => {
    expect(mapHeadersToFields([])).toEqual({});
  });

  it('should skip empty/null headers', () => {
    const headers = ['Organizations', '', null as any, 'PHONE'];
    const mappings = mapHeadersToFields(headers);

    expect(mappings['Organizations']).toBe('name');
    expect(mappings['PHONE']).toBe('phone');
    expect(mappings['']).toBeUndefined();
  });

  it('should handle non-array input gracefully', () => {
    expect(mapHeadersToFields(null as any)).toEqual({});
    expect(mapHeadersToFields(undefined as any)).toEqual({});
  });
});

describe('getHeaderMappingDescription', () => {
  it('should return canonical field name for recognized headers', () => {
    expect(getHeaderMappingDescription('Organizations')).toBe('name');
    expect(getHeaderMappingDescription('PHONE')).toBe('phone');
  });

  it('should return ignore message for unrecognized headers', () => {
    expect(getHeaderMappingDescription('Unknown Field')).toBe('(ignored - no matching field)');
  });

  it('should return ignore message for empty headers', () => {
    expect(getHeaderMappingDescription('')).toBe('(ignored - empty header)');
  });

  it('should handle null/undefined gracefully', () => {
    expect(getHeaderMappingDescription(null as any)).toBe('(ignored - empty header)');
    expect(getHeaderMappingDescription(undefined as any)).toBe('(ignored - empty header)');
  });
});

describe('validateRequiredMappings', () => {
  it('should return empty array when all required fields are mapped', () => {
    const mappings = {
      'Organizations': 'name',
      'PHONE': 'phone',
    };

    const missing = validateRequiredMappings(mappings);
    expect(missing).toEqual([]);
  });

  it('should return missing required field names', () => {
    const mappings = {
      'PHONE': 'phone',
      'CITY': 'city',
    };

    const missing = validateRequiredMappings(mappings);
    expect(missing).toContain('name');
  });

  it('should handle mappings with null values', () => {
    const mappings = {
      'Organizations': 'name',
      'Unknown': null,
    };

    const missing = validateRequiredMappings(mappings);
    expect(missing).toEqual([]);
  });

  it('should handle empty mappings object', () => {
    const missing = validateRequiredMappings({});
    expect(missing).toContain('name');
  });
});

describe('getAvailableFields', () => {
  it('should return all available field names', () => {
    const fields = getAvailableFields();

    expect(fields).toContain('name');
    expect(fields).toContain('priority');
    expect(fields).toContain('phone');
    expect(fields).toContain('address');
    expect(fields).toContain('city');
    expect(fields).toContain('state');
    expect(fields).toContain('postal_code');
    expect(fields).toContain('linkedin_url');
  });

  it('should return sorted array', () => {
    const fields = getAvailableFields();
    const sorted = [...fields].sort();

    expect(fields).toEqual(sorted);
  });

  it('should return unique field names', () => {
    const fields = getAvailableFields();
    const unique = [...new Set(fields)];

    expect(fields.length).toBe(unique.length);
  });
});

describe('getAvailableFieldsWithLabels', () => {
  it('should return array of {value, label} objects', () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();

    expect(fieldsWithLabels.length).toBeGreaterThan(0);
    expect(fieldsWithLabels[0]).toHaveProperty('value');
    expect(fieldsWithLabels[0]).toHaveProperty('label');
  });

  it('should convert underscores to spaces in labels', () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();

    const postalCodeField = fieldsWithLabels.find(f => f.value === 'postal_code');
    expect(postalCodeField?.label).toBe('Postal Code');
  });

  it('should capitalize labels', () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();

    const nameField = fieldsWithLabels.find(f => f.value === 'name');
    expect(nameField?.label).toBe('Name');
  });

  it('should include all available fields', () => {
    const fieldsWithLabels = getAvailableFieldsWithLabels();
    const availableFields = getAvailableFields();

    const values = fieldsWithLabels.map(f => f.value);
    availableFields.forEach(field => {
      expect(values).toContain(field);
    });
  });
});

describe('Column Alias Integration', () => {
  it('should handle real CSV headers from organizations.csv', () => {
    const headers = [
      'PRIORITY-FOCUS (A-D) A-highest',
      'Organizations',
      'SEGMENT',
      'DISTRIBUTOR',
      'PHONE',
      'STREET ADDRESS',
      'CITY',
      'STATE',
      'Zip Code',
      'NOTES',
      'LINKEDIN',
    ];

    const mappings = mapHeadersToFields(headers);

    expect(mappings['PRIORITY-FOCUS (A-D) A-highest']).toBe('priority');
    expect(mappings['Organizations']).toBe('name');
    expect(mappings['SEGMENT']).toBe('segment_id');
    expect(mappings['PHONE']).toBe('phone');
    expect(mappings['STREET ADDRESS']).toBe('address');
    expect(mappings['CITY']).toBe('city');
    expect(mappings['STATE']).toBe('state');
    expect(mappings['Zip Code']).toBe('postal_code');
    expect(mappings['NOTES']).toBe('description');
    expect(mappings['LINKEDIN']).toBe('linkedin_url');
  });
});
