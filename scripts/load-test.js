#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import ora from "ora";
import chalk from "chalk";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error(
    chalk.red("Error: VITE_SUPABASE_ANON_KEY environment variable is required"),
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load test configuration
const LOAD_TEST_CONFIG = {
  concurrentUsers: parseInt(process.argv[2]) || 10, // Number of concurrent users
  testDuration: parseInt(process.argv[3]) || 60, // Test duration in seconds
  requestsPerSecond: parseInt(process.argv[4]) || 5, // Requests per second per user
  rampUpTime: 10, // Ramp-up time in seconds
};

// Performance metrics storage
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errorsByType: {},
  requestsByEndpoint: {},
  concurrentConnections: 0,
  peakConcurrency: 0,
  startTime: null,
  endTime: null,
};

// Endpoint definitions with relative weights
const ENDPOINTS = [
  { name: "List Opportunities", weight: 30, fn: listOpportunities },
  { name: "Get Opportunity Details", weight: 20, fn: getOpportunityDetails },
  { name: "List Contacts", weight: 15, fn: listContacts },
  {
    name: "Get Contact with Orgs",
    weight: 10,
    fn: getContactWithOrganizations,
  },
  { name: "List Companies", weight: 10, fn: listCompanies },
  { name: "Search Opportunities", weight: 5, fn: searchOpportunities },
  { name: "Dashboard Aggregations", weight: 5, fn: getDashboardData },
  { name: "Complex Join Query", weight: 3, fn: complexJoinQuery },
  { name: "Create Activity", weight: 2, fn: createActivity },
];

// Calculate cumulative weights for random selection
let cumulativeWeight = 0;
const weightedEndpoints = ENDPOINTS.map((endpoint) => {
  cumulativeWeight += endpoint.weight;
  return { ...endpoint, cumulativeWeight };
});

// Helper function to select random endpoint based on weights
function selectRandomEndpoint() {
  const random = Math.random() * cumulativeWeight;
  return weightedEndpoints.find((e) => e.cumulativeWeight >= random);
}

// Endpoint implementations
async function listOpportunities() {
  const stages = ["lead", "qualified", "proposal", "negotiation"];
  const randomStage = faker.helpers.arrayElement(stages);

  const { data, error } = await supabase
    .from("opportunities")
    .select("*", { count: "exact" })
    .eq("stage", randomStage)
    .limit(50)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data, count: data?.length || 0 };
}

async function getOpportunityDetails() {
  // First get a random opportunity ID
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id")
    .limit(100);

  if (!opportunities || opportunities.length === 0) {
    throw new Error("No opportunities found");
  }

  const randomId = faker.helpers.arrayElement(opportunities).id;

  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      customer:companies!customer_organization_id(id, name),
      principal:companies!principal_organization_id(id, name),
      distributor:companies!distributor_organization_id(id, name),
      opportunity_participants(
        role,
        commission_rate,
        organization:companies(name)
      )
    `,
    )
    .eq("id", randomId)
    .single();

  if (error) throw error;
  return { data };
}

async function listContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      *,
      company:companies!company_id(name),
      contact_organizations(
        organization:companies(name, organization_type)
      )
    `,
    )
    .limit(30)
    .order("last_seen", { ascending: false });

  if (error) throw error;
  return { data, count: data?.length || 0 };
}

