import { FieldType } from './FieldDiscovery';

/**
 * TestDataGenerator - Context-aware test data generation
 *
 * Design Philosophy:
 * - Generate realistic CRM data that passes validation
 * - Maintain referential integrity across modules
 * - Create searchable patterns for filter testing
 * - Ensure uniqueness to avoid conflicts
 * - Use existing Zod validation schemas as reference
 *
 * This generator produces:
 * - Valid data for all field types
 * - CRM-specific entities (contacts, organizations, opportunities, products)
 * - Edge cases for validation testing
 * - Consistent data for relationship testing
 */

export class TestDataGenerator {
  private timestamp: number;
  private counter: number = 0;

  constructor() {
    this.timestamp = Date.now();
  }

  /**
   * Generate test data for a field based on its type and name
   */
  generateFieldValue(fieldName: string, fieldType: FieldType): any {
    // Use field name context to generate appropriate data
    const lowerName = fieldName.toLowerCase();

    // Handle specific field names with context-aware generation
    if (lowerName.includes('email')) {
      return this.generateEmail();
    }

    if (lowerName.includes('phone') || lowerName.includes('number') && lowerName.includes('contact')) {
      return this.generatePhone();
    }

    if (lowerName.includes('first') && lowerName.includes('name')) {
      return this.generateFirstName();
    }

    if (lowerName.includes('last') && lowerName.includes('name')) {
      return this.generateLastName();
    }

    if (lowerName.includes('company') || lowerName.includes('organization')) {
      return this.generateCompanyName();
    }

    if (lowerName.includes('title') && !lowerName.includes('mr') && !lowerName.includes('mrs')) {
      return this.generateJobTitle();
    }

    if (lowerName.includes('website') || lowerName.includes('url') && !lowerName.includes('linkedin')) {
      return this.generateWebsite();
    }

    if (lowerName.includes('linkedin')) {
      return this.generateLinkedInUrl();
    }

    if (lowerName.includes('address')) {
      return this.generateAddress();
    }

    if (lowerName.includes('city')) {
      return this.generateCity();
    }

    if (lowerName.includes('state')) {
      return this.generateState();
    }

    if (lowerName.includes('zip') || lowerName.includes('postal')) {
      return this.generateZipCode();
    }

    if (lowerName.includes('country')) {
      return 'United States';
    }

    if (lowerName.includes('description')) {
      return this.generateDescription();
    }

    if (lowerName.includes('amount') || lowerName.includes('revenue') || lowerName.includes('price')) {
      return this.generateAmount();
    }

    if (lowerName.includes('probability')) {
      return this.generateProbability();
    }

    if (lowerName.includes('date') && lowerName.includes('expected')) {
      return this.generateFutureDate();
    }

    if (lowerName.includes('date')) {
      return this.generateDate();
    }

    // Fall back to type-based generation
    switch (fieldType) {
      case 'email':
        return this.generateEmail();

      case 'number':
        return this.generateNumber();

      case 'date':
      case 'datetime':
        return this.generateDate();

      case 'checkbox':
        return false;

      case 'select':
      case 'autocomplete':
      case 'reference':
        // Return null - these need to be filled based on available options
        return null;

      case 'textarea':
        return this.generateDescription();

      case 'text':
      default:
        return this.generateText();
    }
  }

  /**
   * Generate contact test data
   */
  generateContact(overrides: Partial<any> = {}): any {
    const firstName = this.generateFirstName();
    const lastName = this.generateLastName();

    return {
      first_name: firstName,
      last_name: lastName,
      email: [
        {
          email: this.generateEmail(firstName, lastName),
          type: 'Work',
        },
      ],
      phone: [
        {
          number: this.generatePhone(),
          type: 'Work',
        },
      ],
      title: this.generateJobTitle(),
      linkedin_url: this.generateLinkedInUrl(`${firstName.toLowerCase()}-${lastName.toLowerCase()}`),
      ...overrides,
    };
  }

  /**
   * Generate organization test data
   */
  generateOrganization(overrides: Partial<any> = {}): any {
    const companyName = this.generateCompanyName();

    return {
      name: companyName,
      website: this.generateWebsite(companyName),
      linkedin_url: this.generateLinkedInUrl(companyName, true),
      phone_number: this.generatePhone(),
      address: this.generateAddress(),
      city: this.generateCity(),
      stateAbbr: this.generateState(),
      zipcode: this.generateZipCode(),
      country: 'United States',
      sector: this.generateSector(),
      description: this.generateDescription(),
      ...overrides,
    };
  }

  /**
   * Generate opportunity test data
   */
  generateOpportunity(overrides: Partial<any> = {}): any {
    return {
      name: this.generateOpportunityName(),
      description: this.generateDescription(),
      amount: this.generateAmount(),
      probability: this.generateProbability(),
      expected_closing_date: this.generateFutureDate(),
      category: this.generateCategory(),
      priority: 'medium',
      status: 'active',
      stage: 'new_lead',
      ...overrides,
    };
  }

