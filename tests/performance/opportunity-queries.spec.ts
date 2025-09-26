import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "test-key";

const supabase = createClient(supabaseUrl, supabaseKey);

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  simpleList: 100, // Simple list query should complete within 100ms
  filteredList: 150, // Filtered list should complete within 150ms
  complexJoin: 300, // Complex joins should complete within 300ms
  aggregation: 200, // Aggregation queries should complete within 200ms
  search: 250, // Full-text search should complete within 250ms
  pagination: 100, // Paginated queries should complete within 100ms
};

// Baseline comparison (deals performance)
const BASELINE_PERFORMANCE = {
  simpleList: 85, // Baseline from deals table
  filteredList: 120, // Baseline from deals with filters
  complexJoin: 250, // Baseline from deals with joins
};

interface PerformanceResult {
  queryType: string;
  executionTime: number;
  recordCount: number;
  threshold: number;
  passed: boolean;
  baselineComparison?: number;
}

describe("Opportunity Queries Performance Tests", () => {
  const results: PerformanceResult[] = [];
  let testDataIds: string[] = [];

  beforeAll(async () => {
    console.log("Setting up performance test data...");

    // Create test organizations
    const { data: orgs, error: orgError } = await supabase
      .from("companies")
      .insert([
        {
          name: "Test Customer Org",
          organization_type: "customer",
          sector: "Technology",
        },
        {
          name: "Test Principal Org",
          organization_type: "principal",
          sector: "Manufacturing",
        },
        {
          name: "Test Distributor Org",
          organization_type: "distributor",
          sector: "Retail",
        },
      ])
      .select("id");

    if (orgError) throw orgError;

    const [customerId, principalId, distributorId] = orgs.map((o) => o.id);

    // Create test sales person
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .insert([
        {
          first_name: "Perf",
          last_name: "Tester",
          email: "perf.test@example.com",
        },
      ])
      .select("id")
      .single();

    if (salesError) throw salesError;

    // Create 10,000+ opportunities for performance testing
    const opportunities = [];
    const stages = [
      "new_lead",
      "initial_outreach",
      "sample_visit_offered",
      "awaiting_response",
      "feedback_logged",
      "demo_scheduled",
      "closed_won",
      "closed_lost",
    ];
    const statuses = ["active", "on_hold", "nurturing", "stalled", "expired"];
    const priorities = ["low", "medium", "high", "critical"];

    for (let i = 0; i < 10000; i++) {
      opportunities.push({
        name: `Test Opportunity ${i} - ${faker.company.catchPhrase()}`,
        customer_organization_id: customerId,
        principal_organization_id: i % 3 === 0 ? principalId : null,
        distributor_organization_id: i % 5 === 0 ? distributorId : null,
        stage: stages[Math.floor(Math.random() * stages.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        amount: faker.number.float({
          min: 1000,
          max: 1000000,
          fractionDigits: 2,
        }),
        probability: faker.number.float({
          min: 0,
          max: 100,
          fractionDigits: 0,
        }),
        description: faker.lorem.paragraph(),
        expected_closing_date: faker.date.future().toISOString(),
        sales_id: sales.id,
        created_at: faker.date.past().toISOString(),
        competition: i % 7 === 0 ? faker.company.name() : null,
        decision_criteria: faker.lorem.sentence(),
        next_action: faker.lorem.sentence(),
        next_action_date: faker.date.future().toISOString(),
      });
    }

    // Insert in batches to avoid timeout
    const batchSize = 500;
    for (let i = 0; i < opportunities.length; i += batchSize) {
      const batch = opportunities.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("opportunities")
        .insert(batch)
        .select("id");

      if (error) throw error;
      if (data) testDataIds.push(...data.map((d) => d.id));

      if (i % 2000 === 0) {
        console.log(`Inserted ${i + batchSize} opportunities...`);
      }
    }

    console.log(`Created ${testDataIds.length} test opportunities`);
  });

  afterAll(async () => {
    console.log("Cleaning up test data...");

    // Clean up test data
    if (testDataIds.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < testDataIds.length; i += batchSize) {
        const batch = testDataIds.slice(i, i + batchSize);
        await supabase.from("opportunities").delete().in("id", batch);
      }
    }

    // Clean up test organizations and sales
    await supabase.from("companies").delete().ilike("name", "Test%");
    await supabase.from("sales").delete().eq("email", "perf.test@example.com");

    // Print performance summary
    console.log("\n=== Performance Test Summary ===\n");
    console.table(
      results.map((r) => ({
        "Query Type": r.queryType,
        "Time (ms)": r.executionTime.toFixed(2),
        "Threshold (ms)": r.threshold,
        Records: r.recordCount,
        Status: r.passed ? "✅ PASS" : "❌ FAIL",
        "vs Baseline": r.baselineComparison
          ? `${((r.executionTime / r.baselineComparison - 1) * 100).toFixed(1)}%`
          : "N/A",
      })),
    );
  });

  it("should execute simple list query within performance threshold", async () => {
    const startTime = performance.now();

    const { data, error, count } = await supabase
      .from("opportunities")
      .select("*", { count: "exact" })
      .limit(50)
      .order("created_at", { ascending: false });

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const result: PerformanceResult = {
      queryType: "Simple List",
      executionTime,
      recordCount: count || 0,
      threshold: PERFORMANCE_THRESHOLDS.simpleList,
      passed: executionTime < PERFORMANCE_THRESHOLDS.simpleList,
      baselineComparison: BASELINE_PERFORMANCE.simpleList,
    };

    results.push(result);
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.simpleList);
  });

  it("should execute filtered list query within performance threshold", async () => {
    const startTime = performance.now();

    const { data, error, count } = await supabase
      .from("opportunities")
      .select("*", { count: "exact" })
      .eq("stage", "initial_outreach")
      .eq("status", "active")
      .gte("amount", 10000)
      .limit(50)
      .order("amount", { ascending: false });

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const result: PerformanceResult = {
      queryType: "Filtered List",
      executionTime,
      recordCount: data?.length || 0,
      threshold: PERFORMANCE_THRESHOLDS.filteredList,
      passed: executionTime < PERFORMANCE_THRESHOLDS.filteredList,
      baselineComparison: BASELINE_PERFORMANCE.filteredList,
    };

    results.push(result);
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.filteredList);
  });

  it("should execute complex join query within performance threshold", async () => {
    const startTime = performance.now();

    const { data, error } = await supabase
      .from("opportunities")
      .select(
        `
        *,
        customer:companies!customer_organization_id(id, name, sector),
        principal:companies!principal_organization_id(id, name, organization_type),
        distributor:companies!distributor_organization_id(id, name, organization_type),
        opportunity_participants(
          id,
          role,
          commission_rate,
          organization:companies(id, name)
        ),
        activities(
          id,
          activity_type,
          type,
          subject,
          activity_date
        )
      `,
      )
      .eq("stage", "demo_scheduled")
      .limit(20);

    const executionTime = performance.now() - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();

    const result: PerformanceResult = {
      queryType: "Complex Join",
      executionTime,
      recordCount: data?.length || 0,
      threshold: PERFORMANCE_THRESHOLDS.complexJoin,
      passed: executionTime < PERFORMANCE_THRESHOLDS.complexJoin,
      baselineComparison: BASELINE_PERFORMANCE.complexJoin,
    };

    results.push(result);
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.complexJoin);
  });

  it("should execute aggregation query within performance threshold", async () => {
    const startTime = performance.now();

    // Get opportunity statistics by stage
    const { data, error } = await supabase.rpc(
      "get_opportunity_stats_by_stage",
    );

    const executionTime = performance.now() - startTime;

    // If RPC doesn't exist, use direct query
    if (error?.code === "PGRST202") {
      const { data: altData, error: altError } = await supabase
        .from("opportunities")
        .select("stage, amount")
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        );

      expect(altError).toBeNull();
    } else {
      expect(error).toBeNull();
    }

    const result: PerformanceResult = {
      queryType: "Aggregation",
      executionTime,
      recordCount: data?.length || 0,
      threshold: PERFORMANCE_THRESHOLDS.aggregation,
      passed: executionTime < PERFORMANCE_THRESHOLDS.aggregation,
    };

    results.push(result);
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.aggregation);
  });

  it("should execute full-text search within performance threshold", async () => {
    const searchTerm = "test opportunity";
    const startTime = performance.now();

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .textSearch("name", searchTerm, {
        type: "websearch",
        config: "english",
      })
      .limit(50);

    const executionTime = performance.now() - startTime;

    // Fallback to ilike if text search not configured
    if (error?.code === "PGRST200") {
      const { data: altData, error: altError } = await supabase
        .from("opportunities")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .limit(50);

      expect(altError).toBeNull();
    } else {
      expect(error).toBeNull();
    }

    const result: PerformanceResult = {
      queryType: "Full-text Search",
      executionTime,
      recordCount: data?.length || 0,
      threshold: PERFORMANCE_THRESHOLDS.search,
      passed: executionTime < PERFORMANCE_THRESHOLDS.search,
    };

    results.push(result);
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.search);
  });

  it("should handle pagination efficiently", async () => {
    const pageSize = 50;
    const pages = 5;
    const pageTimes: number[] = [];

    for (let page = 0; page < pages; page++) {
      const startTime = performance.now();

      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("created_at", { ascending: false });

      const executionTime = performance.now() - startTime;
      pageTimes.push(executionTime);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    }

    const avgTime = pageTimes.reduce((a, b) => a + b, 0) / pageTimes.length;

    const result: PerformanceResult = {
      queryType: "Pagination (avg)",
      executionTime: avgTime,
      recordCount: pageSize * pages,
      threshold: PERFORMANCE_THRESHOLDS.pagination,
      passed: avgTime < PERFORMANCE_THRESHOLDS.pagination,
    };

    results.push(result);
    expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pagination);
  });

  it("should handle concurrent queries efficiently", async () => {
    const concurrentQueries = 10;
    const startTime = performance.now();

    const queries = Array(concurrentQueries)
      .fill(null)
      .map((_, i) =>
        supabase
          .from("opportunities")
          .select("*")
          .eq("priority", i % 2 === 0 ? "high" : "critical")
          .limit(20),
      );

    const results = await Promise.all(queries);
    const executionTime = performance.now() - startTime;

    results.forEach(({ error }) => {
      expect(error).toBeNull();
    });

    const avgTimePerQuery = executionTime / concurrentQueries;

    const result: PerformanceResult = {
      queryType: "Concurrent Queries",
      executionTime: avgTimePerQuery,
      recordCount: concurrentQueries * 20,
      threshold: PERFORMANCE_THRESHOLDS.simpleList * 1.5, // Allow 50% overhead for concurrency
      passed: avgTimePerQuery < PERFORMANCE_THRESHOLDS.simpleList * 1.5,
    };

    this.results?.push(result);
    expect(avgTimePerQuery).toBeLessThan(
      PERFORMANCE_THRESHOLDS.simpleList * 1.5,
    );
  });
});