async function getContactWithOrganizations() {
  // Get a random contact
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id")
    .limit(100);

  if (!contacts || contacts.length === 0) {
    throw new Error("No contacts found");
  }

  const randomId = faker.helpers.arrayElement(contacts).id;

  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      *,
      contact_organizations(
        is_primary_contact,
        purchase_influence,
        role,
        organization:companies(
          id,
          name,
          organization_type,
          sector
        )
      )
    `,
    )
    .eq("id", randomId)
    .single();

  if (error) throw error;
  return { data };
}

async function listCompanies() {
  const types = ["customer", "principal", "distributor"];
  const randomType = faker.helpers.arrayElement(types);

  const { data, error } = await supabase
    .from("companies")
    .select("*", { count: "exact" })
    .eq("organization_type", randomType)
    .limit(25)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data, count: data?.length || 0 };
}

async function searchOpportunities() {
  const searchTerms = ["proposal", "contract", "meeting", "demo", "pilot"];
  const searchTerm = faker.helpers.arrayElement(searchTerms);

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .ilike("name", `%${searchTerm}%`)
    .limit(20);

  if (error) throw error;
  return { data, count: data?.length || 0 };
}

async function getDashboardData() {
  // Simulate dashboard aggregation queries
  const queries = await Promise.all([
    // Opportunities by stage
    supabase.from("opportunities").select("stage").eq("status", "active"),

    // Recent activities
    supabase
      .from("activities")
      .select("*")
      .order("activity_date", { ascending: false })
      .limit(10),

    // Top opportunities by amount
    supabase
      .from("opportunities")
      .select("name, amount, stage")
      .order("amount", { ascending: false })
      .limit(5),
  ]);

  const errors = queries.filter((q) => q.error).map((q) => q.error);
  if (errors.length > 0) throw errors[0];

  return {
    data: {
      opportunitiesByStage: queries[0].data,
      recentActivities: queries[1].data,
      topOpportunities: queries[2].data,
    },
  };
}

async function complexJoinQuery() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      id,
      name,
      amount,
      stage,
      customer:companies!customer_organization_id(
        name,
        sector,
        contact_organizations(
          contact:contacts(
            first_name,
            last_name
          )
        )
      ),
      activities(
        type,
        subject,
        activity_date,
        interaction_participants(
          contact:contacts(first_name, last_name)
        )
      )
    `,
    )
    .eq("status", "active")
    .gte("amount", 10000)
    .limit(10);

  if (error) throw error;
  return { data };
}

async function createActivity() {
  const types = ["call", "email", "meeting", "demo"];

  // Get random contact and organization
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id")
    .limit(10);

  const { data: orgs } = await supabase
    .from("companies")
    .select("id")
    .limit(10);

  if (!contacts || !orgs) {
    throw new Error("Unable to fetch test data");
  }

  const activity = {
    activity_type: "engagement",
    type: faker.helpers.arrayElement(types),
    subject: `Load Test Activity - ${faker.company.catchPhrase()}`,
    description: faker.lorem.paragraph(),
    activity_date: faker.date.recent().toISOString(),
    contact_id: faker.helpers.arrayElement(contacts).id,
    organization_id: faker.helpers.arrayElement(orgs).id,
    duration_minutes: faker.number.int({ min: 15, max: 120 }),
    sentiment: faker.helpers.arrayElement(["positive", "neutral", "negative"]),
  };

  const { data, error } = await supabase
    .from("activities")
    .insert([activity])
    .select()
    .single();

  if (error) throw error;

  // Clean up created activity
  if (data) {
    setTimeout(async () => {
      await supabase.from("activities").delete().eq("id", data.id);
    }, 5000);
  }

  return { data };
}

