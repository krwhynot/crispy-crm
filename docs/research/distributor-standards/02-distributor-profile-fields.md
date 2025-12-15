# Distributor Profile Fields - Industry Standards

## Executive Summary

This research analyzes standard CRM organization fields for B2B distributors, focusing on food distribution industry needs. Key findings include: (1) Most B2B CRMs use account-based structures with flexible address handling for multiple locations (HQ, warehouses, billing), (2) Industry-standard integration identifiers (DUNS, EDI, ERP item numbers) are critical for food distributors, and (3) Status/lifecycle management typically uses dual-field patterns (Status + Status Reason) for granular state tracking. Recommendations prioritize flexible multi-address patterns, credit/payment term tracking, and integration readiness for ERP systems.

## Standard CRM Organization Fields

### Core Identity Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Name | Text (required) | Primary organization identifier | "Performance Food Group", "Sysco Corporation" |
| Account Number | Text/Auto-number | Unique internal identifier | "DIST-0001", "ACC-2024-0123" |
| Parent Account | Lookup (self-referential) | Organizational hierarchy tracking | US Foods (parent) → US Foods Denver (child) |
| Owner | Lookup (User) | Sales rep/account manager assignment | "John Smith" (Account Manager) |
| Type | Picklist | Organization classification | "Distributor", "Prospect", "Customer" |
| Industry | Picklist | Business sector | "Food Distribution", "Foodservice Wholesale" |
| Website | URL | Company website | "https://www.sysco.com" |

**Source Pattern:** Salesforce Account object includes AccountNumber, ParentId, OwnerId, Type, and Industry as standard fields for identity management ([Salesforce Developer Documentation](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_account.htm)).

### Contact Information Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Phone | Phone | Primary contact number | "(555) 123-4567" |
| Fax | Phone | Fax number (legacy) | "(555) 123-4568" |
| Email | Email | General company email | "info@distributor.com" |
| Description | Long Text | Notes/overview | "Regional food distributor serving 5-state area" |

### Firmographic Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Number of Employees | Number | Company size indicator | 250, 1000, 5000 |
| Annual Revenue | Currency | Revenue tracking | $50,000,000 |
| DUNS Number | Text (9 digits) | D&B unique identifier | "123456789" |
| Tax ID / EIN | Text | Federal tax identifier | "12-3456789" |
| SIC Code | Text | Industry classification | "5141" (Groceries, General Line) |
| NAICS Code | Text | North American industry code | "424410" (General Line Grocery) |

