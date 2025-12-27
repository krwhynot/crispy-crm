/**
 * Generate visualization files from call-graph-inventory data.
 * Creates Mermaid (.mmd) and Graphviz DOT (.dot) files.
 *
 * Usage: npx tsx scripts/discover/generate-viz.ts
 * Or via justfile: just callgraph-viz
 */

import * as fs from "fs";
import * as path from "path";
import { detectCycles, type CallGraphNode, type CallGraphEdge } from "./extractors/call-graph.js";
import {
  generateMermaidGraph,
  generateDotGraph,
  generateCyclesMermaid,
} from "./utils/visualization.js";

interface ChunkData {
  chunk_name: string;
  generated_at: string;
  item_count: number;
  items: {
    nodes: CallGraphNode[];
    edges: CallGraphEdge[];
  };
}

interface ManifestChunk {
  name: string;
  file: string;
  item_count: number;
}

interface Manifest {
  status: string;
  generated_at: string;
  summary: {
    total_nodes: number;
    total_edges: number;
    cycles_detected: number;
  };
  chunks: ManifestChunk[];
}

async function main(): Promise<void> {
  const inventoryDir = path.resolve(process.cwd(), ".claude/state/call-graph-inventory");
  const vizDir = path.join(inventoryDir, "_visualization");

  // Check if inventory exists
  const manifestPath = path.join(inventoryDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Call graph inventory not found. Run 'just discover-callgraph' first.");
    process.exit(1);
  }

  // Ensure visualization directory exists
  if (!fs.existsSync(vizDir)) {
    fs.mkdirSync(vizDir, { recursive: true });
  }

  console.log("📊 Generating call graph visualizations...\n");

  // Read manifest
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`  Found ${manifest.chunks.length} chunks with ${manifest.summary.total_nodes} nodes, ${manifest.summary.total_edges} edges`);

  // Collect all nodes and edges from chunks
  const allNodes: CallGraphNode[] = [];
  const allEdges: CallGraphEdge[] = [];
  const perFeature = new Map<string, { nodes: CallGraphNode[]; edges: CallGraphEdge[] }>();

  for (const chunk of manifest.chunks) {
    const chunkPath = path.join(inventoryDir, chunk.file);
    if (!fs.existsSync(chunkPath)) {
      console.warn(`  ⚠️  Chunk file not found: ${chunk.file}`);
      continue;
    }

    const chunkData: ChunkData = JSON.parse(fs.readFileSync(chunkPath, "utf-8"));
    const nodes = chunkData.items?.nodes || [];
    const edges = chunkData.items?.edges || [];

    allNodes.push(...nodes);
    allEdges.push(...edges);
    perFeature.set(chunk.name, { nodes, edges });
  }

  console.log(`  Loaded ${allNodes.length} nodes, ${allEdges.length} edges\n`);

  // Generate full graph visualizations
  console.log("  Writing full-graph.mmd...");
  const fullMermaid = generateMermaidGraph(allNodes, allEdges, {
    title: "Crispy CRM Call Graph",
    direction: "LR",
    maxNodes: 200,
    includeEdgeLabels: true,
  });
  fs.writeFileSync(path.join(vizDir, "full-graph.mmd"), fullMermaid, "utf-8");

  console.log("  Writing full-graph.dot...");
  const fullDot = generateDotGraph(allNodes, allEdges, {
    title: "CrispyCRMCallGraph",
    rankdir: "LR",
    maxNodes: 300,
    includeEdgeLabels: true,
  });
  fs.writeFileSync(path.join(vizDir, "full-graph.dot"), fullDot, "utf-8");

  // Generate per-feature Mermaid diagrams
  let featureCount = 0;
  for (const [name, { nodes, edges }] of perFeature) {
    if (nodes.length === 0) continue;

    const featureMermaid = generateMermaidGraph(nodes, edges, {
      title: `${name} Feature`,
      direction: "LR",
      maxNodes: 100,
      includeEdgeLabels: true,
    });
    fs.writeFileSync(path.join(vizDir, `${name}.mmd`), featureMermaid, "utf-8");
    featureCount++;
  }
  console.log(`  Written ${featureCount} per-feature Mermaid files`);

  // Generate cycles visualization
  console.log("  Detecting circular dependencies...");
  const cycles = detectCycles(allNodes, allEdges);
  const cyclesMermaid = generateCyclesMermaid(allNodes, allEdges, cycles);
  fs.writeFileSync(path.join(vizDir, "cycles.mmd"), cyclesMermaid, "utf-8");

  if (cycles.length > 0) {
    console.log(`  ⚠️  Found ${cycles.length} circular dependency cycle(s)`);
  } else {
    console.log("  ✓ No circular dependencies detected");
  }

  // Summary
  console.log(`\n✅ Generated visualizations in ${path.relative(process.cwd(), vizDir)}/`);
  console.log(`   - full-graph.mmd (${(fullMermaid.length / 1024).toFixed(1)}KB)`);
  console.log(`   - full-graph.dot (${(fullDot.length / 1024).toFixed(1)}KB)`);
  console.log(`   - ${featureCount} per-feature .mmd files`);
  console.log(`   - cycles.mmd`);
}

main().catch((error) => {
  console.error("❌ Error generating visualizations:", error);
  process.exit(1);
});
