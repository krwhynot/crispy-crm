import { Page, Locator } from '@playwright/test';

/**
 * FieldDiscovery - Intelligent form field discovery engine
 *
 * Design Philosophy:
 * - Multiple discovery strategies (semantic selectors, ARIA, data-testid, name attributes)
 * - React Admin pattern recognition (ReferenceInput, AutocompleteInput, ArrayInput)
 * - Automatic type detection based on HTML attributes and context
 * - Cache discovered selectors for performance
 *
 * This engine handles:
 * - Standard HTML inputs (text, email, number, date, checkbox, radio)
 * - React Admin specific components (AutocompleteInput, ReferenceInput, ReferenceArrayInput)
 * - Complex nested structures (ArrayInput, ObjectInput)
 * - JSONB array fields (emails, phones in Atomic CRM)
 */

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'autocomplete'
  | 'reference'
  | 'referenceArray'
  | 'array'
  | 'file'
  | 'unknown';

export interface DiscoveredField {
  name: string;
  type: FieldType;
  selector: string;
  label?: string;
  required: boolean;
  placeholder?: string;
  element: Locator;
}

export class FieldDiscovery {
  private page: Page;
  private cache: Map<string, Map<string, DiscoveredField>> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Discover all form fields on the current page
   *
   * Strategy:
   * 1. Find all input, select, textarea elements
   * 2. Check for React Admin specific patterns
   * 3. Determine field type from element attributes
   * 4. Extract label, placeholder, and validation rules
   * 5. Cache results for reuse
   */
  async discoverFormFields(): Promise<Map<string, DiscoveredField>> {
    const currentUrl = this.page.url();

    // Check cache first
    if (this.cache.has(currentUrl)) {
      return this.cache.get(currentUrl)!;
    }

    const fields = new Map<string, DiscoveredField>();

    // Discover standard HTML inputs
    await this.discoverStandardInputs(fields);

    // Discover React Admin AutocompleteInput components
    await this.discoverAutocompleteInputs(fields);

    // Discover React Admin ReferenceInput components
    await this.discoverReferenceInputs(fields);

    // Discover array/list inputs (like email, phone arrays in Atomic CRM)
    await this.discoverArrayInputs(fields);

    // Cache the results
    this.cache.set(currentUrl, fields);

    return fields;
  }

  /**
   * Discover standard HTML inputs (text, email, number, date, checkbox, etc.)
   */
  private async discoverStandardInputs(fields: Map<string, DiscoveredField>): Promise<void> {
    // Find all input elements
    const inputs = await this.page.locator('input, select, textarea').all();

    for (const input of inputs) {
      try {
        const name = await input.getAttribute('name');
        if (!name) continue;

        // Skip if already discovered
        if (fields.has(name)) continue;

        const type = await this.determineFieldType(input);
        const label = await this.findLabel(input);
        const placeholder = await input.getAttribute('placeholder');
        const required = (await input.getAttribute('required')) !== null ||
                        (await input.getAttribute('aria-required')) === 'true';

        fields.set(name, {
          name,
          type,
          selector: `[name="${name}"]`,
          label: label || undefined,
          required,
          placeholder: placeholder || undefined,
          element: input,
        });
      } catch (error) {
        // Skip fields that can't be processed
        continue;
      }
    }
  }

