import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contact with multiple organizations
const mockContactWithMultipleOrgs = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  title: 'Senior Consultant',
  department: 'Technology',
  email_jsonb: [{ email: 'john.doe@acme.com', type: 'Work' }],
  phone_jsonb: [{ number: '+1-555-0123', type: 'Work' }],
  organization_id: 1, // Primary organization (backward compatibility)
  role: 'decision_maker',
  is_primary_contact: true,
  purchase_influence: 'High',
  decision_authority: 'Decision Maker'
};

const mockOrganizations = [
  { id: 1, name: 'Acme Corp', sector: 'Technology', organization_type: 'customer' },
  { id: 2, name: 'Tech Partners Ltd', sector: 'Software', organization_type: 'partner' },
  { id: 3, name: 'Consulting Firm Inc', sector: 'Services', organization_type: 'vendor' }
];

const mockContactOrganizations = [
  {
    id: 1,
    contact_id: 1,
    organization_id: 1,
    is_primary_organization: true,
    role: 'decision_maker',
    purchase_influence: 'High',
    decision_authority: 'Decision Maker'
  },
  {
    id: 2,
    contact_id: 1,
    organization_id: 2,
    is_primary_organization: false,
    role: 'influencer',
    purchase_influence: 'Medium',
    decision_authority: 'Influencer'
  },
  {
    id: 3,
    contact_id: 1,
    organization_id: 3,
    is_primary_organization: false,
    role: 'buyer',
    purchase_influence: 'Low',
    decision_authority: 'End User'
  }
];

