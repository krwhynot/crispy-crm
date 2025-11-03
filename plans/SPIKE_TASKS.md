# Research Spike Tasks Consolidated
**Total Spikes:** 16 tasks across 5 phases
**Total Time:** 41 hours
**Purpose:** Time-boxed research to reduce technical uncertainty

---

## What is a Spike?

A spike is a time-boxed research task to gather information needed for implementation. The output is knowledge, not code.

**Key Rules:**
- **Time-boxed:** Stop when time expires
- **Document findings:** Knowledge is the deliverable
- **Make recommendations:** Propose implementation approach
- **Defer decisions:** Until spike complete

---

## Phase 2 Spikes (6 hours)

### P2-E1-S0-T1: Research Segment Combo Box Patterns
**Time:** 3 hours
**Confidence Before:** 65%
**Required For:** P2-E1-S2-T3 (Flexible segments implementation)

**Research Questions:**
1. How do other CRMs handle flexible taxonomies?
2. Which React libraries support combo boxes well?
3. How to persist custom values to database?
4. UX patterns for type-ahead with creation?

**Success Criteria:**
- [ ] Find 3 reference implementations
- [ ] Select React library (downshift vs react-select vs Arco)
- [ ] Design database schema for custom values
- [ ] Create UI mockup

**Recommended Approach:**
```typescript
// Likely solution: downshift with custom renderer
<Combobox
  items={[...predefined, ...userCreated]}
  allowCreate={true}
  onCreate={(value) => addToUserSegments(value)}
/>
```

---

### P2-E1-S0-T2: Research JSONB Array Best Practices
**Time:** 3 hours
**Confidence Before:** 75%
**Required For:** P2-E2-S2-T2 (Contact arrays implementation)

**Research Questions:**
1. PostgreSQL JSONB array query patterns?
2. Indexing strategies for JSONB arrays?
3. React Admin array field patterns?
4. Zod validation for nested arrays?

**Success Criteria:**
- [ ] Document query patterns for arrays
- [ ] Identify index requirements
- [ ] Create validation schema template
- [ ] Find React Admin examples

**Likely Findings:**
```sql
-- GIN index for JSONB arrays
CREATE INDEX idx_contacts_email ON contacts USING GIN (email);

-- Query pattern
SELECT * FROM contacts
WHERE email @> '[{"email": "test@example.com"}]';
```

---

## Phase 3 Spikes (14 hours)

### P3-E2-S0-T1: Evaluate Drag-and-Drop Libraries
**Time:** 3 hours
**Confidence Before:** 65%
**Required For:** P3-E2-S1-T2 (Kanban implementation)

**Research Questions:**
1. dnd-kit vs react-beautiful-dnd vs react-sortable-hoc?
2. Performance with 100+ cards?
3. Mobile/touch support quality?
4. Accessibility compliance?

**Evaluation Matrix:**
| Library | Bundle Size | Touch | A11y | React 18 | Active |
|---------|------------|-------|------|----------|--------|
| dnd-kit | ? | ? | ? | ? | ? |
| beautiful-dnd | ? | ? | ? | ? | ? |
| @atlaskit/pragmatic-drag-and-drop | ? | ? | ? | ? | ? |

**Success Criteria:**
- [ ] Benchmark 3 libraries
- [ ] Create proof-of-concept
- [ ] Measure performance
- [ ] Select library

---

### P3-E3-S0-T1: Research Campaign/Trade Show UI Patterns
**Time:** 3 hours
**Confidence Before:** 55%
**Required For:** P3-E3-S2-T1 (Campaign grouping)

**Research Questions:**
1. How do CRMs group related opportunities?
2. Tab vs accordion vs nested list?
3. Bulk operations patterns?
4. Quick entry workflows?

**Reference Products:**
- Salesforce Campaigns
- HubSpot Deals
- Pipedrive Activities
- Monday.com Groups

