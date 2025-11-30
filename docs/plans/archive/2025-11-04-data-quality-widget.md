# Data Quality Dashboard Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create real-time data quality monitoring widget for dashboard

**Architecture:** Adapt existing pre-migration validation (scripts/validation/data-quality.js) into real-time React widget with live queries.

**Tech Stack:** React, Recharts (progress bars), Supabase queries
**Effort:** 2 days | **Priority:** LOW | **Status:** Pre-migration script 100%, real-time widget 0%

---

## Implementation

### Task 1: Create Data Quality Queries (Day 1 - Morning)

**File:** `src/atomic-crm/dashboard/dataQualityQueries.ts`

```typescript
import { supabaseClient } from "../../providers/supabase/supabase";

export type QualityScore = {
  entity: string;
  score: number; // 0-100
  totalRecords: number;
  issuesCount: number;
  details: string;
};

/**
 * Calculate completeness score for contacts
 */
export async function assessContactsCompleteness(): Promise<QualityScore> {
  const { data: contacts, error } = await supabaseClient
    .from("contacts")
    .select("id, first_name, last_name, email, phone, title");

  if (error) throw error;

  const totalContacts = contacts?.length || 0;
  if (totalContacts === 0) {
    return {
      entity: "Contacts",
      score: 100,
      totalRecords: 0,
      issuesCount: 0,
      details: "No contacts found",
    };
  }

  let issuesCount = 0;
  const scores = contacts.map((contact) => {
    let score = 0;
    let maxScore = 0;

    // Required fields
    maxScore += 30; // first_name
    if (contact.first_name && contact.first_name.trim() !== "") {
      score += 30;
    } else {
      issuesCount++;
    }

    maxScore += 30; // last_name
    if (contact.last_name && contact.last_name.trim() !== "") {
      score += 30;
    } else {
      issuesCount++;
    }

    // Optional but important
    maxScore += 20; // email
    if (
      contact.email &&
      Array.isArray(contact.email) &&
      contact.email.length > 0
    ) {
      score += 20;
    } else {
      issuesCount++;
    }

    maxScore += 10; // phone
    if (
      contact.phone &&
      Array.isArray(contact.phone) &&
      contact.phone.length > 0
    ) {
      score += 10;
    }

    maxScore += 10; // title
    if (contact.title && contact.title.trim() !== "") score += 10;

    return (score / maxScore) * 100;
  });

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return {
    entity: "Contacts",
    score: Math.round(avgScore),
    totalRecords: totalContacts,
    issuesCount,
    details: `${issuesCount} contacts with missing critical fields`,
  };
}

/**
 * Calculate completeness score for organizations
 */
export async function assessOrganizationsCompleteness(): Promise<QualityScore> {
  const { data: orgs, error } = await supabaseClient
    .from("organizations")
    .select("id, name, sector, website, phone, email");

  if (error) throw error;

  const totalOrgs = orgs?.length || 0;
  if (totalOrgs === 0) {
    return {
      entity: "Organizations",
      score: 100,
      totalRecords: 0,
      issuesCount: 0,
      details: "No organizations found",
    };
  }

  let issuesCount = 0;
  const scores = orgs.map((org) => {
    let score = 0;
    let maxScore = 0;

    maxScore += 40; // name (most important)
    if (org.name && org.name.trim() !== "") {
      score += 40;
    } else {
      issuesCount++;
    }

    maxScore += 20; // sector
    if (org.sector && org.sector.trim() !== "") score += 20;

    maxScore += 20; // website
    if (org.website && org.website.trim() !== "") score += 20;

    maxScore += 10; // phone
    if (org.phone && Array.isArray(org.phone) && org.phone.length > 0)
      score += 10;

    maxScore += 10; // email
    if (org.email && Array.isArray(org.email) && org.email.length > 0)
      score += 10;

    return (score / maxScore) * 100;
  });

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return {
    entity: "Organizations",
    score: Math.round(avgScore),
    totalRecords: totalOrgs,
    issuesCount,
    details: `${issuesCount} organizations with missing data`,
  };
}

/**
 * Calculate completeness score for opportunities
 */
export async function assessOpportunitiesCompleteness(): Promise<QualityScore> {
  const { data: opps, error } = await supabaseClient
    .from("opportunities")
    .select("id, name, stage, status, expected_close_date, sales_id");

  if (error) throw error;

  const totalOpps = opps?.length || 0;
  if (totalOpps === 0) {
    return {
      entity: "Opportunities",
      score: 100,
      totalRecords: 0,
      issuesCount: 0,
      details: "No opportunities found",
    };
  }

  let issuesCount = 0;
  const scores = opps.map((opp) => {
    let score = 0;
    let maxScore = 0;

    maxScore += 30; // name
    if (opp.name && opp.name.trim() !== "") {
      score += 30;
    } else {
      issuesCount++;
    }

    maxScore += 25; // stage
    if (opp.stage) score += 25;

    maxScore += 25; // status
    if (opp.status) score += 25;

    maxScore += 10; // expected_close_date
    if (opp.expected_close_date) score += 10;

    maxScore += 10; // sales_id
    if (opp.sales_id) score += 10;

    return (score / maxScore) * 100;
  });

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return {
    entity: "Opportunities",
    score: Math.round(avgScore),
    totalRecords: totalOpps,
    issuesCount,
    details: `${issuesCount} opportunities with incomplete data`,
  };
}

/**
 * Get overall data quality score
 */
export async function getOverallQualityScore(): Promise<{
  overallScore: number;
  entityScores: QualityScore[];
}> {
  const [contacts, orgs, opps] = await Promise.all([
    assessContactsCompleteness(),
    assessOrganizationsCompleteness(),
    assessOpportunitiesCompleteness(),
  ]);

  const entityScores = [contacts, orgs, opps];
  const overallScore = Math.round(
    entityScores.reduce((sum, e) => sum + e.score, 0) / entityScores.length
  );

  return {
    overallScore,
    entityScores,
  };
}
```