// Virtual user simulation
async function simulateUser(userId) {
  const userMetrics = {
    requests: 0,
    errors: 0,
    totalResponseTime: 0,
  };

  const requestDelay = 1000 / LOAD_TEST_CONFIG.requestsPerSecond;

  while (
    Date.now() - metrics.startTime <
    LOAD_TEST_CONFIG.testDuration * 1000
  ) {
    const endpoint = selectRandomEndpoint();
    const startTime = performance.now();

    try {
      metrics.concurrentConnections++;
      metrics.peakConcurrency = Math.max(
        metrics.peakConcurrency,
        metrics.concurrentConnections,
      );

      await endpoint.fn();

      const responseTime = performance.now() - startTime;
      metrics.responseTimes.push(responseTime);
      metrics.successfulRequests++;
      metrics.requestsByEndpoint[endpoint.name] =
        (metrics.requestsByEndpoint[endpoint.name] || 0) + 1;
      userMetrics.requests++;
      userMetrics.totalResponseTime += responseTime;
    } catch (error) {
      metrics.failedRequests++;
      userMetrics.errors++;
      const errorType = error.message || "Unknown error";
      metrics.errorsByType[errorType] =
        (metrics.errorsByType[errorType] || 0) + 1;

      console.error(
        chalk.red(`User ${userId} - ${endpoint.name} failed: ${errorType}`),
      );
    } finally {
      metrics.concurrentConnections--;
      metrics.totalRequests++;
    }

    // Wait before next request
    await new Promise((resolve) => setTimeout(resolve, requestDelay));
  }

  return userMetrics;
}

// Calculate statistics
function calculateStatistics() {
  const sortedResponseTimes = [...metrics.responseTimes].sort((a, b) => a - b);
  const count = sortedResponseTimes.length;

  if (count === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sum = sortedResponseTimes.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median = sortedResponseTimes[Math.floor(count / 2)];
  const p95 = sortedResponseTimes[Math.floor(count * 0.95)];
  const p99 = sortedResponseTimes[Math.floor(count * 0.99)];

  return {
    min: sortedResponseTimes[0],
    max: sortedResponseTimes[count - 1],
    mean,
    median,
    p95,
    p99,
  };
}

// Generate report
async function generateReport() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const stats = calculateStatistics();
  const throughput = metrics.totalRequests / duration;
  const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;

  const report = {
    summary: {
      duration: `${duration.toFixed(2)}s`,
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      errorRate: `${errorRate.toFixed(2)}%`,
      throughput: `${throughput.toFixed(2)} req/s`,
      peakConcurrency: metrics.peakConcurrency,
    },
    responseTime: {
      min: `${stats.min.toFixed(2)}ms`,
      mean: `${stats.mean.toFixed(2)}ms`,
      median: `${stats.median.toFixed(2)}ms`,
      p95: `${stats.p95.toFixed(2)}ms`,
      p99: `${stats.p99.toFixed(2)}ms`,
      max: `${stats.max.toFixed(2)}ms`,
    },
    requestsByEndpoint: metrics.requestsByEndpoint,
    errorsByType: metrics.errorsByType,
    configuration: LOAD_TEST_CONFIG,
    timestamp: new Date().toISOString(),
  };

  // Save report to file
  const reportDir = path.join(process.cwd(), "logs", "load-tests");
  await fs.mkdir(reportDir, { recursive: true });

  const reportFile = path.join(reportDir, `load-test-${Date.now()}.json`);
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

  return { report, reportFile };
}

