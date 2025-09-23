# Webhook Migration: Deals to Opportunities

## Important Notice for Webhook Consumers

We are migrating our CRM system from "Deals" to "Opportunities" to provide better functionality and align with industry standards. This affects all webhook integrations.

## Timeline

- **Immediate**: Both deal and opportunity webhooks are active
- **3 months**: Deal webhooks will be marked as deprecated
- **6 months**: Deal webhooks will be discontinued

## What You Need to Do

### 1. Update Your Webhook URLs

Register new webhook endpoints for opportunity events:

```bash
# Old webhook registration
POST /webhooks/subscribe
{
  "event": "deal.created",
  "url": "https://your-app.com/webhooks/deal-created"
}

# New webhook registration
POST /webhooks/subscribe
{
  "event": "opportunity.created",
  "url": "https://your-app.com/webhooks/opportunity-created"
}
```

### 2. Update Event Handlers

#### Event Type Mapping

| Old Event Type | New Event Type | Description |
|---------------|----------------|-------------|
| `deal.created` | `opportunity.created` | New opportunity created |
| `deal.updated` | `opportunity.updated` | Opportunity details changed |
| `deal.stage_changed` | `opportunity.stage_changed` | Pipeline stage updated |
| `deal.won` | `opportunity.won` | Opportunity marked as won |
| `deal.lost` | `opportunity.lost` | Opportunity marked as lost |
| `deal.deleted` | `opportunity.deleted` | Opportunity removed |
| `deal.archived` | `opportunity.archived` | Opportunity archived |
| `dealNote.created` | `opportunity_note.created` | Note added to opportunity |

### 3. Update Payload Processing

#### Old Payload Structure (Deal)
```json
{
  "event": "deal.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Enterprise Deal",
    "amount": 50000,
    "stage": "qualification",
    "company_id": "660e8400-e29b-41d4-a716-446655440001",
    "contact_id": "770e8400-e29b-41d4-a716-446655440002",
    "sales_id": "880e8400-e29b-41d4-a716-446655440003",
    "close_date": "2024-03-15",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "version": "1.0",
    "source": "crm"
  }
}
```

#### New Payload Structure (Opportunity)
```json
{
  "event": "opportunity.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Enterprise Opportunity",
    "type": "new_business",
    "expected_revenue": 50000,
    "currency": "USD",
    "probability": 30,
    "stage": "qualification",
    "status": "active",
    "company_id": "660e8400-e29b-41d4-a716-446655440001",
    "sales_id": "880e8400-e29b-41d4-a716-446655440003",
    "expected_close_date": "2024-03-15",
    "actual_close_date": null,
    "participants": [
      {
        "contact_id": "770e8400-e29b-41d4-a716-446655440002",
        "role": "decision_maker",
        "is_primary": true
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "metadata": {
    "version": "2.0",
    "source": "crm",
    "user_id": "990e8400-e29b-41d4-a716-446655440004"
  }
}
```

### 4. Key Differences to Handle

#### New Fields
- `type`: Categorization (new_business, expansion, renewal)
- `currency`: Explicit currency code
- `probability`: Win probability percentage (0-100)
- `expected_revenue`: Renamed from `amount`
- `expected_close_date`: Renamed from `close_date`
- `actual_close_date`: New field for actual closing
- `participants`: Array replacing single `contact_id`

#### Changed Field Names
| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `amount` | `expected_revenue` | More descriptive name |
| `close_date` | `expected_close_date` | Clarifies it's an estimate |
| `contact_id` | `participants[].contact_id` | Now supports multiple contacts |

#### Status Model
- Old: Single `stage` field
- New: Separate `stage` (pipeline position) and `status` (active/won/lost/archived)

## Implementation Examples

### Node.js/Express

```javascript
// Old webhook handler
app.post('/webhooks/deal-created', (req, res) => {
  const { data } = req.body;
  processNewDeal({
    id: data.id,
    name: data.name,
    value: data.amount,
    contact: data.contact_id
  });
  res.status(200).send('OK');
});

// New webhook handler
app.post('/webhooks/opportunity-created', (req, res) => {
  const { data } = req.body;
  processNewOpportunity({
    id: data.id,
    name: data.name,
    value: data.expected_revenue,
    currency: data.currency,
    probability: data.probability,
    contacts: data.participants.map(p => ({
      id: p.contact_id,
      role: p.role,
      isPrimary: p.is_primary
    }))
  });
  res.status(200).send('OK');
});
```

### Python/Flask