  /**
   * Discover React Admin AutocompleteInput components
   *
   * These render as <input> with role="combobox" and have special aria attributes
   */
  private async discoverAutocompleteInputs(fields: Map<string, DiscoveredField>): Promise<void> {
    const autocompletes = await this.page.locator('input[role="combobox"]').all();

    for (const autocomplete of autocompletes) {
      try {
        const name = await autocomplete.getAttribute('name');
        if (!name || fields.has(name)) continue;

        const label = await this.findLabel(autocomplete);
        const required = (await autocomplete.getAttribute('aria-required')) === 'true';

        fields.set(name, {
          name,
          type: 'autocomplete',
          selector: `input[name="${name}"][role="combobox"]`,
          label: label || undefined,
          required,
          element: autocomplete,
        });
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Discover React Admin ReferenceInput components
   *
   * These typically render as AutocompleteInput but have specific data attributes
   */
  private async discoverReferenceInputs(fields: Map<string, DiscoveredField>): Promise<void> {
    // ReferenceInput components often have data-source attribute
    const references = await this.page.locator('[data-source]').all();

    for (const reference of references) {
      try {
        const source = await reference.getAttribute('data-source');
        if (!source || fields.has(source)) continue;

        // Look for input inside this component
        const input = reference.locator('input').first();
        if (await input.count() === 0) continue;

        const label = await this.findLabel(reference);
        const required = (await input.getAttribute('aria-required')) === 'true';

        // Determine if it's a single reference or array
        const isArray = source.includes('_ids') || source.includes('[]');

        fields.set(source, {
          name: source,
          type: isArray ? 'referenceArray' : 'reference',
          selector: `[data-source="${source}"] input`,
          label: label || undefined,
          required,
          element: input,
        });
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Discover array inputs (like email[], phone[] in Atomic CRM)
   *
   * These are typically multiple inputs with indexed names like "email[0].email"
   */
  private async discoverArrayInputs(fields: Map<string, DiscoveredField>): Promise<void> {
    // Look for inputs with array notation in name
    const arrayInputs = await this.page.locator('input[name*="["]').all();

    const arrayFieldsFound = new Set<string>();

    for (const input of arrayInputs) {
      try {
        const name = await input.getAttribute('name');
        if (!name) continue;

        // Extract base name (e.g., "email" from "email[0].email")
        const baseNameMatch = name.match(/^([^[]+)/);
        if (!baseNameMatch) continue;

        const baseName = baseNameMatch[1];

        // Skip if we already processed this array field
        if (arrayFieldsFound.has(baseName)) continue;
        arrayFieldsFound.add(baseName);

        const label = await this.findLabel(input);
        const type = await this.determineFieldType(input);

        fields.set(baseName, {
          name: baseName,
          type: 'array',
          selector: `input[name^="${baseName}["]`,
          label: label || undefined,
          required: false, // Array fields are typically optional
          element: input,
        });
      } catch (error) {
        continue;
      }
    }
  }

  /**
   * Determine field type from HTML element
   */
  private async determineFieldType(element: Locator): Promise<FieldType> {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'select') return 'select';

    if (tagName === 'input') {
      const type = await element.getAttribute('type');
      const role = await element.getAttribute('role');

      if (role === 'combobox') return 'autocomplete';

      switch (type) {
        case 'email': return 'email';
        case 'number': return 'number';
        case 'date': return 'date';
        case 'datetime-local': return 'datetime';
        case 'checkbox': return 'checkbox';
        case 'radio': return 'radio';
        case 'file': return 'file';
        case 'text':
        case null:
        default:
          return 'text';
      }
    }

    return 'unknown';
  }

  /**
   * Find label for an input element
   *
   * Strategies:
   * 1. <label> element with matching "for" attribute
   * 2. Parent <label> element
   * 3. aria-label attribute
   * 4. aria-labelledby reference
   * 5. Placeholder text as fallback
   */
  private async findLabel(element: Locator): Promise<string | null> {
    try {
      // Strategy 1: Label with "for" attribute
      const id = await element.getAttribute('id');
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        if (await label.count() > 0) {
          const text = await label.textContent();
          if (text) return text.trim();
        }
      }

      // Strategy 2: Parent label
      const parentLabel = element.locator('xpath=ancestor::label[1]');
      if (await parentLabel.count() > 0) {
        const text = await parentLabel.textContent();
        if (text) return text.trim();
      }

      // Strategy 3: aria-label
      const ariaLabel = await element.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel.trim();

      // Strategy 4: aria-labelledby
      const labelledBy = await element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelElement = this.page.locator(`#${labelledBy}`);
        if (await labelElement.count() > 0) {
          const text = await labelElement.textContent();
          if (text) return text.trim();
        }
      }

      // Strategy 5: Placeholder as fallback
      const placeholder = await element.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();

    } catch (error) {
      // Ignore errors and return null
    }

    return null;
  }

  /**
   * Get a specific field by name
   */
  async getField(name: string): Promise<DiscoveredField | null> {
    const fields = await this.discoverFormFields();
    return fields.get(name) || null;
  }

  /**
   * Check if a field exists
   */
  async hasField(name: string): Promise<boolean> {
    const field = await this.getField(name);
    return field !== null;
  }

  /**
   * Clear the cache (useful when navigating to a new form)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all required fields
   */
  async getRequiredFields(): Promise<DiscoveredField[]> {
    const fields = await this.discoverFormFields();
    return Array.from(fields.values()).filter(f => f.required);
  }

  /**
   * Get fields by type
   */
  async getFieldsByType(type: FieldType): Promise<DiscoveredField[]> {
    const fields = await this.discoverFormFields();
    return Array.from(fields.values()).filter(f => f.type === type);
  }

  /**
   * Get field count
   */
  async getFieldCount(): Promise<number> {
    const fields = await this.discoverFormFields();
    return fields.size;
  }

  /**
   * Print discovered fields (for debugging)
   */
  async printDiscoveredFields(): Promise<void> {
    const fields = await this.discoverFormFields();

    console.log(`\n📋 Discovered ${fields.size} form fields:\n`);

    for (const [name, field] of fields.entries()) {
      const requiredMark = field.required ? ' *' : '';
      const label = field.label ? ` (${field.label})` : '';
      console.log(`  - ${name}${requiredMark}: ${field.type}${label}`);
    }

    console.log('');
  }
}