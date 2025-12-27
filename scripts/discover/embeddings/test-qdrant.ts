/**
 * Test script for Qdrant client integration.
 *
 * Usage: npx tsx scripts/discover/embeddings/test-qdrant.ts
 *
 * Prerequisites:
 * - Qdrant running at http://localhost:6333
 *   Start with: docker run -p 6333:6333 qdrant/qdrant
 */

import {
  qdrant,
  ensureCollection,
  upsertPoints,
  search,
  clearCollection,
  checkQdrantHealth,
  getHealthDetails,
  getCollectionInfo,
  QdrantError,
  type UpsertPoint,
} from "./qdrant.js";

async function runTests(): Promise<void> {
  console.log("=== Qdrant Client Test Suite ===\n");

  console.log("1. Health Check...");
  const isHealthy = await checkQdrantHealth();
  if (!isHealthy) {
    console.error("   FAIL: Qdrant is not reachable");
    console.error("   Start Qdrant with: docker run -p 6333:6333 qdrant/qdrant");
    process.exit(1);
  }
  console.log("   PASS: Qdrant is healthy\n");

  console.log("2. Health Details...");
  const healthDetails = await getHealthDetails();
  console.log(`   Server reachable: ${healthDetails.serverReachable}`);
  console.log(`   Collection exists: ${healthDetails.collectionExists}`);
  console.log(`   Point count: ${healthDetails.pointCount}`);
  if (healthDetails.error) {
    console.log(`   Note: ${healthDetails.error}`);
  }
  console.log();

  console.log("3. Clear/Create Collection...");
  try {
    await clearCollection();
    console.log("   PASS: Collection cleared and recreated\n");
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("4. Ensure Collection (idempotent)...");
  try {
    await ensureCollection();
    await ensureCollection(); // Should not throw
    console.log("   PASS: ensureCollection is idempotent\n");
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("5. Get Collection Info...");
  try {
    const info = await getCollectionInfo();
    console.log(`   Point count: ${info.pointCount}`);
    console.log(`   Vector size: ${info.vectorSize}`);
    console.log(`   Distance: ${info.distance}`);
    console.log("   PASS: Collection info retrieved\n");
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("6. Upsert Points...");
  const testPoints: UpsertPoint[] = [
    {
      id: "component:ContactList",
      vector: Array(768).fill(0).map((_, i) => Math.sin(i * 0.1)),
      payload: {
        originalId: "component:ContactList",
        filePath: "src/atomic-crm/contacts/ContactList.tsx",
        type: "component",
        name: "ContactList",
        startLine: 10,
        endLine: 150,
        preview: "export function ContactList() { return <List>...</List>; }",
      },
    },
    {
      id: "component:ContactEdit",
      vector: Array(768).fill(0).map((_, i) => Math.sin(i * 0.1 + 0.5)),
      payload: {
        originalId: "component:ContactEdit",
        filePath: "src/atomic-crm/contacts/ContactEdit.tsx",
        type: "component",
        name: "ContactEdit",
        startLine: 5,
        endLine: 80,
        preview: "export function ContactEdit() { return <Edit>...</Edit>; }",
      },
    },
    {
      id: "hook:useContacts",
      vector: Array(768).fill(0).map((_, i) => Math.cos(i * 0.1)),
      payload: {
        originalId: "hook:useContacts",
        filePath: "src/atomic-crm/contacts/useContacts.ts",
        type: "hook",
        name: "useContacts",
        startLine: 1,
        endLine: 30,
        preview: "export function useContacts() { return useQuery(...); }",
      },
    },
  ];

  try {
    await upsertPoints(testPoints);
    console.log(`   PASS: Upserted ${testPoints.length} points\n`);
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("7. Verify Point Count...");
  try {
    const info = await getCollectionInfo();
    if (info.pointCount !== testPoints.length) {
      console.error(`   FAIL: Expected ${testPoints.length} points, got ${info.pointCount}`);
      process.exit(1);
    }
    console.log(`   PASS: Point count is ${info.pointCount}\n`);
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("8. Search (similar to ContactList)...");
  try {
    const queryVector = Array(768).fill(0).map((_, i) => Math.sin(i * 0.1));
    const results = await search(queryVector, 3);
    console.log(`   Found ${results.length} results:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.payload.name} (score: ${r.score.toFixed(4)})`);
    });
    if (results.length === 0) {
      console.error("   FAIL: No search results");
      process.exit(1);
    }
    if (results[0].payload.name !== "ContactList") {
      console.error("   FAIL: Expected ContactList to be most similar");
      process.exit(1);
    }
    console.log("   PASS: Search returned expected results\n");
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("9. Search (similar to useContacts hook)...");
  try {
    const queryVector = Array(768).fill(0).map((_, i) => Math.cos(i * 0.1));
    const results = await search(queryVector, 3);
    console.log(`   Found ${results.length} results:`);
    results.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.payload.name} (score: ${r.score.toFixed(4)})`);
    });
    if (results[0].payload.name !== "useContacts") {
      console.error("   FAIL: Expected useContacts to be most similar");
      process.exit(1);
    }
    console.log("   PASS: Search returned expected results\n");
  } catch (error) {
    console.error("   FAIL:", error);
    process.exit(1);
  }

  console.log("10. Vector Dimension Validation...");
  try {
    const badVector = Array(100).fill(0);
    await search(badVector, 1);
    console.error("   FAIL: Should have thrown for wrong dimensions");
    process.exit(1);
  } catch (error) {
    if (error instanceof QdrantError && error.message.includes("dimensions")) {
      console.log("   PASS: Correctly rejected wrong vector dimensions\n");
    } else {
      console.error("   FAIL: Wrong error type:", error);
      process.exit(1);
    }
  }

  console.log("=== All Tests Passed ===\n");
}

runTests().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});