**Success Criteria:**
- [ ] Screenshot 5 implementations
- [ ] Identify common patterns
- [ ] Create wireframes
- [ ] Get user feedback

---

### P3-E4-S0-T1: Research Inline Product Selection UX
**Time:** 3 hours
**Confidence Before:** 75%
**Required For:** P3-E4-S2-T2 (Product selector)

**Research Questions:**
1. Autocomplete vs modal vs dropdown?
2. How to show product details during selection?
3. Multi-select patterns?
4. Performance with large catalogs?

**Patterns to Evaluate:**
```typescript
// Option A: Autocomplete with preview
<AutocompleteWithPreview />

// Option B: Modal selector
<ProductSelectorModal />

// Option C: Inline table
<InlineProductTable />
```

---

### P3-E5-S0-T1: Research Activity/Audit Trail Patterns
**Time:** 2 hours
**Confidence Before:** 70%
**Required For:** P3-E5-S1-T1 (Activity tracking)

**Research Questions:**
1. Database triggers vs application layer?
2. Storage format (table vs JSONB)?
3. Query patterns for timeline views?
4. Retention strategies?

**Database Patterns:**
```sql
-- Option A: Triggers
CREATE TRIGGER audit_opportunities
AFTER UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Option B: Application layer
await logActivity('opportunity.updated', changes);
```

---

### P3-SPIKE-T1: Research Opportunity Cloning Methods
**Time:** 2 hours
**Confidence Before:** 75%
**Required For:** P3-E3-S3-T2 (Duplicate with campaign)

**Research Questions:**
1. Deep clone with relationships?
2. Selective field copying?
3. Batch cloning performance?
4. UI feedback patterns?

---

## Phase 4 Spikes (9 hours)

### P4-E2-S0-T1: Research Supabase Full-Text Search
**Time:** 3 hours
**Confidence Before:** 65%
**Required For:** P4-E2-S2-T2 (Search implementation)

**Research Questions:**
1. pg_trgm vs tsvector performance?
2. Index strategies for multiple tables?
3. Ranking and relevance tuning?
4. Real-time index updates?

**Test Queries:**
```sql
-- Option A: pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX ON contacts USING GIN (name gin_trgm_ops);

-- Option B: tsvector
ALTER TABLE contacts ADD COLUMN search_vector tsvector;
CREATE INDEX ON contacts USING GIN (search_vector);
```

**Success Criteria:**
- [ ] Benchmark both approaches
- [ ] Test with 10K records
- [ ] Measure index size
- [ ] Choose approach

---

### P4-E2-S0-T2: Design Search Query Parser
**Time:** 2 hours
**Confidence Before:** 45%
**Required For:** P4-E2-S1-T2 (Operator parser)

**Research Questions:**
1. PEG.js vs hand-written parser?
2. Operator precedence rules?
3. Quote handling strategies?
4. Error recovery patterns?

**Test Cases:**
```
"john smith" AND company:Acme
email:*@gmail.com OR phone:555*
-status:closed (tag:urgent OR priority:high)
```

---

### P4-E2-S0-T3: Research Search History Storage
**Time:** 2 hours
**Confidence Before:** 70%
**Required For:** P4-E2-S4-T1 (History schema)

**Research Questions:**
1. localStorage vs IndexedDB vs server?
2. Privacy/security implications?
3. Sync across devices?
4. Storage limits?

---

### P4-E2-S0-T4: Research Fuzzy Search Libraries
**Time:** 2 hours
**Confidence Before:** 65%
**Required For:** P4-E2-S3-T4 (Fuzzy matching)

**Libraries to Evaluate:**
- Fuse.js (client-side)
- PostgreSQL pg_trgm (server-side)
- Levenshtein distance
- Soundex/Metaphone

---

## Phase 5 Spikes (7 hours)

