# API Migration Guide: Deals to Opportunities

## Overview

As part of our CRM platform evolution, we are migrating from "Deals" to "Opportunities" terminology to better align with industry standards and provide enhanced functionality. This guide will help you migrate your API integrations smoothly.

## Migration Timeline

- **Current Version (v2.0.0)**: Both `/deals` and `/opportunities` endpoints are available
- **Deprecation Notice**: `/deals` endpoints are deprecated and will show warnings
- **End of Support**: v3.0.0 (Target: Q2 2025) - `/deals` endpoints will be removed

## What's Changing

### Terminology Updates

| Old Term | New Term | Description |
|----------|----------|-------------|
| Deal | Opportunity | A potential sale or business opportunity |
| Deal Note | Opportunity Note | Notes and comments on opportunities |
| Deal Contact | Opportunity Participant | Contacts involved in an opportunity |

### Enhanced Features in Opportunities

The new opportunities model includes several enhancements:

1. **Opportunity Types**: Categorize as `new_business`, `expansion`, or `renewal`
2. **Multi-Contact Support**: Associate multiple contacts with different roles
3. **Probability Tracking**: Built-in probability percentage field
4. **Currency Support**: Explicit currency field for international deals
5. **Enhanced Status Model**: Clear distinction between stage and status

## Endpoint Migration

### Basic CRUD Operations

#### List Items

**Old:**
```http
GET /deals?limit=10&offset=0
```

**New:**
```http
GET /opportunities?limit=10&offset=0
```

#### Get Single Item

**Old:**
```http
GET /deals/{id}
```

**New:**
```http
GET /opportunities/{id}
```

#### Create Item

**Old:**
```http
POST /deals
{
  "name": "Enterprise Sale",
  "stage": "qualification",
  "amount": 50000,
  "company_id": "uuid"
}
```

**New:**
```http
POST /opportunities
{
  "name": "Enterprise Sale",
  "stage": "qualification",
  "type": "new_business",
  "expected_revenue": 50000,
  "currency": "USD",
  "probability": 30,
  "company_id": "uuid"
}
```

#### Update Item

**Old:**
```http
PATCH /deals/{id}
{
  "stage": "negotiation",
  "amount": 55000
}
```

**New:**
```http
PATCH /opportunities/{id}
{
  "stage": "negotiation",
  "expected_revenue": 55000,
  "probability": 70
}
```

### Related Resources

#### Notes

**Old:**
```http
GET /dealNotes?deal_id={id}
POST /dealNotes
{
  "deal_id": "uuid",
  "text": "Call scheduled"
}
```

**New:**
```http
GET /opportunity_notes?opportunity_id={id}
POST /opportunity_notes
{
  "opportunity_id": "uuid",
  "text": "Call scheduled"
}
```

#### Participants (formerly Deal Contacts)

**New endpoint for multiple participants:**
```http
GET /opportunity_participants?opportunity_id={id}
POST /opportunity_participants
{
  "opportunity_id": "uuid",
  "contact_id": "uuid",
  "role": "decision_maker",
  "is_primary": true
}
```

## Field Mapping

### Opportunity Model Changes

| Old Field (Deal) | New Field (Opportunity) | Type | Notes |
|-----------------|-------------------------|------|-------|
| `id` | `id` | uuid | No change |
| `name` | `name` | string | No change |
| `stage` | `stage` | string | No change |
| `amount` | `expected_revenue` | number | Renamed for clarity |
| - | `currency` | string | New field, defaults to "USD" |
| - | `type` | enum | New: new_business, expansion, renewal |
| - | `probability` | integer | New: 0-100 percentage |
| `close_date` | `expected_close_date` | date | Renamed |
| - | `actual_close_date` | date | New field |
| `company_id` | `company_id` | uuid | No change |
| `contact_id` | - | uuid | Moved to opportunity_participants |
| `sales_id` | `sales_id` | uuid | No change |
| `created_at` | `created_at` | timestamp | No change |
| `updated_at` | `updated_at` | timestamp | No change |

### Status Values

| Old Status | New Status | Description |
|------------|------------|-------------|
| `open` | `active` | Opportunity is being worked on |
| `won` | `won` | Successfully closed |
| `lost` | `lost` | Unsuccessful |
| - | `archived` | New status for inactive opportunities |

## Code Examples

### JavaScript/TypeScript

#### Before (Deals)
```javascript
// Fetch deals
const response = await fetch('/api/deals', {
  headers: { 'apikey': API_KEY }
});
const deals = await response.json();

// Create a deal
const newDeal = await fetch('/api/deals', {
  method: 'POST',
  headers: {
    'apikey': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Deal',
    stage: 'qualification',
    amount: 10000,
    company_id: companyId
  })
});
```

