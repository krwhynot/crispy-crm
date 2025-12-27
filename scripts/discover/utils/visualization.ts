/**
 * Visualization utilities for call graph output.
 * Generates Mermaid and Graphviz DOT format diagrams.
 */

import type { CallGraphNode, CallGraphEdge } from "../extractors/call-graph.js";

// ─────────────────────────────────────────────────────────────
// Mermaid Generation
// ─────────────────────────────────────────────────────────────

interface MermaidOptions {
  title?: string;
  direction?: 'LR' | 'TB' | 'RL' | 'BT';
  maxNodes?: number;
  includeEdgeLabels?: boolean;
}

/**
 * Get Mermaid node shape based on node type.
 * - [name] = function (rectangle)
 * - ([name]) = component (rounded/stadium)
 * - ((name)) = hook (circle)
 * - [[name]] = method (subroutine)
 */
function getMermaidNodeShape(node: CallGraphNode): string {
  const safeName = sanitizeMermaidId(node.name);
  switch (node.nodeType) {
    case 'component':
      return `${safeName}([${node.name}])`;
    case 'hook':
      return `${safeName}((${node.name}))`;
    case 'method':
      return `${safeName}[[${node.name}]]`;
    case 'arrow':
    case 'function':
    default:
      return `${safeName}[${node.name}]`;
  }
}

/**
 * Get Mermaid edge style based on edge type.
 * - --> = solid arrow (call, render)
 * - -.-> = dashed arrow (hook, callback)
 */
function getMermaidEdgeStyle(edge: CallGraphEdge, includeLabel: boolean): string {
  const label = includeLabel ? `|${edge.edgeType}|` : '';

  switch (edge.edgeType) {
    case 'hook':
    case 'callback':
      return `-.->${label}`;
    case 'render':
    case 'call':
    default:
      return `-->${label}`;
  }
}

/**
 * Sanitize a name for use as a Mermaid node ID.
 * Mermaid has restrictions on special characters.
 */