### P5-E4-S0-T1: Research Column Mapping UI Patterns
**Time:** 2 hours
**Confidence Before:** 60%
**Required For:** P5-E4-S1-T1 (Mapping UI)

**Research Questions:**
1. Drag-drop vs dropdown mapping?
2. Preview during mapping?
3. Saving mapping templates?
4. Auto-detection patterns?

**Reference Implementations:**
- Zapier field mapper
- Google Sheets import
- Airtable CSV import
- Excel Power Query

---

### P5-E4-S0-T2: Research CSV Encoding Detection
**Time:** 2 hours
**Confidence Before:** 70%
**Required For:** P5-E4-S1-T2 (Encoding detection)

**Research Questions:**
1. Browser FileReader encoding options?
2. BOM detection strategies?
3. Common encoding issues?
4. Library recommendations?

**Test Files Needed:**
- UTF-8 with BOM
- UTF-16
- ISO-8859-1
- Windows-1252

---

### P5-E4-S0-T3: Research Field Matching Algorithms
**Time:** 3 hours
**Confidence Before:** 60%
**Required For:** P5-E4-S2-T3 (Smart matching)

**Research Questions:**
1. Fuzzy string matching accuracy?
2. Synonym dictionaries?
3. ML-based matching?
4. Confidence scoring?

**Algorithm Comparison:**
```javascript
// Levenshtein distance
matchScore("email", "e-mail") // 0.8

// Token-based
matchScore("first_name", "fname") // 0.7

// Semantic similarity
matchScore("company", "organization") // 0.9
```

---

## Phase 6 Spikes (5 hours)

### P6-E1-S0-T1: Profile Current Performance
**Time:** 2 hours
**Confidence Before:** 75%
**Required For:** P6-E1-S2-T1 (Optimization)

**Measurement Points:**
1. Initial load time
2. Time to interactive
3. Bundle sizes
4. Database query times

**Tools:**
- Chrome DevTools Performance
- Lighthouse
- Bundle analyzer
- React DevTools Profiler

---

### P6-E2-S0-T1: Research Service Worker Patterns
**Time:** 3 hours
**Confidence Before:** 60%
**Required For:** P6-E2-S2-T1 (Service Worker)

**Research Questions:**
1. Workbox vs custom implementation?
2. Cache strategies for CRM?
3. Background sync patterns?
4. Update notification UX?

**Cache Strategies:**
```javascript
// Network First (for API)
// Cache First (for assets)
// Stale While Revalidate (for reports)
```

---

## Spike Execution Strategy

### 1. Schedule at Phase Start
Run spikes in first 2 days of each phase while planning rest of work.

### 2. Time-box Strictly
Set timer. When it expires, document findings even if incomplete.

### 3. Document in Spike Log
Create `SPIKE_LOG_P[N].md` for findings:
```markdown
## Spike ID: P2-E1-S0-T1
**Date:** 2024-XX-XX
**Time Spent:** 3 hours
**Recommendation:** Use downshift library
**Confidence After:** 85% (+20%)
**Key Findings:**
- Finding 1
- Finding 2
**Implementation Notes:**
- Note 1
- Note 2
```

### 4. Update Confidence
After spike, update related task confidence ratings.

### 5. Share Knowledge
Brief team on findings before implementation begins.

---

## Risk Mitigation Value

Spikes reduce risk by:
- **Validating feasibility** before commitment
- **Comparing options** systematically
- **Finding gotchas** early
- **Building team knowledge** gradually
- **Improving estimates** with data

**ROI:** 41 hours of research prevents ~200 hours of rework

---

## Anti-Patterns to Avoid

### ❌ DON'T
- Code production features during spike
- Extend time box "just 30 more minutes"
- Skip documentation
- Make final decisions alone
- Research everything perfectly

### ✅ DO
- Time-box strictly
- Document everything
- Make recommendations
- Share findings
- Accept "good enough"

---

*Schedule spikes early. Knowledge compounds. Uncertainty paralyzes.*