#### After (Opportunities)
```javascript
// Fetch opportunities
const response = await fetch('/api/opportunities', {
  headers: { 'apikey': API_KEY }
});
const opportunities = await response.json();

// Create an opportunity
const newOpportunity = await fetch('/api/opportunities', {
  method: 'POST',
  headers: {
    'apikey': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Opportunity',
    stage: 'qualification',
    type: 'new_business',
    expected_revenue: 10000,
    currency: 'USD',
    probability: 30,
    company_id: companyId
  })
});
```

### Python

#### Before (Deals)
```python
import requests

# Fetch deals
response = requests.get(
    f"{API_URL}/deals",
    headers={"apikey": API_KEY}
)
deals = response.json()

# Create a deal
new_deal = requests.post(
    f"{API_URL}/deals",
    headers={"apikey": API_KEY},
    json={
        "name": "New Deal",
        "stage": "qualification",
        "amount": 10000,
        "company_id": company_id
    }
)
```

#### After (Opportunities)
```python
import requests

# Fetch opportunities
response = requests.get(
    f"{API_URL}/opportunities",
    headers={"apikey": API_KEY}
)
opportunities = response.json()

# Create an opportunity
new_opportunity = requests.post(
    f"{API_URL}/opportunities",
    headers={"apikey": API_KEY},
    json={
        "name": "New Opportunity",
        "stage": "qualification",
        "type": "new_business",
        "expected_revenue": 10000,
        "currency": "USD",
        "probability": 30,
        "company_id": company_id
    }
)
```

## Webhook Updates

If you're using webhooks, update your event subscriptions:

### Event Name Changes

| Old Event | New Event |
|-----------|-----------|
| `deal.created` | `opportunity.created` |
| `deal.updated` | `opportunity.updated` |
| `deal.deleted` | `opportunity.deleted` |
| `deal.won` | `opportunity.won` |
| `deal.lost` | `opportunity.lost` |

### Webhook Payload Changes

The webhook payload structure remains similar, but field names follow the new schema:

```json
{
  "event": "opportunity.created",
  "data": {
    "id": "uuid",
    "name": "Enterprise Opportunity",
    "type": "new_business",
    "expected_revenue": 50000,
    "currency": "USD",
    "probability": 30,
    // ... other fields
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Mobile App Considerations

### API Contract Updates

Mobile applications should:

1. **Update API endpoints** from `/deals` to `/opportunities`
2. **Handle new required fields** when creating opportunities (e.g., `type`)
3. **Update field names** in request/response handling
4. **Implement fallback** for older app versions during transition

### Version Compatibility

To maintain backward compatibility:

1. Check API version header: `X-API-Version`
2. Handle both old and new response formats during transition
3. Implement gradual migration with feature flags

## Testing Your Migration

### Step-by-Step Testing Guide

1. **Update Base URLs**
   - Replace `/deals` with `/opportunities`
   - Update related endpoints (`/dealNotes` → `/opportunity_notes`)

2. **Update Request Payloads**
   - Add new required fields (`type`, `currency`)
   - Rename fields (`amount` → `expected_revenue`)

3. **Update Response Handling**
   - Handle renamed fields in responses
   - Process new fields like `probability` and `actual_close_date`

4. **Test Webhooks**
   - Update webhook event names
   - Verify payload processing with new field names

5. **Validate Data Integrity**
   - Ensure all migrated data appears correctly
   - Verify calculations using new fields

### Testing Endpoints

Use our staging environment for testing:
- Staging URL: `https://staging-api.atomic-crm.com/v2`
- Test API Key: Contact support for credentials

## Support Resources

### Getting Help

- **Documentation**: https://docs.atomic-crm.com/api/v2
- **Migration Support**: migration-support@atomic-crm.com
- **Developer Forum**: https://forum.atomic-crm.com/api-migration
- **Status Page**: https://status.atomic-crm.com

### FAQ

**Q: Will my existing deals data be migrated automatically?**
A: Yes, all existing deals are automatically available through the opportunities endpoints with proper field mapping.

**Q: How long will the old endpoints remain available?**
A: The `/deals` endpoints will remain available until v3.0.0 (target Q2 2025) but will show deprecation warnings.

**Q: Can I use both endpoints during migration?**
A: Yes, both endpoints work with the same underlying data during the transition period.

**Q: What happens to my existing integrations?**
A: They will continue to work with deprecation warnings until v3.0.0. We recommend migrating as soon as possible.

## Deprecation Headers

When using deprecated endpoints, you'll receive these headers:
```http
X-Deprecated: true
X-Deprecation-Date: 2025-06-01
X-Alternative: /opportunities
Warning: 299 - "Deprecated endpoint. Use /opportunities instead"
```

## Changelog

- **v2.0.0** (2024-01-15): Introduced opportunities endpoints, deprecated deals
- **v2.1.0** (Planned): Enhanced opportunity analytics
- **v3.0.0** (Target Q2 2025): Remove deprecated deals endpoints