  // ========== Private Generator Methods ==========

  private generateFirstName(): string {
    const names = ['Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Christopher', 'Amanda', 'Matthew', 'Ashley', 'Daniel'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateLastName(): string {
    const names = ['Martinez', 'Chen', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Anderson', 'Taylor'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateEmail(firstName?: string, lastName?: string): string {
    if (!firstName) firstName = this.generateFirstName();
    if (!lastName) lastName = this.generateLastName();

    const domain = this.generateDomain();
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}-${this.timestamp}@${domain}`;
  }

  private generateDomain(): string {
    const domains = ['techcorp.com', 'innovate.io', 'solutions.net', 'enterprise.com', 'global.biz'];
    return domains[Math.floor(Math.random() * domains.length)];
  }

  private generatePhone(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${areaCode}-${exchange}-${number}`;
  }

  private generateJobTitle(): string {
    const titles = [
      'VP of Engineering',
      'Chief Technology Officer',
      'Senior Software Engineer',
      'Product Manager',
      'Director of Operations',
      'Sales Manager',
      'Marketing Director',
      'Business Analyst',
      'Project Manager',
      'Account Executive',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateCompanyName(): string {
    const prefixes = ['Tech', 'Global', 'Advanced', 'Digital', 'Smart', 'Next', 'Cloud', 'Quantum'];
    const suffixes = ['Corp', 'Industries', 'Solutions', 'Systems', 'Technologies', 'Enterprises', 'Group', 'Inc'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix}${suffix} Test ${this.timestamp}`;
  }

  private generateWebsite(companyName?: string): string {
    if (companyName) {
      const domain = companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      return `https://${domain}-${this.timestamp}.com`;
    }
    return `https://company-test-${this.timestamp}.com`;
  }

  private generateLinkedInUrl(identifier: string, isCompany: boolean = false): string {
    const baseUrl = isCompany ? 'https://linkedin.com/company/' : 'https://linkedin.com/in/';
    const cleanId = identifier.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `${baseUrl}${cleanId}-test-${this.timestamp}`;
  }

  private generateAddress(): string {
    const numbers = Math.floor(Math.random() * 9000) + 1000;
    const streets = ['Innovation Drive', 'Technology Parkway', 'Business Boulevard', 'Commerce Street', 'Enterprise Way'];
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `${numbers} ${street}`;
  }

  private generateCity(): string {
    const cities = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Chicago', 'Los Angeles', 'Denver'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  private generateState(): string {
    const states = ['CA', 'NY', 'TX', 'WA', 'MA', 'IL', 'CO'];
    return states[Math.floor(Math.random() * states.length)];
  }

  private generateZipCode(): string {
    return String(Math.floor(Math.random() * 90000) + 10000);
  }

  private generateSector(): string {
    const sectors = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Consulting'];
    return sectors[Math.floor(Math.random() * sectors.length)];
  }

  private generateDescription(): string {
    const descriptions = [
      'Leading provider of enterprise software solutions with focus on innovation and customer success.',
      'Comprehensive platform for business transformation and digital excellence.',
      'Industry-leading services and products trusted by Fortune 500 companies.',
      'Innovative solutions driving business growth and operational efficiency.',
      'Full-service provider specializing in cutting-edge technology and strategic consulting.',
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateAmount(): number {
    // Generate amounts between 10,000 and 500,000
    return Math.floor(Math.random() * 490000) + 10000;
  }

  private generateProbability(): number {
    // Generate probability between 20 and 90
    const probabilities = [20, 30, 40, 50, 60, 70, 80, 90];
    return probabilities[Math.floor(Math.random() * probabilities.length)];
  }

  private generateDate(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  private generateFutureDate(daysAhead: number = 90): string {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 30);
    return date.toISOString().split('T')[0];
  }

  private generateOpportunityName(): string {
    const types = ['Enterprise', 'Strategic', 'Premium', 'Executive', 'Corporate'];
    const products = ['Software', 'Platform', 'Solution', 'Service', 'System'];
    const stages = ['Deal', 'Partnership', 'Engagement', 'Initiative', 'Project'];

    const type = types[Math.floor(Math.random() * types.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const stage = stages[Math.floor(Math.random() * stages.length)];

    return `${type} ${product} ${stage}`;
  }

  private generateCategory(): string {
    const categories = ['Software', 'Hardware', 'Services', 'Consulting', 'Support'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private generateNumber(min: number = 1, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateText(): string {
    return `Test ${this.counter++} ${this.timestamp}`;
  }

  /**
   * Generate unique identifier for testing
   */
  generateUniqueId(): string {
    return `test-${this.timestamp}-${this.counter++}`;
  }

  /**
   * Get the current timestamp (useful for correlating test data)
   */
  getTimestamp(): number {
    return this.timestamp;
  }
}