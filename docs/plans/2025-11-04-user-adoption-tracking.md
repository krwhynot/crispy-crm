# User Adoption Tracking Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track daily active users (DAU) and login frequency to measure #1 PRD success metric (100% team adoption in 60 days)

**Architecture:** Create database table for login tracking, dashboard widget showing adoption metrics, and queries for user activity analysis.

**Tech Stack:**
- Database: `user_activity_log` table (track logins)
- Dashboard widget: React component with Recharts
- Queries: Supabase RPC functions for DAU/WAU calculations

**Effort:** 3 days (includes RLS policies + GDPR compliance)
**Priority:** HIGH
**Current Status:** 0% (no DAU tracking exists)

**⚠️ Security:** Follows Engineering Constitution TWO-LAYER SECURITY - see [SECURITY-ADDENDUM.md](./SECURITY-ADDENDUM.md#critical-fix-1)

---

## Task 1: Create User Activity Tracking Table

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_create_user_activity_log.sql`

### Step 1: Create migration file

```bash
npx supabase migration new create_user_activity_log
```

### Step 2: Write migration SQL

**File:** `supabase/migrations/*_create_user_activity_log.sql`

```sql
-- User Activity Log Table for adoption tracking
CREATE TABLE IF NOT EXISTS user_activity_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'page_view')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast DAU queries
CREATE INDEX idx_user_activity_log_user_date ON user_activity_log(user_id, DATE(created_at));
CREATE INDEX idx_user_activity_log_type_date ON user_activity_log(activity_type, DATE(created_at));

-- TWO-LAYER SECURITY (Engineering Constitution #7)
-- Layer 1: GRANT permissions
GRANT SELECT, INSERT ON user_activity_log TO authenticated;
GRANT USAGE ON SEQUENCE user_activity_log_id_seq TO authenticated;

-- Layer 2: RLS policies
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY select_own_activity ON user_activity_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own activity
CREATE POLICY insert_own_activity ON user_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all activity (for adoption metrics dashboard)
CREATE POLICY admin_select_all_activity ON user_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.user_id = auth.uid()
      AND sales.role = 'admin'
    )
  );

-- GDPR Compliance: Auto-delete logs after 90 days
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_activity_logs IS 'GDPR: Auto-delete activity logs after 90 days retention period';

-- RPC function: Get Daily Active Users count
CREATE OR REPLACE FUNCTION get_daily_active_users(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  user_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as user_count
  FROM user_activity_log
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND activity_type = 'login'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

-- RPC function: Get user last login
CREATE OR REPLACE FUNCTION get_user_last_logins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  last_login TIMESTAMPTZ,
  days_since_login INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id as user_id,
    au.email,
    MAX(ual.created_at) as last_login,
    EXTRACT(DAY FROM NOW() - MAX(ual.created_at))::INTEGER as days_since_login
  FROM auth.users au
  LEFT JOIN user_activity_log ual ON ual.user_id = au.id AND ual.activity_type = 'login'
  GROUP BY au.id, au.email
  ORDER BY last_login DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_daily_active_users(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_last_logins() TO authenticated;
```

### Step 3: Apply migration locally

```bash
npm run db:local:reset
```

### Step 4: Test RPC functions

```bash
psql $DATABASE_URL -c "SELECT * FROM get_daily_active_users(7);"
psql $DATABASE_URL -c "SELECT * FROM get_user_last_logins() LIMIT 5;"
```

### Step 5: Commit migration

```bash
git add supabase/migrations/*_create_user_activity_log.sql
git commit -m "feat: add user activity tracking for adoption metrics

- Create user_activity_log table with RLS policies
- Add RPC functions for DAU calculation
- Add get_user_last_logins() for activity monitoring
- Index on user_id and date for fast queries

🤖 Generated with Claude Code"
```

---

## Task 2: Track Login Events

**Files:**
- Create: `src/lib/tracking/userActivity.ts`
- Modify: `src/atomic-crm/providers/supabase/authProvider.ts`

### Step 6: Create activity tracking utility

**File:** `src/lib/tracking/userActivity.ts`

```typescript
import { supabaseClient } from '../../atomic-crm/providers/supabase/supabase'

export async function trackUserActivity(
  activityType: 'login' | 'logout' | 'page_view',
  metadata: Record<string, any> = {},
): Promise<void> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) return

    await supabaseClient.from('user_activity_log').insert({
      user_id: user.id,
      activity_type: activityType,
      metadata,
    })
  } catch (error) {
    console.warn('[User Activity] Failed to track:', error)
    // Don't throw - tracking failures shouldn't break app
  }
}
```

### Step 7: Track login in authProvider

**File:** `src/atomic-crm/providers/supabase/authProvider.ts`

**Import tracking:**
```typescript
import { trackUserActivity } from '../../../lib/tracking/userActivity'
```

**In login method, after successful auth:**
```typescript
login: async ({ username, password }) => {
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: username,
    password,
  })

  if (error) throw error

  // Track successful login
  await trackUserActivity('login')

  return Promise.resolve()
},
```

**In logout method:**
```typescript
logout: async () => {
  await trackUserActivity('logout')
  const { error } = await supabaseClient.auth.signOut()
  if (error) throw error
  return Promise.resolve()
},
```

### Step 8: Test login tracking

```bash
npm run dev
```

Login to app, then check database:

```bash
psql $DATABASE_URL -c "SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 5;"
```

### Step 9: Commit tracking implementation

```bash
git add src/lib/tracking/userActivity.ts
git add src/atomic-crm/providers/supabase/authProvider.ts
git commit -m "feat: implement login/logout activity tracking

- Create trackUserActivity utility function
- Track login events in authProvider
- Track logout events in authProvider
- Graceful failure handling (don't break auth flow)

🤖 Generated with Claude Code"
```

---

## Task 3: Create User Adoption Dashboard Widget

**Files:**
- Create: `src/atomic-crm/dashboard/UserAdoptionWidget.tsx`
- Modify: `src/atomic-crm/dashboard/Dashboard.tsx`

### Step 10: Create widget component

**File:** `src/atomic-crm/dashboard/UserAdoptionWidget.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Card, CardContent, Typography, Box, Alert } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabaseClient } from '../providers/supabase/supabase'

interface DAUData {
  date: string
  user_count: number
}

export function UserAdoptionWidget() {
  const [dauData, setDauData] = useState<DAUData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDAUData()
  }, [])

  async function loadDAUData() {
    try {
      const { data, error } = await supabaseClient.rpc('get_daily_active_users', {
        days_back: 30,
      })

      if (error) throw error

      setDauData(data.reverse()) // Oldest to newest for chart
      setLoading(false)
    } catch (err: any) {
      console.error('[UserAdoption] Failed to load DAU:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent>Loading...</CardContent></Card>
  if (error) return <Card><CardContent><Alert severity="error">{error}</Alert></CardContent></Card>

  const latestDAU = dauData[dauData.length - 1]?.user_count || 0
  const weekAgoDAU = dauData[dauData.length - 8]?.user_count || 0
  const trend = latestDAU - weekAgoDAU

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          User Adoption
        </Typography>

        <Box display="flex" alignItems="baseline" gap={1} mb={2}>
          <Typography variant="h3">{latestDAU}</Typography>
          <Typography variant="body2" color="text.secondary">
            Daily Active Users
          </Typography>
        </Box>

        {trend !== 0 && (
          <Typography
            variant="body2"
            color={trend > 0 ? 'success.main' : 'error.main'}
            gutterBottom
          >
            {trend > 0 ? '+' : ''}{trend} vs last week
          </Typography>
        )}

        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={dauData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="user_count"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Last 30 days • Goal: 100% team adoption in 60 days
        </Typography>
      </CardContent>
    </Card>
  )
}
```

### Step 11: Add widget to dashboard

**File:** `src/atomic-crm/dashboard/Dashboard.tsx`

**Import widget:**
```typescript
import { UserAdoptionWidget } from './UserAdoptionWidget'
```

**Add to dashboard grid (in appropriate position):**
```typescript
<Grid item xs={12} md={6} lg={4}>
  <UserAdoptionWidget />
</Grid>
```

### Step 12: Test widget display

```bash
npm run dev
```

Navigate to dashboard, verify:
- Widget displays DAU count
- Chart shows 30-day trend
- Trend indicator (vs last week) appears

### Step 13: Commit widget

```bash
git add src/atomic-crm/dashboard/UserAdoptionWidget.tsx
git add src/atomic-crm/dashboard/Dashboard.tsx
git commit -m "feat: add User Adoption dashboard widget

- Display daily active users (DAU) count
- Show 30-day trend chart with Recharts
- Compare to last week (trend indicator)
- Load data from get_daily_active_users RPC function

Measures #1 PRD success metric: 100% team adoption in 60 days

🤖 Generated with Claude Code"
```

---

## Verification Checklist

- ✅ Database migration created and applied
- ✅ RPC functions for DAU calculation work
- ✅ Login/logout tracking implemented
- ✅ Activity logged to user_activity_log table
- ✅ Dashboard widget displays DAU count
- ✅ 30-day trend chart renders
- ✅ Tests passing
- ✅ Git commits created

---

**Plan Status:** ✅ Ready for execution
**Estimated Time:** 2 days
**Impact:** HIGH (enables measuring #1 PRD success metric)
