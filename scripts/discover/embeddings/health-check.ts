/**
 * Health Check Script for Discovery Services
 *
 * Verifies that all required services (Qdrant, Ollama) are running
 * and properly configured for semantic search.
 *
 * Usage: npx tsx scripts/discover/embeddings/health-check.ts
 */

import {
  checkOllamaHealth,
  getHealthDetails as getOllamaHealthDetails,
} from "./ollama.js";
import {
  checkQdrantHealth,
  getHealthDetails as getQdrantHealthDetails,
} from "./qdrant.js";

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

  // Check Qdrant
  console.log("\n📦 Qdrant (Vector Database)");
  const qdrantHealthy = await checkQdrantHealth();
  const qdrantDetails = await getQdrantHealthDetails();
  results.push({
    service: "Qdrant",
    healthy: qdrantHealthy,
    details: qdrantDetails,
  });

  if (qdrantHealthy) {
    console.log("   ✅ Server reachable");
    if (qdrantDetails.collectionExists) {
      console.log(`   ✅ Collection 'crispy_code' exists`);
      console.log(`   📊 Points indexed: ${qdrantDetails.pointCount}`);
    } else {
      console.log("   ⚠️  Collection 'crispy_code' not created yet");
      console.log("   └─ Will be created on first indexing");
    }
  } else {
    console.log("   ❌ Not healthy");
    console.log("   └─ Server not reachable at http://localhost:6333");
    console.log("   └─ Run: just discover-services");
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  const allHealthy = results.every((r) => r.healthy);

  if (allHealthy) {
    console.log("✅ All services healthy - ready for semantic search\n");
    console.log("Next steps:");
    console.log("  1. Index codebase: just discover-embeddings");
    console.log("  2. Search: just discover-search \"form validation\"");
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
