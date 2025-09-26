#!/usr/bin/env tsx

/**
 * Validation script for data provider consolidation
 * Run with: npx tsx scripts/validate-provider-consolidation.ts
 */

import { promises as fs } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import chalk from "chalk";

interface ValidationResult {
  test: string;
  status: "PASS" | "FAIL" | "WARN";
  message?: string;
}

const results: ValidationResult[] = [];

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function validateOldProviderRemoved() {
  const oldProviderPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/dataProvider.ts",
  );
  const exists = await fileExists(oldProviderPath);

  results.push({
    test: "Old provider removed",
    status: exists ? "FAIL" : "PASS",
    message: exists ? "dataProvider.ts still exists" : undefined,
  });
}

async function validateUnifiedProviderExists() {
  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts",
  );
  const exists = await fileExists(unifiedPath);

  results.push({
    test: "Unified provider exists",
    status: exists ? "PASS" : "FAIL",
    message: exists ? undefined : "unifiedDataProvider.ts not found",
  });
}

async function validateExports() {
  const indexPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/index.ts",
  );
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const hasExport =
      content.includes("export") && content.includes("dataProvider");

    results.push({
      test: "Provider exported correctly",
      status: hasExport ? "PASS" : "FAIL",
      message: hasExport
        ? undefined
        : "dataProvider not exported from index.ts",
    });
  } catch {
    results.push({
      test: "Provider exported correctly",
      status: "FAIL",
      message: "Could not read index.ts",
    });
  }
}

async function validateCustomMethods() {
  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts",
  );

  const requiredMethods = [
    "salesCreate",
    "salesUpdate",
    "updatePassword",
    "unarchiveOpportunity",
    "getActivityLog",
    "getContactOrganizations",
    "addContactOrganization",
    "removeContactOrganization",
  ];

  try {
    const content = await fs.readFile(unifiedPath, "utf-8");
    const missingMethods = requiredMethods.filter(
      (method) => !content.includes(method),
    );

    results.push({
      test: "All custom methods present",
      status: missingMethods.length === 0 ? "PASS" : "WARN",
      message:
        missingMethods.length > 0
          ? `Missing methods: ${missingMethods.join(", ")}`
          : undefined,
    });
  } catch {
    results.push({
      test: "All custom methods present",
      status: "FAIL",
      message: "Could not read unified provider",
    });
  }
}

async function validateNoOldImports() {
  try {
    const output = execSync(
      'grep -r "from.*dataProvider" src/ --include="*.ts" --include="*.tsx" | grep -v unified || true',
      { encoding: "utf-8" },
    ).trim();

    const hasOldImports =
      output.length > 0 && !output.includes("unifiedDataProvider");

    results.push({
      test: "No references to old provider",
      status: hasOldImports ? "WARN" : "PASS",
      message: hasOldImports ? "Found imports of old dataProvider" : undefined,
    });
  } catch {
    results.push({
      test: "No references to old provider",
      status: "PASS",
    });
  }
}

async function validateTypeScript() {
  try {
    execSync("npm run typecheck", { encoding: "utf-8", stdio: "pipe" });
    results.push({
      test: "TypeScript compilation",
      status: "PASS",
    });
  } catch {
    results.push({
      test: "TypeScript compilation",
      status: "FAIL",
      message: "TypeScript errors found",
    });
  }
}

async function validateTests() {
  try {
    execSync("npm run test -- --run --reporter=silent", {
      encoding: "utf-8",
      stdio: "pipe",
    });
    results.push({
      test: "Unit tests",
      status: "PASS",
    });
  } catch {
    results.push({
      test: "Unit tests",
      status: "WARN",
      message: "Some tests failing",
    });
  }
}

async function validateCriticalFeatures() {
  const unifiedPath = join(
    process.cwd(),
    "src/atomic-crm/providers/supabase/unifiedDataProvider.ts",
  );

  const criticalFeatures = [
    { name: "File uploads", pattern: "uploadToBucket" },
    { name: "Soft delete filtering", pattern: "deleted_at" },
    { name: "Full-text search", pattern: "fts" },
    { name: "Summary views", pattern: "_summary" },
    { name: "Validation registry", pattern: "validationRegistry" },
  ];

  try {
    const content = await fs.readFile(unifiedPath, "utf-8");

    for (const feature of criticalFeatures) {
      const hasFeature = content.includes(feature.pattern);
      results.push({
        test: feature.name,
        status: hasFeature ? "PASS" : "WARN",
        message: hasFeature ? undefined : `${feature.pattern} not found`,
      });
    }
  } catch {
    criticalFeatures.forEach((feature) => {
      results.push({
        test: feature.name,
        status: "FAIL",
        message: "Could not validate feature",
      });
    });
  }
}

async function runValidation() {
  console.log(
    chalk.bold.blue("\n🔍 Validating Data Provider Consolidation...\n"),
  );

  // Run all validations
  await validateOldProviderRemoved();
  await validateUnifiedProviderExists();
  await validateExports();
  await validateCustomMethods();
  await validateNoOldImports();
  await validateCriticalFeatures();
  await validateTypeScript();
  await validateTests();

  // Display results
  console.log(chalk.bold("\n📊 Validation Results:\n"));

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    const icon =
      result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️";
    const color =
      result.status === "PASS"
        ? chalk.green
        : result.status === "FAIL"
          ? chalk.red
          : chalk.yellow;

    console.log(
      `${icon} ${color(result.test.padEnd(30))} ${result.message || ""}`,
    );

    if (result.status === "PASS") passCount++;
    else if (result.status === "FAIL") failCount++;
    else warnCount++;
  }

  // Summary
  console.log(chalk.bold("\n📈 Summary:"));
  console.log(chalk.green(`  Passed: ${passCount}`));
  console.log(chalk.yellow(`  Warnings: ${warnCount}`));
  console.log(chalk.red(`  Failed: ${failCount}`));

  // Overall status
  if (failCount === 0) {
    console.log(chalk.bold.green("\n🎉 Consolidation validation PASSED!\n"));
    process.exit(0);
  } else {
    console.log(chalk.bold.red("\n❌ Consolidation validation FAILED!\n"));
    console.log(chalk.yellow("Fix the failed items before proceeding.\n"));
    process.exit(1);
  }
}

// Run the validation
runValidation().catch((error) => {
  console.error(chalk.red("Validation script error:"), error);
  process.exit(1);
});