// Main execution
async function runLoadTest() {
  console.log(chalk.cyan("\n🚀 Starting Load Test\n"));
  console.log(chalk.yellow("Configuration:"));
  console.log(`  - Concurrent Users: ${LOAD_TEST_CONFIG.concurrentUsers}`);
  console.log(`  - Test Duration: ${LOAD_TEST_CONFIG.testDuration}s`);
  console.log(
    `  - Requests/Second/User: ${LOAD_TEST_CONFIG.requestsPerSecond}`,
  );
  console.log(`  - Ramp-up Time: ${LOAD_TEST_CONFIG.rampUpTime}s`);
  console.log(`  - Target: ${supabaseUrl}\n`);

  const spinner = ora("Initializing load test...").start();

  // Test connectivity
  try {
    const { error } = await supabase
      .from("opportunities")
      .select("id")
      .limit(1);
    if (error) throw error;
  } catch (error) {
    spinner.fail("Failed to connect to Supabase");
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }

  spinner.text = "Ramping up virtual users...";

  metrics.startTime = Date.now();

  // Start virtual users with ramp-up
  const userPromises = [];
  const rampUpDelay =
    (LOAD_TEST_CONFIG.rampUpTime * 1000) / LOAD_TEST_CONFIG.concurrentUsers;

  for (let i = 0; i < LOAD_TEST_CONFIG.concurrentUsers; i++) {
    userPromises.push(
      new Promise(async (resolve) => {
        await new Promise((r) => setTimeout(r, i * rampUpDelay));
        const result = await simulateUser(i + 1);
        resolve(result);
      }),
    );
  }

  spinner.text = `Running load test (${LOAD_TEST_CONFIG.testDuration}s)...`;

  // Wait for all users to complete
  const userResults = await Promise.all(userPromises);
  metrics.endTime = Date.now();

  spinner.succeed("Load test completed");

  // Generate and display report
  console.log(chalk.cyan("\n📊 Generating Report...\n"));

  const { report, reportFile } = await generateReport();

  // Display summary
  console.log(chalk.green("=== Load Test Results ===\n"));

  console.log(chalk.yellow("Summary:"));
  Object.entries(report.summary).forEach(([key, value]) => {
    console.log(`  ${key}: ${chalk.white(value)}`);
  });

  console.log(chalk.yellow("\nResponse Time Statistics:"));
  Object.entries(report.responseTime).forEach(([key, value]) => {
    console.log(`  ${key}: ${chalk.white(value)}`);
  });

  console.log(chalk.yellow("\nRequests by Endpoint:"));
  Object.entries(report.requestsByEndpoint).forEach(([endpoint, count]) => {
    const percentage = ((count / metrics.totalRequests) * 100).toFixed(1);
    console.log(`  ${endpoint}: ${chalk.white(count)} (${percentage}%)`);
  });

  if (Object.keys(report.errorsByType).length > 0) {
    console.log(chalk.red("\nErrors by Type:"));
    Object.entries(report.errorsByType).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
  }

  // Performance assessment
  console.log(chalk.cyan("\n🎯 Performance Assessment:\n"));

  const assessments = [];

  if (stats.median < 200) {
    assessments.push(chalk.green("✅ Excellent median response time (<200ms)"));
  } else if (stats.median < 500) {
    assessments.push(chalk.yellow("⚠️ Good median response time (<500ms)"));
  } else {
    assessments.push(chalk.red("❌ Poor median response time (>500ms)"));
  }

  if (stats.p95 < 1000) {
    assessments.push(chalk.green("✅ Excellent P95 response time (<1s)"));
  } else if (stats.p95 < 2000) {
    assessments.push(chalk.yellow("⚠️ Acceptable P95 response time (<2s)"));
  } else {
    assessments.push(chalk.red("❌ Poor P95 response time (>2s)"));
  }

  if (errorRate < 1) {
    assessments.push(chalk.green("✅ Excellent error rate (<1%)"));
  } else if (errorRate < 5) {
    assessments.push(chalk.yellow("⚠️ Acceptable error rate (<5%)"));
  } else {
    assessments.push(chalk.red("❌ High error rate (>5%)"));
  }

  if (throughput > 100) {
    assessments.push(chalk.green("✅ Excellent throughput (>100 req/s)"));
  } else if (throughput > 50) {
    assessments.push(chalk.yellow("⚠️ Good throughput (>50 req/s)"));
  } else {
    assessments.push(chalk.red("❌ Low throughput (<50 req/s)"));
  }

  assessments.forEach((a) => console.log(`  ${a}`));

  console.log(
    chalk.cyan(`\n📁 Full report saved to: ${chalk.white(reportFile)}\n`),
  );

  // Exit with appropriate code
  process.exit(errorRate > 5 ? 1 : 0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error(chalk.red("\n❌ Unhandled error:"), error);
  process.exit(1);
});

// Run the load test
runLoadTest().catch((error) => {
  console.error(chalk.red("Load test failed:"), error);
  process.exit(1);
});