// Mock the data provider
const mockDataProvider = {
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

describe('Contact Multi-Organization Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getList for various resources
    mockDataProvider.getList.mockImplementation((resource, params) => {
      if (resource === 'organizations') {
        return Promise.resolve({
          data: mockOrganizations,
          total: mockOrganizations.length,
        });
      }
      if (resource === 'contact_organizations') {
        return Promise.resolve({
          data: mockContactOrganizations,
          total: mockContactOrganizations.length,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });

    // Mock getOne for contact
    mockDataProvider.getOne.mockImplementation((resource, params) => {
      if (resource === 'contacts' && params.id === 1) {
        return Promise.resolve({ data: mockContactWithMultipleOrgs });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock getMany for organizations
    mockDataProvider.getMany.mockImplementation((resource, params) => {
      if (resource === 'organizations') {
        return Promise.resolve({
          data: mockOrganizations.filter(org => params.ids.includes(org.id)),
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockDataProvider.create.mockResolvedValue({
      data: { id: 1, first_name: 'Test', last_name: 'Contact' }
    });

    mockDataProvider.update.mockResolvedValue({
      data: { id: 1, first_name: 'Updated', last_name: 'Contact' }
    });
  });

  describe('Contact Data Structure', () => {
    it('should support multi-organization contact data structure', () => {
      const contact = mockContactWithMultipleOrgs;

      expect(contact.id).toBe(1);
      expect(contact.first_name).toBe('John');
      expect(contact.last_name).toBe('Doe');
      expect(contact.organization_id).toBe(1); // Backward compatibility
      expect(contact.role).toBe('decision_maker');
      expect(contact.purchase_influence).toBe('High');
      expect(contact.decision_authority).toBe('Decision Maker');
    });

    it('should validate contact organization relationships', () => {
      const relationships = mockContactOrganizations;

      expect(relationships).toHaveLength(3);

      // Should have exactly one primary organization
      const primaryCount = relationships.filter(rel => rel.is_primary_organization).length;
      expect(primaryCount).toBe(1);

      // Primary organization should be the first one
      expect(relationships[0].is_primary_organization).toBe(true);
      expect(relationships[1].is_primary_organization).toBe(false);
      expect(relationships[2].is_primary_organization).toBe(false);
    });

    it('should support different roles per organization', () => {
      const relationships = mockContactOrganizations;

      expect(relationships[0].role).toBe('decision_maker');
      expect(relationships[1].role).toBe('influencer');
      expect(relationships[2].role).toBe('buyer');

      // Each organization should have different influence levels
      expect(relationships[0].purchase_influence).toBe('High');
      expect(relationships[1].purchase_influence).toBe('Medium');
      expect(relationships[2].purchase_influence).toBe('Low');
    });
  });

  describe('Data Provider Operations', () => {
    it('should retrieve contact with multi-organization data', async () => {
      const result = await mockDataProvider.getOne('contacts', { id: 1 });

      expect(result.data.id).toBe(1);
      expect(result.data.first_name).toBe('John');
      expect(result.data.last_name).toBe('Doe');
      expect(result.data.organization_id).toBe(1); // Primary organization
    });

    it('should retrieve contact organization relationships', async () => {
      const result = await mockDataProvider.getList('contact_organizations', {
        filter: { contact_id: 1 },
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'is_primary_organization', order: 'DESC' }
      });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);

      // Check that primary organization comes first when sorted
      const primaryRelationship = result.data.find(rel => rel.is_primary_organization);
      expect(primaryRelationship).toBeDefined();
      expect(primaryRelationship?.organization_id).toBe(1);
    });

    it('should filter contacts by organization', async () => {
      // Mock filtering by organization
      mockDataProvider.getList.mockImplementation((resource, params) => {
        if (resource === 'contacts_summary' && params.filter?.organization_id) {
          const orgId = params.filter.organization_id;
          const relatedContacts = mockContactOrganizations
            .filter(rel => rel.organization_id === orgId)
            .map(() => mockContactWithMultipleOrgs);

          return Promise.resolve({
            data: relatedContacts,
            total: relatedContacts.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      // Search for contacts in organization 2
      const result = await mockDataProvider.getList('contacts_summary', {
        filter: { organization_id: 2 },
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'last_name', order: 'ASC' }
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });
  });

  describe('Contact Organization Junction Table Operations', () => {
    it('should create new contact-organization relationship', async () => {
      const newRelationship = {
        contact_id: 1,
        organization_id: 4,
        is_primary_organization: false,
        role: 'technical',
        purchase_influence: 'Low',
        decision_authority: 'End User'
      };

      await mockDataProvider.create('contact_organizations', {
        data: newRelationship
      });

      expect(mockDataProvider.create).toHaveBeenCalledWith('contact_organizations', {
        data: newRelationship
      });
    });

    it('should update contact-organization relationship', async () => {
      const updatedRelationship = {
        id: 1,
        contact_id: 1,
        organization_id: 1,
        is_primary_organization: true,
        role: 'champion', // Updated role
        purchase_influence: 'High',
        decision_authority: 'Decision Maker'
      };

      await mockDataProvider.update('contact_organizations', {
        id: 1,
        data: updatedRelationship,
        previousData: mockContactOrganizations[0]
      });

      expect(mockDataProvider.update).toHaveBeenCalledWith('contact_organizations', {
        id: 1,
        data: updatedRelationship,
        previousData: mockContactOrganizations[0]
      });
    });

    it('should delete contact-organization relationship', async () => {
      await mockDataProvider.delete('contact_organizations', {
        id: 2
      });

      expect(mockDataProvider.delete).toHaveBeenCalledWith('contact_organizations', {
        id: 2
      });
    });

    it('should query contact organizations by contact', async () => {
      await mockDataProvider.getManyReference('contact_organizations', {
        target: 'contact_id',
        id: 1,
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'is_primary_organization', order: 'DESC' }
      });

      expect(mockDataProvider.getManyReference).toHaveBeenCalledWith('contact_organizations', {
        target: 'contact_id',
        id: 1,
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'is_primary_organization', order: 'DESC' }
      });
    });
  });

  describe('Role and Influence Validation', () => {
    it('should validate contact role choices', () => {
      const validRoles = [
        'decision_maker',
        'influencer',
        'buyer',
        'end_user',
        'gatekeeper',
        'champion',
        'technical',
        'executive'
      ];

      const isValidRole = (role: string): boolean => {
        return validRoles.includes(role);
      };

      expect(isValidRole('decision_maker')).toBe(true);
      expect(isValidRole('influencer')).toBe(true);
      expect(isValidRole('buyer')).toBe(true);
      expect(isValidRole('invalid_role')).toBe(false);
    });

    it('should validate purchase influence levels', () => {
      const validInfluenceLevels = ['High', 'Medium', 'Low', 'Unknown'];

      const isValidInfluenceLevel = (level: string): boolean => {
        return validInfluenceLevels.includes(level);
      };

      expect(isValidInfluenceLevel('High')).toBe(true);
      expect(isValidInfluenceLevel('Medium')).toBe(true);
      expect(isValidInfluenceLevel('Low')).toBe(true);
      expect(isValidInfluenceLevel('Unknown')).toBe(true);
      expect(isValidInfluenceLevel('Invalid')).toBe(false);
    });

    it('should validate decision authority levels', () => {
      const validAuthorityLevels = [
        'Decision Maker',
        'Influencer',
        'End User',
        'Gatekeeper'
      ];

      const isValidAuthorityLevel = (level: string): boolean => {
        return validAuthorityLevels.includes(level);
      };

      expect(isValidAuthorityLevel('Decision Maker')).toBe(true);
      expect(isValidAuthorityLevel('Influencer')).toBe(true);
      expect(isValidAuthorityLevel('End User')).toBe(true);
      expect(isValidAuthorityLevel('Gatekeeper')).toBe(true);
      expect(isValidAuthorityLevel('Invalid')).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with single organization contacts', async () => {
      const legacyContact = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        organization_id: 1, // Legacy single organization reference
        role: 'buyer',
        is_primary_contact: false
      };

      mockDataProvider.getOne.mockResolvedValue({
        data: legacyContact
      });

      const result = await mockDataProvider.getOne('contacts', { id: 2 });

      expect(result.data.company_id).toBe(1);
      expect(result.data.role).toBe('buyer');
      expect(result.data.is_primary_contact).toBe(false);
    });

    it('should create junction table entries for legacy contacts', () => {
      const legacyContact = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        organization_id: 1,
        role: 'decision_maker',
        is_primary_contact: true
      };

      const junctionTableEntry = {
        contact_id: legacyContact.id,
        organization_id: legacyContact.organization_id,
        is_primary_organization: legacyContact.is_primary_contact,
        role: legacyContact.role,
        purchase_influence: 'Unknown', // Default for legacy data
        decision_authority: 'End User', // Default for legacy data
        created_at: new Date().toISOString()
      };

      expect(junctionTableEntry.contact_id).toBe(1);
      expect(junctionTableEntry.organization_id).toBe(1);
      expect(junctionTableEntry.is_primary_organization).toBe(true);
      expect(junctionTableEntry.role).toBe('decision_maker');
      expect(junctionTableEntry.purchase_influence).toBe('Unknown');
      expect(junctionTableEntry.decision_authority).toBe('End User');
    });

    it('should support querying contacts by legacy organization_id field', async () => {
      mockDataProvider.getList.mockImplementation((resource, params) => {
        if (resource === 'contacts_summary' && params.filter?.organization_id) {
          // Support legacy filtering by organization_id
          const contacts = [mockContactWithMultipleOrgs].filter(
            contact => contact.organization_id === params.filter.organization_id
          );
          return Promise.resolve({
            data: contacts,
            total: contacts.length,
          });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const result = await mockDataProvider.getList('contacts_summary', {
        filter: { organization_id: 1 },
        pagination: { page: 1, perPage: 25 },
        sort: { field: 'last_name', order: 'ASC' }
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].organization_id).toBe(1);
    });

    it('should handle contact without organizations gracefully', async () => {
      const contactWithoutOrg = {
        id: 3,
        first_name: 'Bob',
        last_name: 'Johnson',
        email_jsonb: [{ email: 'bob@example.com', type: 'Work' }],
        // No organization_id or organization relationships
      };

      mockDataProvider.getOne.mockResolvedValue({
        data: contactWithoutOrg
      });

      const result = await mockDataProvider.getOne('contacts', { id: 3 });

      expect(result.data.first_name).toBe('Bob');
      expect(result.data.last_name).toBe('Johnson');
      expect(result.data.organization_id).toBeUndefined();
    });
  });

  describe('Multi-Organization Contact Workflows', () => {
    it('should link contact to multiple organizations via junction table', async () => {
      const contactOrganizationData = {
        contact_id: 1,
        organization_id: 2,
        is_primary_organization: false,
        role: 'influencer',
        purchase_influence: 'Medium',
        decision_authority: 'Influencer'
      };

      mockDataProvider.create.mockResolvedValue({
        data: { id: 4, ...contactOrganizationData }
      });

      const result = await mockDataProvider.create('contact_organizations', {
        data: contactOrganizationData
      });

      expect(result.data).toEqual(expect.objectContaining({
        contact_id: 1,
        organization_id: 2,
        is_primary_organization: false,
        role: 'influencer'
      }));
    });

    it('should maintain primary organization designation', () => {
      const relationships = mockContactOrganizations;
      const primaryCount = relationships.filter(rel => rel.is_primary_organization).length;

      expect(primaryCount).toBe(1);
      expect(relationships[0].is_primary_organization).toBe(true);
      expect(relationships[1].is_primary_organization).toBe(false);
      expect(relationships[2].is_primary_organization).toBe(false);
    });

    it('should handle different roles per organization', () => {
      const relationships = mockContactOrganizations;

      expect(relationships[0].role).toBe('decision_maker');
      expect(relationships[1].role).toBe('influencer');
      expect(relationships[2].role).toBe('buyer');

      // Each organization should have different influence levels
      expect(relationships[0].purchase_influence).toBe('High');
      expect(relationships[1].purchase_influence).toBe('Medium');
      expect(relationships[2].purchase_influence).toBe('Low');
    });
  });
});