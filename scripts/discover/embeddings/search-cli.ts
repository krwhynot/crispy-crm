/**
 * Semantic Search CLI for Discovery System
 *
 * Search for code by meaning rather than exact keywords.
 *
 * Usage:
 *   npx tsx scripts/discover/embeddings/search-cli.ts "form validation"
 *   npx tsx scripts/discover/embeddings/search-cli.ts "hooks for data fetching" --limit 20
 *
 * Examples:
 *   "form validation"        → Find form validation logic
 *   "authentication hooks"   → Find auth-related hooks
 *   "Zod schema"             → Find Zod validation schemas
 *   "data provider"          → Find data fetching patterns
 */

import { generateEmbedding, checkOllamaHealth } from "./ollama.js";
import { search, searchByType, checkLanceDBHealth, getCollectionInfo } from "./lancedb.js";

interface SearchOptions {
  query: string;
  limit: number;
  showPreview: boolean;
  typeFilter?: string;
}

function parseArgs(): SearchOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log("Semantic Code Search\n");
    console.log("Usage: npx tsx search-cli.ts <query> [options]\n");
    console.log("Options:");
    console.log("  --limit <n>     Maximum results (default: 10)");
    console.log("  --type <type>   Filter by code element type (component, hook, function, etc.)");
    console.log("  --no-preview    Hide code previews");
    console.log("  --help          Show this help\n");
    console.log("Examples:");
    console.log('  npx tsx search-cli.ts "form validation"');
    console.log('  npx tsx search-cli.ts "hooks for authentication" --limit 5');
    process.exit(0);
  }

  // Find query (first non-flag argument)
  let query = "";
  let limit = 10;
  let showPreview = true;
  let typeFilter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === "--type" && args[i + 1]) {
      typeFilter = args[i + 1];
      i++;
    } else if (arg === "--no-preview") {
      showPreview = false;
    } else if (!arg.startsWith("-")) {
      query = arg;
    }
  }

  if (!query) {
    console.error("Error: No query provided");
    process.exit(1);
  }

  return { query, limit, showPreview, typeFilter };
}

async function runSearch(options: SearchOptions): Promise<void> {
  // Verify services
  const ollamaOk = await checkOllamaHealth();
  if (!ollamaOk) {
    console.error("❌ Ollama not available. Run: just discover-services");
    process.exit(1);
  }

  const lancedbOk = await checkLanceDBHealth();
  if (!lancedbOk) {
    console.error("❌ LanceDB not available. Check disk permissions.");
    process.exit(1);
  }

  // Check if index exists
  const info = await getCollectionInfo();
  if (info.pointCount === 0) {
    console.error("❌ No code indexed yet. Run: just discover-embeddings");
    process.exit(1);
  }

  // Generate query embedding
  const typeInfo = options.typeFilter ? ` (type: ${options.typeFilter})` : "";
  console.log(`\n🔎 Searching for: "${options.query}"${typeInfo}\n`);
  const queryEmbedding = await generateEmbedding(options.query);

  // Search
  const results = options.typeFilter
    ? await searchByType(queryEmbedding, options.typeFilter, options.limit)
    : await search(queryEmbedding, options.limit);

  if (results.length === 0) {
    console.log("No results found.\n");
    return;
  }

  // Display results
  console.log(`Found ${results.length} results:\n`);
  console.log("─".repeat(60));

  results.forEach((result, index) => {
    const { payload, score } = result;
    const similarity = (score * 100).toFixed(1);

    console.log(`\n${index + 1}. [${similarity}%] ${payload.type}: ${payload.name}`);
    console.log(`   📁 ${payload.filePath}:${payload.startLine}-${payload.endLine}`);

    if (options.showPreview && payload.content) {
      const preview = payload.content.replace(/\s+/g, " ").trim().slice(0, 120);
      console.log(`   📄 ${preview}...`);
    }
  });

  console.log("\n" + "─".repeat(60));
  console.log(`\n💡 Tip: Use --limit <n> to show more results\n`);
}

// Main
const options = parseArgs();
runSearch(options).catch((error) => {
  console.error("Search failed:", error);
  process.exit(1);
});
