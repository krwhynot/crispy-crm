/**
 * Health Check Script for Discovery Services
 *
 * Verifies that all required services (LanceDB, Ollama) are running
 * and properly configured for semantic search.
 *
 * Usage: npx tsx scripts/discover/embeddings/health-check.ts
 */

import { checkOllamaHealth, getHealthDetails as getOllamaHealthDetails } from "./ollama.js";
import { checkLanceDBHealth, getHealthDetails as getLanceDBHealthDetails } from "./lancedb.js";

interface HealthStatus {
  service: string;
  healthy: boolean;
  details: Record<string, unknown>;
}

async function checkAllServices(): Promise<void> {
  console.log("🔍 Discovery Services Health Check\n");
  console.log("─".repeat(50));

  const results: HealthStatus[] = [];

  // Check Ollama
  console.log("\n📦 Ollama (Embedding Service)");
  const ollamaHealthy = await checkOllamaHealth();
  const ollamaDetails = await getOllamaHealthDetails();
  results.push({
    service: "Ollama",
    healthy: ollamaHealthy,
    details: ollamaDetails,
  });

  if (ollamaHealthy) {
    console.log("   ✅ Server reachable");
    console.log("   ✅ Model available: nomic-embed-text");
    if (ollamaDetails.availableModels.length > 0) {
      console.log(`   📋 All models: ${ollamaDetails.availableModels.join(", ")}`);
    }
  } else {
    console.log("   ❌ Not healthy");
    if (!ollamaDetails.serverReachable) {
      console.log("   └─ Server not reachable at http://localhost:11434");
      console.log("   └─ Run: just discover-services");
    } else if (!ollamaDetails.modelAvailable) {
      console.log("   └─ Model 'nomic-embed-text' not pulled");
      console.log("   └─ Run: just discover-pull-model");
    }
  }

  // Check LanceDB
  console.log("\n📦 LanceDB (Vector Database)");
  const lanceDBHealthy = await checkLanceDBHealth();
  const lanceDBDetails = await getLanceDBHealthDetails();
  results.push({
    service: "LanceDB",
    healthy: lanceDBHealthy,
    details: lanceDBDetails,
  });

  if (lanceDBHealthy) {
    console.log("   ✅ Database accessible at .claude/state/vectors.lance");
    if (lanceDBDetails.collectionExists) {
      console.log(`   ✅ Table 'code_chunks' exists`);
      console.log(`   📊 Points indexed: ${lanceDBDetails.pointCount}`);
    } else {
      console.log("   ⚠️  Table 'code_chunks' not created yet");
      console.log("   └─ Will be created on first indexing");
    }
  } else {
    console.log("   ❌ Not healthy");
    console.log("   └─ Database not accessible at .claude/state/vectors.lance");
    console.log("   └─ Check file permissions or disk space");
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  const allHealthy = results.every((r) => r.healthy);

  if (allHealthy) {
    console.log("✅ All services healthy - ready for semantic search\n");
    console.log("Next steps:");
    console.log("  1. Index codebase: just discover-embeddings");
    console.log('  2. Search: just discover-search "form validation"');
  } else {
    console.log("❌ Some services need attention\n");
    console.log("Quick fix:");
    console.log("  just discover-services && just discover-pull-model");
    process.exit(1);
  }
}

checkAllServices().catch((error) => {
  console.error("Health check failed:", error);
  process.exit(1);
});