function sanitizeMermaidId(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Generate a Mermaid flowchart from call graph data.
 */
export function generateMermaidGraph(
  nodes: CallGraphNode[],
  edges: CallGraphEdge[],
  options: MermaidOptions = {}
): string {
  const {
    title,
    direction = 'LR',
    maxNodes = 100,
    includeEdgeLabels = true,
  } = options;

  const lines: string[] = [];

  // Header
  if (title) {
    lines.push(`---`);
    lines.push(`title: ${title}`);
    lines.push(`---`);
  }
  lines.push(`flowchart ${direction}`);
  lines.push('');

  // Limit nodes if needed
  const displayNodes = nodes.slice(0, maxNodes);
  const nodeNames = new Set(displayNodes.map(n => n.name));

  // Node definitions (grouped by type for clarity)
  const components = displayNodes.filter(n => n.nodeType === 'component');
  const hooks = displayNodes.filter(n => n.nodeType === 'hook');
  const functions = displayNodes.filter(n => n.nodeType === 'function' || n.nodeType === 'arrow');

  if (components.length > 0) {
    lines.push('  %% Components');
    for (const node of components) {
      lines.push(`  ${getMermaidNodeShape(node)}`);
    }
    lines.push('');
  }

  if (hooks.length > 0) {
    lines.push('  %% Hooks');
    for (const node of hooks) {
      lines.push(`  ${getMermaidNodeShape(node)}`);
    }
    lines.push('');
  }

  if (functions.length > 0) {
    lines.push('  %% Functions');
    for (const node of functions) {
      lines.push(`  ${getMermaidNodeShape(node)}`);
    }
    lines.push('');
  }

  // Edge definitions (grouped by type)
  const renderEdges = edges.filter(e => e.edgeType === 'render' && nodeNames.has(e.targetName));
  const hookEdges = edges.filter(e => e.edgeType === 'hook' && nodeNames.has(e.targetName));
  const callEdges = edges.filter(e => e.edgeType === 'call' && nodeNames.has(e.targetName));
  const callbackEdges = edges.filter(e => e.edgeType === 'callback' && nodeNames.has(e.targetName));

  // Get source name from node ID
  const nodeIdToName = new Map<string, string>();
  for (const node of displayNodes) {
    nodeIdToName.set(node.id, node.name);
  }

  const formatEdge = (edge: CallGraphEdge): string | null => {
    const sourceName = nodeIdToName.get(edge.source);
    if (!sourceName) return null;
    const sourceId = sanitizeMermaidId(sourceName);
    const targetId = sanitizeMermaidId(edge.targetName);
    const style = getMermaidEdgeStyle(edge, includeEdgeLabels);
    return `  ${sourceId} ${style} ${targetId}`;
  };

  if (renderEdges.length > 0) {
    lines.push('  %% Render relationships');
    for (const edge of renderEdges) {
      const formatted = formatEdge(edge);
      if (formatted) lines.push(formatted);
    }
    lines.push('');
  }

  if (hookEdges.length > 0) {
    lines.push('  %% Hook dependencies');
    for (const edge of hookEdges) {
      const formatted = formatEdge(edge);
      if (formatted) lines.push(formatted);
    }
    lines.push('');
  }

  if (callEdges.length > 0) {
    lines.push('  %% Function calls');
    for (const edge of callEdges) {
      const formatted = formatEdge(edge);
      if (formatted) lines.push(formatted);
    }
    lines.push('');
  }

  if (callbackEdges.length > 0) {
    lines.push('  %% Callback references');
    for (const edge of callbackEdges) {
      const formatted = formatEdge(edge);
      if (formatted) lines.push(formatted);
    }
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Graphviz DOT Generation
// ─────────────────────────────────────────────────────────────

interface DotOptions {
  title?: string;
  rankdir?: 'LR' | 'TB' | 'RL' | 'BT';
  maxNodes?: number;
  includeEdgeLabels?: boolean;
}

/**
 * Get DOT node attributes based on node type.
 */
function getDotNodeAttrs(node: CallGraphNode): string {
  const attrs: string[] = [];

  switch (node.nodeType) {
    case 'component':
      attrs.push('shape=box', 'style="rounded,filled"', 'fillcolor="#e1f5fe"');
      break;
    case 'hook':
      attrs.push('shape=ellipse', 'style=filled', 'fillcolor="#fff3e0"');
      break;
    case 'method':
      attrs.push('shape=box', 'style=filled', 'fillcolor="#f3e5f5"');
      break;
    case 'arrow':
    case 'function':
    default:
      attrs.push('shape=box', 'style=filled', 'fillcolor="#e8f5e9"');
      break;
  }

  if (node.async) {
    attrs.push('peripheries=2'); // Double border for async
  }

  return attrs.join(', ');
}

/**
 * Get DOT edge attributes based on edge type.
 */
function getDotEdgeAttrs(edge: CallGraphEdge, includeLabel: boolean): string {
  const attrs: string[] = [];

  if (includeLabel) {
    attrs.push(`label="${edge.edgeType}"`);
  }

  switch (edge.edgeType) {
    case 'hook':
      attrs.push('style=dashed', 'color="#ff9800"');
      break;
    case 'callback':
      attrs.push('style=dashed', 'color="#9c27b0"');
      break;
    case 'render':
      attrs.push('color="#2196f3"');
      break;
    case 'call':
    default:
      attrs.push('color="#4caf50"');
      break;
  }

  if (edge.conditional) {
    attrs.push('arrowhead=odiamond');
  }

  if (edge.inLoop) {
    attrs.push('penwidth=2');
  }

  return attrs.join(', ');
}

/**
 * Sanitize a name for use as a DOT node ID.
 */
function sanitizeDotId(name: string): string {
  // DOT allows most characters if quoted, but we'll keep it simple
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Generate a Graphviz DOT diagram from call graph data.
 */
export function generateDotGraph(
  nodes: CallGraphNode[],
  edges: CallGraphEdge[],
  options: DotOptions = {}
): string {
  const {
    title = 'CallGraph',
    rankdir = 'LR',
    maxNodes = 200,
    includeEdgeLabels = true,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push(`digraph ${sanitizeDotId(title)} {`);
  lines.push(`  rankdir=${rankdir};`);
  lines.push('  node [fontname="Arial", fontsize=10];');
  lines.push('  edge [fontname="Arial", fontsize=8];');
  lines.push('');

  // Limit nodes if needed
  const displayNodes = nodes.slice(0, maxNodes);
  const nodeNames = new Set(displayNodes.map(n => n.name));

  // Legend subgraph
  lines.push('  subgraph cluster_legend {');
  lines.push('    label="Legend";');
  lines.push('    fontsize=10;');
  lines.push('    style=dashed;');
  lines.push('    legend_component [label="Component" shape=box style="rounded,filled" fillcolor="#e1f5fe"];');
  lines.push('    legend_hook [label="Hook" shape=ellipse style=filled fillcolor="#fff3e0"];');
  lines.push('    legend_function [label="Function" shape=box style=filled fillcolor="#e8f5e9"];');
  lines.push('  }');
  lines.push('');

  // Node definitions
  lines.push('  // Nodes');
  for (const node of displayNodes) {
    const id = sanitizeDotId(node.name);
    const attrs = getDotNodeAttrs(node);
    lines.push(`  ${id} [label="${node.name}", ${attrs}];`);
  }
  lines.push('');

  // Edge definitions
  lines.push('  // Edges');

  // Build node ID to name mapping
  const nodeIdToName = new Map<string, string>();
  for (const node of displayNodes) {
    nodeIdToName.set(node.id, node.name);
  }

  for (const edge of edges) {
    const sourceName = nodeIdToName.get(edge.source);
    if (!sourceName || !nodeNames.has(edge.targetName)) continue;

    const sourceId = sanitizeDotId(sourceName);
    const targetId = sanitizeDotId(edge.targetName);
    const attrs = getDotEdgeAttrs(edge, includeEdgeLabels);
    lines.push(`  ${sourceId} -> ${targetId} [${attrs}];`);
  }

  lines.push('}');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// Cycle Visualization
// ─────────────────────────────────────────────────────────────

/**
 * Generate a Mermaid diagram highlighting circular dependencies.
 */
export function generateCyclesMermaid(
  nodes: CallGraphNode[],
  edges: CallGraphEdge[],
  cycles: string[][]
): string {
  if (cycles.length === 0) {
    return `flowchart LR\n  NoCircularDependencies[No circular dependencies detected]`;
  }

  const lines: string[] = [];
  lines.push('flowchart LR');
  lines.push('');

  // Collect all nodes involved in cycles
  const cycleNodeIds = new Set<string>();
  for (const cycle of cycles) {
    for (const nodeId of cycle) {
      cycleNodeIds.add(nodeId);
    }
  }

  // Map node IDs to names
  const nodeIdToNode = new Map<string, CallGraphNode>();
  for (const node of nodes) {
    nodeIdToNode.set(node.id, node);
  }

  // Define nodes in cycles
  lines.push('  %% Nodes in circular dependencies');
  for (const nodeId of cycleNodeIds) {
    const node = nodeIdToNode.get(nodeId);
    if (node) {
      const safeName = sanitizeMermaidId(node.name);
      lines.push(`  ${safeName}([${node.name}]):::cycle`);
    }
  }
  lines.push('');

  // Define edges within cycles
  lines.push('  %% Cycle edges');
  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];
    lines.push(`  %% Cycle ${i + 1}`);
    for (let j = 0; j < cycle.length; j++) {
      const sourceId = cycle[j];
      const targetId = cycle[(j + 1) % cycle.length];
      const sourceNode = nodeIdToNode.get(sourceId);
      const targetNode = nodeIdToNode.get(targetId);
      if (sourceNode && targetNode) {
        const sourceClean = sanitizeMermaidId(sourceNode.name);
        const targetClean = sanitizeMermaidId(targetNode.name);
        lines.push(`  ${sourceClean} -->|cycle| ${targetClean}`);
      }
    }
  }
  lines.push('');

  // Style for cycle nodes
  lines.push('  classDef cycle fill:#ffcdd2,stroke:#c62828,stroke-width:2px');

  return lines.join('\n');
}
