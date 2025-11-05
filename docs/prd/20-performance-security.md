---
**Part of:** Atomic CRM Product Requirements Document
**Category:** Technical Specifications
**Document:** 20-performance-security.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🗄️ [Data Architecture](./02-data-architecture.md)
- 💻 [Technology Stack](./18-tech-stack.md)
- 🔌 [API Design](./19-api-design.md)
- 🚀 [Monitoring & Deployment](./21-monitoring-deployment.md)
- 👥 [User Management & Permissions](./11-user-management.md)
---

# 20. Performance & Security

## 5.3 Performance Requirements

**Target Metrics (Production):**
- **Page load: < 2 seconds** (First Contentful Paint)
- **Time to Interactive: < 3 seconds**
- **Interactions: < 500ms** response time
- **API response: < 300ms** (p95)
- **Search response: < 500ms** (including full-text search)
- **Form submission: < 1 second** (including validation)
- **Dashboard refresh: < 2 seconds**
- **Lighthouse Performance Score: > 85**

**Optimization Strategies:**
- Code splitting by route
- Lazy loading for modals, large components
- Virtual scrolling for long lists (react-window)
- Image optimization and lazy loading
- API response caching (TanStack Query)
- Debounced search inputs (300ms)
- Optimistic UI updates for mutations
- Service Worker for static asset caching
- Prefetch critical resources

**Performance Monitoring:**
- Real User Monitoring (RUM) with Web Vitals
- Track Core Web Vitals: LCP, FID, CLS
- Alert if p95 exceeds targets
- Weekly performance reports

## 5.4 Offline Mode (Read-Only)

**Offline Capabilities:**
- **Read-only offline mode** for viewing cached data
- No create/edit/delete operations offline
- Clear "Offline" indicator in UI header
- Automatic reconnection detection

**Cached Data:**
- Last 100 viewed records per module
- User's dashboard data
- Recent search results
- Navigation structure and menus
- Static assets (CSS, JS, images)

**Implementation:**
- Service Worker with Cache API
- IndexedDB for structured data
- Background sync when online
- Cache expires after 24 hours
- "Last synced" timestamp visible

**Offline UI Behavior:**
- Grayed out action buttons (Create, Edit, Delete)
- "Offline Mode" banner at top
- Cached data marked with clock icon
- "Retry" button for failed requests
- Queue navigation for when online

## 5.5 Security Requirements

**Authentication:**
- JWT tokens with 15-minute expiration
- Refresh tokens with 30-day expiration (HTTP-only cookie)
- Token rotation on refresh
- **Sessions never expire** (stay logged in indefinitely)

**Authorization:**
- Role-based access control (RBAC) enforced server-side
- Permission checks on all API endpoints
- Frontend hides UI elements based on role (defense in depth)

**Data Protection:**
- **HTTPS required for all requests**
- **Password hashing with bcrypt**
- **Basic privacy compliance only** (no GDPR/CCPA requirements)
- API rate limiting (100 requests/minute per user)
- Input validation and sanitization (SQL injection prevention)
- XSS prevention (React escapes by default, careful with dangerouslySetInnerHTML)
- CSRF protection (CSRF tokens for state-changing requests)

**Password Policy:**
- **No password requirements** (user's choice)
- Any length, any characters accepted
- No complexity requirements
- No password expiration
- No password history
- Bcrypt hashing (cost factor 12)
- Password reset tokens expire in 1 hour

**Data Validation Strategy:**
- **Backend validation only** (single source of truth)
- No frontend validation (except basic HTML5 attributes)
- All validation rules in Supabase/PostgreSQL layer
- Return user-friendly error messages with codes

## 5.6 Error Handling

**Error Display:**
- **User-friendly messages with error codes**
- Format: "Unable to save organization (E1001)"
- Error dictionary maintained for support reference
- No technical details exposed to users
- Log full errors server-side only

**Failed Operations:**
- **Simple error display, user must retry manually**
- No automatic retry logic
- No operation queuing
- Clear error message with retry button
- Lost work prevention through auto-save drafts

**Error Codes:**
- E1xxx: Authentication/Authorization errors
- E2xxx: Validation errors
- E3xxx: Database errors
- E4xxx: Network/connectivity errors
- E5xxx: Business logic errors