```python
# Old webhook handler
@app.route('/webhooks/deal-created', methods=['POST'])
def handle_deal_created():
    data = request.json['data']
    process_new_deal({
        'id': data['id'],
        'name': data['name'],
        'value': data['amount'],
        'contact': data['contact_id']
    })
    return 'OK', 200

# New webhook handler
@app.route('/webhooks/opportunity-created', methods=['POST'])
def handle_opportunity_created():
    data = request.json['data']
    process_new_opportunity({
        'id': data['id'],
        'name': data['name'],
        'value': data['expected_revenue'],
        'currency': data['currency'],
        'probability': data['probability'],
        'contacts': [
            {
                'id': p['contact_id'],
                'role': p['role'],
                'is_primary': p['is_primary']
            }
            for p in data['participants']
        ]
    })
    return 'OK', 200
```

## Webhook Security

### Signature Verification

Webhooks include HMAC signatures for security. The signature algorithm remains the same:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage
app.post('/webhooks/opportunity-created', (req, res) => {
  const signature = req.headers['x-webhook-signature'];

  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook...
});
```

## Testing Webhooks

### Test Event Generator

Use our test endpoint to generate sample webhook events:

```bash
# Generate test opportunity.created event
curl -X POST https://api.atomic-crm.com/webhooks/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "opportunity.created",
    "target_url": "https://your-app.com/webhooks/test"
  }'
```

### Webhook Testing Tool

Access our webhook testing interface:
- URL: https://webhooks.atomic-crm.com/test
- Login with your API credentials
- Select event type and send test payloads

## Parallel Processing

During the migration period, you can process both event types:

```javascript
// Unified handler for transition period
function handleSaleEvent(eventType, data) {
  // Normalize the data
  const normalized = eventType.startsWith('deal.') ? {
    id: data.id,
    name: data.name,
    value: data.amount,
    currency: 'USD', // Default for old deals
    probability: null, // Not available in old model
    contacts: data.contact_id ? [{
      id: data.contact_id,
      role: 'contact',
      isPrimary: true
    }] : []
  } : {
    id: data.id,
    name: data.name,
    value: data.expected_revenue,
    currency: data.currency,
    probability: data.probability,
    contacts: data.participants.map(p => ({
      id: p.contact_id,
      role: p.role,
      isPrimary: p.is_primary
    }))
  };

  // Process with unified logic
  processSaleEvent(normalized);
}

// Register both handlers during transition
app.post('/webhooks/deal-created', (req, res) => {
  handleSaleEvent(req.body.event, req.body.data);
  res.status(200).send('OK');
});

app.post('/webhooks/opportunity-created', (req, res) => {
  handleSaleEvent(req.body.event, req.body.data);
  res.status(200).send('OK');
});
```

## Monitoring Migration

### Webhook Analytics

Monitor your webhook processing:
- Success/failure rates for both event types
- Processing time comparison
- Error patterns during migration

### Dashboard Metrics

Track migration progress:
```sql
-- Old metric query
SELECT COUNT(*) FROM webhook_logs
WHERE event_type LIKE 'deal.%'
AND created_at > NOW() - INTERVAL '24 hours';

-- New metric query
SELECT COUNT(*) FROM webhook_logs
WHERE event_type LIKE 'opportunity.%'
AND created_at > NOW() - INTERVAL '24 hours';
```

## Rollback Plan

If you encounter issues:

1. **Keep both handlers active** during migration
2. **Log all events** for troubleshooting
3. **Implement circuit breakers** for failing endpoints
4. **Contact support** for assistance

## Support

### Getting Help

- **Technical Support**: webhook-support@atomic-crm.com
- **Migration Assistance**: Available Mon-Fri 9am-6pm EST
- **Emergency Hotline**: +1-555-WEBHOOK (for critical issues)
- **Documentation**: https://docs.atomic-crm.com/webhooks

### Common Issues

**Q: Can I receive both deal and opportunity events during migration?**
A: Yes, you can subscribe to both event types simultaneously.

**Q: Will historical webhook data be affected?**
A: No, historical webhook logs remain unchanged.

**Q: How do I map participants back to a single contact?**
A: Use the primary participant: `participants.find(p => p.is_primary)`

**Q: What happens if I don't migrate by the deadline?**
A: Deal webhooks will stop functioning. Your integration will break.

## Compliance Note

This migration helps us maintain:
- GDPR compliance with better contact role tracking
- SOC 2 compliance with improved audit trails
- Industry-standard terminology for better integration compatibility