**Industry Context:** The DUNS number is a unique nine-digit identifier assigned to business entities worldwide, used for business credit reports and vendor verification. Many large corporations require DUNS numbers from suppliers to assess creditworthiness and determine payment terms ([Nav - DUNS Number Guide](https://www.nav.com/resource/duns-number/), [Dun & Bradstreet](https://www.dnb.com/duns.html)).

### Address Handling

**Challenge:** Food distributors operate from multiple locations with different purposes (corporate HQ, regional warehouses, billing departments).

**Standard Pattern - Dual Address Model:**

| Address Type | Fields | Purpose |
|--------------|--------|---------|
| **Billing Address** | BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry | Where invoices are sent; tied to payment verification (AVS) |
| **Shipping Address** | ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry | Primary physical location for deliveries |

**Limitations:** This dual-address pattern only supports 2 addresses per organization.

**Advanced Pattern - Related Address Objects:**

For distributors with 3+ locations (HQ + multiple warehouses), use a separate Address object:

```
Organization (1) ──→ (Many) Addresses
  ├─ Address 1: HQ (Type: "Headquarters")
  ├─ Address 2: Denver Warehouse (Type: "Warehouse")
  ├─ Address 3: Phoenix Warehouse (Type: "Warehouse")
  └─ Address 4: Billing Department (Type: "Billing")
```

**Fields for Address Object:**
- `organization_id` (Foreign Key)
- `address_type` (Enum: "headquarters", "warehouse", "billing", "shipping")
- `street`, `city`, `state`, `postal_code`, `country`
- `is_primary` (Boolean)
- `is_active` (Boolean)

**Source:** Address verification at checkout and before shipping is critical for avoiding failed deliveries. B2B and warehouse contexts often require different billing and shipping addresses ([Shopify - Billing vs Shipping](https://www.shopify.com/blog/billing-address-vs-shipping-address), [Red Stag Fulfillment](https://redstagfulfillment.com/billing-address-vs-shipping-address/)).

### Status & Lifecycle Fields

**Dual-Field Pattern (Industry Standard):**

| Field | Type | Values | Purpose |
|-------|------|--------|---------|
| **Status** (statecode) | Enum | Active, Inactive | Primary state indicator |
| **Status Reason** (statuscode) | Enum (conditional) | Varies by status | Granular sub-status |

**Status Reason Values by Status:**

**Active Status:**
- "Active Customer" - Current buying relationship
- "Prospect" - Potential customer, not yet buying
- "Authorized Distributor" - Approved to carry principals' products

**Inactive Status:**
- "Account Closed" - Relationship terminated
- "Out of Business" - Company no longer operating
- "Disqualified" - Does not meet criteria

**Alternative: Relationship Type Field**

Some CRMs use `relationship_type` (customertypecode) to classify organizations:
- "Customer"
- "Prospect"
- "Vendor"
- "Competitor"
- "Partner"

**Source:** Most CRM entities use Status (active/inactive) and Status Reason (customizable sub-statuses). The Relationship Type field classifies accounts as customer, prospect, vendor, or competitor ([CRM Crate - Status Codes](https://www.crmcrate.com/other/crm-entity-status-status-reason-codes/), [Carl de Souza - Dynamics 365](https://carldesouza.com/understanding-statecode-statuscode-status-and-status-reason-in-dynamics-365/)).

### Integration Identifiers

Food distributors require integration with ERP systems for order processing, inventory synchronization, and EDI transactions.

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| ERP Vendor Code | Text | External system identifier | "VEND-1234" |
| EDI ID | Text | Electronic Data Interchange identifier | "012345678901234" (14-digit GLN) |
| GLN (Global Location Number) | Text (13 digits) | GS1 location identifier | "1234567890128" |
| Customer Number (External) | Text | Distributor's customer ID for this org | "CUST-9876" |
| Supplier Number (External) | Text | Distributor's supplier ID for this org | "SUPP-5432" |

**Source:** Food distribution ERPs integrate with EDI providers (SPS Commerce, TrueCommerce, B2BGateway) and manage vendor-specific item numbers and identifiers ([Acctivate - Food Distribution Software](https://acctivate.com/industries/food-distribution-software/), [inecta Food ERP](https://www.inecta.com/food-distributor)).

### Credit & Payment Terms Fields

Critical for B2B relationships where payment terms affect cash flow and vendor risk assessment.

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Payment Terms | Picklist | Standard payment terms | "Net 30", "Net 60", "2/10 Net 30", "COD" |
| Credit Limit | Currency | Maximum credit extended | $100,000.00 |
| Credit Status | Picklist | Current credit standing | "Good", "Review", "Hold" |
| Payment Method | Picklist | Preferred payment type | "ACH", "Check", "Wire Transfer", "Credit Card" |
| Tax Exempt | Boolean | Sales tax exemption status | true/false |
| Tax Exempt Certificate | Text | Certificate number | "TAX-EXEMPT-2024-12345" |

**Source:** DUNS numbers and business credit profiles are used by vendors to assess creditworthiness and determine whether to offer net-30 terms or other trade credit. Good PAYDEX scores enable lower interest rates and access to supplier credit lines ([Resolve - Trade References](https://resolvepay.com/blog/post/understanding-how-trade-references-work/)).

### Territory & Coverage Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Territory | Lookup (Territory) | Sales territory assignment | "Western Region" |
| Service Area | Text/Long Text | Geographic coverage description | "CO, UT, NM, AZ" |
| Account Manager | Lookup (User) | Primary relationship owner | "Sarah Johnson" |
| Secondary Owner | Lookup (User) | Backup/support contact | "Mike Chen" |

## Food Distribution Industry Fields

### Distribution-Specific Operational Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Delivery Days | Multi-select Picklist | Days distributor delivers | "Monday, Wednesday, Friday" |
| Minimum Order Value | Currency | Minimum order requirement | $500.00 |
| Delivery Radius | Number (miles) | Service area from warehouse | 150 |
| Temperature Zones Supported | Multi-select Picklist | Storage capabilities | "Frozen, Refrigerated, Dry" |
| Fleet Size | Number | Delivery trucks available | 25 |
| Warehouse Capacity (sq ft) | Number | Storage space | 50000 |

### Certification & Compliance Fields

Food safety and quality certifications are critical for distributor credibility.

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Food Safety Certifications | Multi-select Picklist | Certifications held | "SQF Level 2", "HACCP", "GFSI", "FSMA" |
| Organic Certified | Boolean | Organic handling certification | true/false |
| Kosher Certified | Boolean | Kosher certification | true/false |
| Halal Certified | Boolean | Halal certification | true/false |
| Allergen Program | Boolean | Allergen management program | true/false |
| Last Audit Date | Date | Most recent food safety audit | "2024-11-15" |
| Next Audit Due | Date | Upcoming audit date | "2025-11-15" |

**Source:** Food ERP systems include user-definable checkbox fields for inventory ingredient flags (peanut-based, Kosher, etc.) and support lot traceability for SQF/HACCP/GFSI/FSMA and allergen tracking ([inecta Food ERP](https://www.inecta.com/food-distributor)).

### Product Line & Specialization

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| Product Categories | Multi-select Picklist | Categories carried | "Proteins, Produce, Dairy, Dry Goods" |
| Private Label Capability | Boolean | Offers private label products | true/false |
| Specialty Focus | Multi-select Picklist | Niche areas | "Organic", "Gluten-Free", "Local" |

### ERP & System Integration Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| ERP System | Picklist | ERP platform used | "NorthScope", "SYSPRO", "JustFood", "Acumatica" |
| EDI Capable | Boolean | Supports EDI transactions | true/false |
| EDI Provider | Picklist | EDI service provider | "SPS Commerce", "TrueCommerce", "B2BGateway" |
| API Endpoint | URL | Integration API URL | "https://api.distributor.com/v1" |
| API Key Status | Picklist | Integration status | "Active", "Pending", "Inactive" |
| WMS Integrated | Boolean | Warehouse management system | true/false |

**Source:** Food distribution ERPs integrate EDI documents, expose items/lots/orders to WMS and 3PLs, and sync orders with e-commerce platforms ([Acctivate](https://acctivate.com/industries/food-distribution-software/), [SYSPRO](https://us.syspro.com/industry-specific-software/distribution-software/food-distribution-software/)).

## Trade-off Analysis

### Single Organization Record vs. Multiple Related Tables

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Flat Model** (all fields on organization) | • Simple queries<br>• Easy to understand<br>• Fast reads | • Limited to 2 addresses<br>• Rigid structure<br>• Harder to add warehouses | Small distributors with 1-2 locations |
| **Normalized Model** (separate Address, Contact, Certification tables) | • Unlimited addresses<br>• Flexible structure<br>• Clean data model | • Complex queries (joins)<br>• Slower reads<br>• More development work | Regional/national distributors with multiple warehouses |

**Recommendation:** Start with flat model for MVP (matches current Crispy CRM pattern), migrate to normalized Address table when distributors exceed 2 locations.

### Status Field Design Trade-offs

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Single Status Field** (e.g., "Active Customer") | • Simple<br>• No conditional logic | • Limited granularity<br>• Hard to add statuses | Very simple use cases |
| **Status + Status Reason** (industry standard) | • Granular tracking<br>• Clear state machine<br>• Reporting flexibility | • Requires conditional logic<br>• More complex UI | B2B CRMs with lifecycle management |
| **Multiple Boolean Flags** (is_customer, is_prospect) | • Very flexible<br>• Easy filters | • Can create invalid states<br>• No clear lifecycle | Not recommended |

**Recommendation:** Use Status + Status Reason pattern (industry standard).

### Integration Identifier Management

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Embedded Fields** (erp_code, edi_id on org) | • Fast lookups<br>• Simple queries | • One ID per system<br>• Schema changes for new systems | Single-ERP environments |
| **External Identifiers Table** | • Unlimited integrations<br>• No schema changes | • Complex queries<br>• Slower lookups | Multi-system integrations |

**Recommendation:** Embedded fields for common identifiers (DUNS, ERP code, EDI ID), External Identifiers table if integrating with 3+ external systems.

## Recommendations for Crispy CRM

### Phase 1: MVP - Essential Distributor Fields (Immediate)

Add these fields to the `organizations` table:

**Core Identity:**
- `account_number` (TEXT, auto-generated, unique) - "DIST-0001"
- `organization_type` (ENUM) - "distributor", "principal", "operator", "other"
- `status` (ENUM) - "active", "inactive"
- `status_reason` (ENUM, nullable) - "active_customer", "prospect", "authorized_distributor", "account_closed", "out_of_business"

**Contact Info:**
- `phone` (TEXT)
- `email` (TEXT)
- `website` (TEXT)

**Addresses (Flat Model for MVP):**
- `billing_street` (TEXT)
- `billing_city` (TEXT)
- `billing_state` (TEXT, 2-char state code)
- `billing_postal_code` (TEXT)
- `billing_country` (TEXT, default "US")
- `shipping_street` (TEXT)
- `shipping_city` (TEXT)
- `shipping_state` (TEXT)
- `shipping_postal_code` (TEXT)
- `shipping_country` (TEXT, default "US")

**Integration:**
- `erp_vendor_code` (TEXT, nullable) - External ERP identifier
- `duns_number` (TEXT, nullable, 9 digits) - D&B identifier

**Payment Terms:**
- `payment_terms` (ENUM) - "net_30", "net_60", "net_90", "cod", "prepaid", "2_10_net_30"
- `credit_limit` (DECIMAL, nullable)

**Territory:**
- `territory` (TEXT, nullable) - e.g., "Western Region"
- `account_manager_id` (UUID, FK to users, nullable)

### Phase 2: Food Distribution Enhancements (Post-MVP)

**Distribution Operations:**
- `delivery_days` (TEXT[]) - Array of days: ["monday", "wednesday", "friday"]
- `minimum_order_value` (DECIMAL, nullable)
- `temperature_zones` (TEXT[]) - ["frozen", "refrigerated", "dry"]

**Certifications:**
- `food_safety_certifications` (TEXT[]) - ["sqf_level_2", "haccp", "gfsi", "fsma"]
- `is_organic_certified` (BOOLEAN, default false)
- `is_kosher_certified` (BOOLEAN, default false)
- `last_audit_date` (DATE, nullable)

**EDI Integration:**
- `edi_capable` (BOOLEAN, default false)
- `edi_provider` (TEXT, nullable) - "SPS Commerce", "TrueCommerce", etc.
- `gln_number` (TEXT, nullable, 13 digits) - Global Location Number

### Phase 3: Multi-Location Support (Future)

When distributors need 3+ addresses, create `organization_addresses` table:

```sql
CREATE TABLE organization_addresses (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  address_type TEXT CHECK (address_type IN ('headquarters', 'warehouse', 'billing', 'shipping')),
  street TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Zod Schema Pattern

```typescript
// Phase 1 MVP Schema
export const distributorProfileSchema = z.strictObject({
  name: z.string().min(1).max(255),
  account_number: z.string().max(50).optional(),
  organization_type: z.enum(['distributor', 'principal', 'operator', 'other']),
  status: z.enum(['active', 'inactive']),
  status_reason: z.enum([
    'active_customer',
    'prospect',
    'authorized_distributor',
    'account_closed',
    'out_of_business'
  ]).nullable(),
  phone: z.string().max(20).nullable(),
  email: z.string().email().max(255).nullable(),
  website: z.string().url().max(255).nullable(),
  billing_street: z.string().max(255).nullable(),
  billing_city: z.string().max(100).nullable(),
  billing_state: z.string().length(2).nullable(),
  billing_postal_code: z.string().max(20).nullable(),
  billing_country: z.string().length(2).default('US'),
  shipping_street: z.string().max(255).nullable(),
  shipping_city: z.string().max(100).nullable(),
  shipping_state: z.string().length(2).nullable(),
  shipping_postal_code: z.string().max(20).nullable(),
  shipping_country: z.string().length(2).default('US'),
  erp_vendor_code: z.string().max(50).nullable(),
  duns_number: z.string().length(9).regex(/^\d{9}$/).nullable(),
  payment_terms: z.enum(['net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30']).nullable(),
  credit_limit: z.coerce.number().nonnegative().nullable(),
  territory: z.string().max(100).nullable(),
  account_manager_id: z.string().uuid().nullable(),
});
```

### UI Recommendations

**Create/Edit Forms:**
- **Tab 1:** Basic Info (name, type, status, contact info)
- **Tab 2:** Addresses (billing, shipping with "Same as billing" checkbox)
- **Tab 3:** Business Details (payment terms, credit, territory)
- **Tab 4:** Integration (ERP codes, DUNS, EDI - collapsed by default)

**List View Columns (Distributor Filter):**
1. Name
2. Status Badge (colored: green=active, gray=inactive)
3. Territory
4. Account Manager
5. Payment Terms
6. Last Activity Date

**Slide-Over Panel Quick View:**
- Header: Name, Status, Account Number
- Section 1: Primary contact (phone, email)
- Section 2: Billing address (formatted)
- Section 3: Key metrics (credit limit, payment terms)
- Action: "Edit Full Profile" button

## Sources Consulted

### CRM Standards & Best Practices
- [Best CRM for Distribution Companies | Salesforce](https://www.salesforce.com/consumer-goods/software-for-distributors/) - B2B distributor CRM requirements
- [B2B CRM: A buyer's guide for 2025 | Capsule CRM](https://capsulecrm.com/blog/b2b-crm/) - Account-based structure patterns
- [Salesforce Account Object Reference | Salesforce Developers](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_account.htm) - Standard CRM fields
- [B2B CRM Strategies Guide | Zen Media](https://zenmedia.com/blog/b2b-crm-strategies-guide/) - Contact management and segmentation
- [8 best practices for B2B businesses using CRM systems | Columbus](https://www.columbusglobal.com/en-gb/blog/best-practices-for-b2b-businesses-using-crm-systems) - Team alignment and data quality
- [Business Partner Data Cloud | Stibo Systems](https://www.stibosystems.com/solution/business-partner-data-cloud) - Complex account hierarchies and organizational data

### Status & Lifecycle Management
- [Customer Status: Prospect, New, Active, Inactive | Gazelle](https://help.gazelleapp.io/en/articles/97508-customer-status-prospect-new-active-inactive) - Status progression patterns
- [Understanding StateCode, StatusCode in Dynamics 365 | Carl de Souza](https://carldesouza.com/understanding-statecode-statuscode-status-and-status-reason-in-dynamics-365/) - Status + Status Reason dual-field pattern
- [CRM Entity Status & Status Reason Codes | CRM Crate](https://www.crmcrate.com/other/crm-entity-status-status-reason-codes/) - Standard status values

### Integration & Identifiers
- [D-U-N-S Number: Everything You Need To Know | Nav](https://www.nav.com/resource/duns-number/) - DUNS number purpose and usage
- [How to Get a DUNS Number | Dun & Bradstreet](https://www.dnb.com/duns.html) - Business credit verification
- [Understanding How Trade References Work | Resolve](https://resolvepay.com/blog/post/understanding-how-trade-references-work/) - Payment terms and credit assessment

### Address Management
- [Billing Address vs. Shipping Address | Shopify](https://www.shopify.com/blog/billing-address-vs-shipping-address) - Address type purposes
- [Billing vs Shipping Address | Red Stag Fulfillment](https://redstagfulfillment.com/billing-address-vs-shipping-address/) - Warehouse and distribution contexts
- [Shipping Address vs. Billing Address | Easyship](https://www.easyship.com/blog/shipping-address-vs-billing-address) - Address verification importance

### Food Distribution ERP
- [Food Distribution Software | Acctivate](https://acctivate.com/industries/food-distribution-software/) - EDI integration and vendor management
- [Food Distribution Software | inecta](https://www.inecta.com/food-distributor) - Lot traceability and certification tracking
- [Food Distribution Software | SYSPRO](https://us.syspro.com/industry-specific-software/distribution-software/food-distribution-software/) - EDI automation and warehouse management
- [ERP for Food Distributors | NorthScope](https://myfoodsoftware.com/food-distributors-importers-resellers/) - Vendor information tracking
- [JustFood ERP](https://www.justfooderp.com/) - Food manufacturing and distribution integration
