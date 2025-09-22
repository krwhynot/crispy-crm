# Seed Data & Reference Tables

## Overview
This document details the reference data, lookup tables, and seed data patterns used in the Atomic CRM database. The system uses a combination of hardcoded enums in the application layer and flexible database storage.

## Database Reference Data

### `tags` Table - Content Categories
The tags table serves as a flexible categorization system for contacts.

#### Default Tag Data
| ID | Name | Color | Business Meaning | Usage Context |
|----|------|-------|------------------|---------------|
| 0 | `football-fan` | `warm` | Sports interest identifier | Personal relationship building |
| 1 | `holiday-card` | `yellow` | Holiday communication list | Seasonal outreach campaigns |
| 2 | `influencer` | `pink` | Social media influence | Marketing partnership prospects |
| 3 | `manager` | `purple` | Management-level contact | Decision maker identification |
| 4 | `musician` | `blue` | Arts/entertainment interest | Cultural engagement opportunities |
| 5 | `vip` | `green` | High-value customer | Priority service designation |

#### Tag Color System (Post-Migration)
**Semantic Colors**: `warm`, `green`, `teal`, `blue`, `purple`, `yellow`, `gray`, `pink`

**Color Meanings**:
- `warm`: Personal/relationship tags
- `green`: High value/priority
- `blue`: Professional/business
- `purple`: Leadership/authority
- `pink`: Social/community
- `yellow`: Events/seasonal
- `teal`: Technical/specialty
- `gray`: General/neutral

#### Tag Management
- **Mutability**: Tags can be created, edited, and deleted by authenticated users
- **Reference Method**: Array storage in `contacts.tags[]`
- **Constraints**: Color values enforced by database constraint
- **Usage Pattern**: Many-to-many relationship via PostgreSQL arrays

---

## Application-Level Reference Data

### Company Sectors
**Location**: `src/atomic-crm/root/defaultConfiguration.ts`
**Type**: Static array configuration
**Mutability**: Fixed (requires code deployment to change)

```typescript
const defaultCompanySectors = [
  "Communication Services",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Financials",
  "Health Care",
  "Industrials",
  "Information Technology",
  "Materials",
  "Real Estate",
  "Utilities"
];
```

#### Business Context
- Based on GICS (Global Industry Classification Standard)
- Used for company categorization and reporting
- Enables sector-based filtering and analysis
- Supports industry-specific sales strategies

#### Usage in Database
- Stored as text in `companies.sector` column
- No foreign key constraint (flexibility vs. consistency trade-off)
- Allows custom sectors beyond the default list

---

### Deal Stages - Sales Pipeline
**Type**: Application configuration
**Purpose**: Sales process workflow management

| Stage Value | Label | Business Phase | Typical Duration |
|-------------|-------|----------------|------------------|
| `opportunity` | Opportunity | Initial interest qualification | 1-2 weeks |
| `proposal-sent` | Proposal Sent | Formal proposal submitted | 1-3 weeks |
| `in-negociation` | In Negotiation | Terms and pricing discussion | 2-4 weeks |
| `won` | Won | Deal closed successfully | Final stage |
| `lost` | Lost | Deal did not close | Final stage |
| `delayed` | Delayed | Temporarily on hold | Indefinite |

#### Pipeline Configuration
- **Pipeline Statuses**: `["won"]` (deals counting toward success metrics)
- **Stage Progression**: Typically linear but allows backward movement
- **Reporting**: Won/Lost stages excluded from active pipeline

---

### Deal Categories - Service Types
**Purpose**: Service offering classification

| Category | Business Meaning | Typical Use Case |
|----------|------------------|------------------|
| `Other` | Miscellaneous services | Catch-all category |
| `Copywriting` | Content creation services | Marketing materials |
| `Print project` | Physical printing services | Brochures, business cards |
| `UI Design` | User interface design | App and web interfaces |
| `Website design` | Web development | Corporate websites |

#### Usage Pattern
- Stored in `deals.category` as free text
- Supports custom categories beyond defaults
- Used for service offering analysis and resource planning

---

### Contact Note Statuses - Lead Temperature
**Purpose**: Lead qualification and priority management

| Status Value | Label | Color Variable | Business Meaning |
|-------------|--------|----------------|------------------|
| `cold` | Cold | `var(--info-default)` | Low engagement/priority |
| `warm` | Warm | `var(--warning-default)` | Moderate interest |
| `hot` | Hot | `var(--error-default)` | High priority/urgency |
| `in-contract` | In Contract | `var(--success-default)` | Active business relationship |

#### Color System Integration
- Colors reference CSS custom properties
- Consistent with overall design system
- Visual priority indicators in UI
- Used for contact note classification

---

### Task Types - Activity Classification
**Purpose**: Activity tracking and workflow organization

| Type | Business Purpose | Typical Frequency |
|------|------------------|-------------------|
| `None` | Unclassified task | Default value |
| `Email` | Email communication | Daily |
| `Demo` | Product demonstration | Weekly |
| `Lunch` | Relationship building | Monthly |
| `Meeting` | Formal business meeting | Weekly |
| `Follow-up` | Post-meeting actions | Daily |
| `Thank you` | Appreciation communication | As needed |
| `Ship` | Delivery/fulfillment | As needed |
| `Call` | Phone communication | Daily |