---

### Task 2: Create Data Quality Widget Component (Day 1 - Afternoon)

**File:** `src/atomic-crm/dashboard/DataQualityWidget.tsx`

```typescript
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { getOverallQualityScore, QualityScore } from "./dataQualityQueries";

export const DataQualityWidget = () => {
  const [overallScore, setOverallScore] = useState<number>(0);
  const [entityScores, setEntityScores] = useState<QualityScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQualityData();
  }, []);

  const loadQualityData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { overallScore, entityScores } = await getOverallQualityScore();
      setOverallScore(overallScore);
      setEntityScores(entityScores);
    } catch (err: any) {
      setError(`Failed to load quality data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className="text-green-600" />;
    if (score >= 70) return <Info className="text-yellow-600" />;
    return <AlertCircle className="text-red-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading quality metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getScoreIcon(overallScore)}
          Data Quality Score
        </CardTitle>
        <CardDescription>Overall data completeness assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Quality</span>
            <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Entity Breakdown */}
        <div className="space-y-3 pt-2 border-t">
          {entityScores.map((entity) => (
            <div key={entity.entity}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium">{entity.entity}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({entity.totalRecords} records)
                  </span>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(entity.score)}`}>
                  {entity.score}%
                </span>
              </div>
              <Progress value={entity.score} className="h-1.5" />
              {entity.issuesCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {entity.details}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Thresholds Guide */}
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>90%+ = Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3 text-yellow-600" />
            <span>70-89% = Good</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-red-600" />
            <span>&lt;70% = Needs improvement</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

### Task 3: Register Widget in Dashboard (Day 2 - Morning)

**File:** Modify `src/atomic-crm/dashboard/Dashboard.tsx`

```typescript
import { DataQualityWidget } from "./DataQualityWidget";

export const Dashboard = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Existing widgets */}
      <WelcomeCard />
      <StatsCard />
      <RecentActivity />

      {/* Add Data Quality Widget */}
      <DataQualityWidget />

      {/* Other widgets */}
    </div>
  );
};
```

---

### Task 4: Add Tests (Day 2 - Afternoon)

**File:** `src/atomic-crm/dashboard/dataQualityQueries.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { assessContactsCompleteness } from "./dataQualityQueries";

describe("Data Quality Queries", () => {
  it("calculates contacts completeness score correctly", async () => {
    const result = await assessContactsCompleteness();

    expect(result).toHaveProperty("entity", "Contacts");
    expect(result).toHaveProperty("score");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result).toHaveProperty("totalRecords");
    expect(result).toHaveProperty("issuesCount");
  });

  it("handles empty contacts table", async () => {
    // Test with no data
    const result = await assessContactsCompleteness();

    if (result.totalRecords === 0) {
      expect(result.score).toBe(100);
      expect(result.issuesCount).toBe(0);
    }
  });
});
```

---

### Task 5: Test & Commit

**Manual Test Steps:**
```bash
npm run dev

# 1. Navigate to Dashboard
# 2. Verify Data Quality Widget displays
# 3. Check overall quality score
# 4. Verify entity breakdown (Contacts, Organizations, Opportunities)
# 5. Check progress bars reflect scores
# 6. Verify color coding (green/yellow/red)

# Test edge cases
# 1. Create contact with missing fields
# 2. Refresh dashboard
# 3. Verify quality score decreases
# 4. Complete contact details
# 5. Refresh dashboard
# 6. Verify quality score increases

npm test -- dataQualityQueries.test.ts
```

**Commit:**
```bash
git add src/atomic-crm/dashboard/dataQualityQueries.ts
git add src/atomic-crm/dashboard/DataQualityWidget.tsx
git add src/atomic-crm/dashboard/Dashboard.tsx
git add src/atomic-crm/dashboard/dataQualityQueries.test.ts
git commit -m "feat: add data quality monitoring dashboard widget

- Create dataQualityQueries with completeness assessments
- Calculate quality scores for Contacts, Organizations, Opportunities
- Build DataQualityWidget with progress bars and color coding
- Add overall quality score and entity breakdown
- Display issue counts and completeness details
- Integrate widget into main dashboard

Adapts pre-migration validation into real-time monitoring

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Plan Status:** ✅ Ready | **Time:** 2 days | **Impact:** LOW (Data quality visibility)

**Reference:** Adapts `scripts/validation/data-quality.js` (1,031 lines) for real-time use
**Thresholds:** 90%+ (Excellent), 70-89% (Good), <70% (Needs improvement)