#### Task Management
- Stored in `tasks.type` as text
- Supports custom types beyond defaults
- Used for activity reporting and time tracking

---

### Contact Gender Options
**Purpose**: Respectful personal identification
**Integration**: Lucide React icons for UI

| Value | Label | Icon Component | Usage |
|-------|-------|----------------|-------|
| `male` | He/Him | `Mars` | Traditional male identification |
| `female` | She/Her | `Venus` | Traditional female identification |
| `nonbinary` | They/Them | `NonBinary` | Non-binary identification |

#### Implementation Notes
- Modern inclusive approach to gender identity
- Icon integration for visual consistency
- Stored as text in `contacts.gender`
- Optional field (nullable)

---

## Company Size Classification
**Purpose**: Organization scale categorization
**Type**: Numeric enum with business meaning

| Size Value | Employee Range | Business Category |
|------------|----------------|-------------------|
| `1` | 1-9 employees | Micro business |
| `10` | 10-49 employees | Small business |
| `50` | 50-249 employees | Medium business |
| `250` | 250-499 employees | Large business |
| `500` | 500+ employees | Enterprise |

#### Usage Context
- Sales approach customization
- Resource allocation planning
- Market segmentation analysis
- Pricing strategy determination

---

## Seed Data Generation (Development/Demo)

### Data Generation Strategy
**File**: `src/atomic-crm/providers/fakerest/dataGenerator/`
**Purpose**: Realistic development and demo data

#### Generation Parameters
- **Companies**: 55 default entries
- **Sales Representatives**: Auto-generated team
- **Contacts**: Distributed across companies
- **Deals**: Various stages and amounts
- **Notes**: Realistic interaction history
- **Tasks**: Due dates and types

#### Faker.js Integration
```typescript
// Example company generation
const generateCompanies = (db: Db, size = 55) => {
  return Array.from(Array(size).keys()).map((id) => ({
    id,
    name: company.companyName(),
    sector: random.arrayElement(defaultCompanySectors),
    size: random.arrayElement([1, 10, 50, 250, 500]),
    // ... other generated fields
  }));
};
```

### Demo Data Relationships
- **Sales Assignment**: 1/3 companies assigned to first sales rep
- **Geographic Distribution**: USA, France, UK focus
- **Revenue Ranges**: $1M, $10M, $100M, $1B categories
- **Tag Distribution**: Even spread across tag types

---

## Data Integrity Patterns

### Reference Data Validation

#### Database Level
```sql
-- Tag color constraint (enforced)
ALTER TABLE tags ADD CONSTRAINT valid_tag_colors
CHECK (color IN ('warm','green','teal','blue','purple','yellow','gray','pink'));
```

#### Application Level
- TypeScript enums for compile-time validation
- React Admin form validation
- Data provider input sanitization

### Foreign Key Strategy
- **Hard References**: `sales_id`, `company_id`, `contact_id` with FK constraints
- **Soft References**: Tag arrays, deal contact arrays (flexibility over consistency)
- **Lookup Values**: Text fields with application-level validation

---

## Migration and Seeding Strategy

### Production Data Seeding
1. **Essential Tags**: Core business tags for immediate use
2. **Admin User**: First user becomes administrator
3. **Default Sectors**: Industry standard classifications
4. **Empty State**: No sample companies/contacts in production

### Development Environment
1. **Full Data Set**: Comprehensive fake data for testing
2. **Realistic Relationships**: Proper foreign key distribution
3. **Edge Cases**: Null values, empty arrays, boundary conditions
4. **Performance Testing**: Large enough dataset for optimization

### Staging Environment
1. **Sanitized Production Data**: Real structure, fake content
2. **Test Scenarios**: Specific data for feature testing
3. **Integration Testing**: External system compatibility
4. **User Acceptance**: Representative sample data

---

## Reference Data Maintenance

### Adding New Reference Values

#### Database-Stored (Tags)
```sql
-- Add new tag
INSERT INTO tags (name, color) VALUES ('new-category', 'blue');
```

#### Application-Stored (Sectors, Stages)
```typescript
// Update configuration file
export const defaultCompanySectors = [
  ...existing,
  "New Industry Sector"
];
```

### Data Migration for Reference Changes
1. **Backward Compatibility**: Maintain old values during transition
2. **Migration Scripts**: Convert existing data to new structure
3. **Validation**: Ensure all references remain valid
4. **Rollback Plan**: Ability to revert if issues arise

## Best Practices for Reference Data

### When to Use Database Storage
- Values change frequently
- User-customizable categories
- Need audit trail of changes
- Complex relationships with other data

### When to Use Application Configuration
- Stable business rules
- System-wide constants
- Performance-critical lookups
- Version-controlled with code

### Hybrid Approach Benefits
- Flexibility where needed
- Performance optimization
- Type safety in application
- Database integrity where critical