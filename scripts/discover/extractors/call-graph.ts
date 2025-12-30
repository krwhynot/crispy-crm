import { SyntaxKind } from "ts-morph";
import type { Node, SourceFile, FunctionDeclaration, VariableDeclaration, ArrowFunction } from "ts-morph";
import * as path from "path";
import { project } from "../utils/project.js";
import { writeChunkedDiscovery, writeIncrementalChunkedDiscovery, readExistingManifest } from "../utils/output.js";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CallGraphNode {
  id: string;           // "file:line:name"
  name: string;         // Function/component name
  file: string;         // Relative file path
  line: number;         // Declaration line
  nodeType: 'function' | 'component' | 'hook' | 'method' | 'arrow';
  exported: boolean;
  async: boolean;
}

export interface CallGraphEdge {
  source: string;       // Node ID of caller
  target: string;       // Node ID of callee (may be unresolved name)
  targetName: string;   // Name of the callee for display
  edgeType: 'call' | 'render' | 'hook' | 'callback';
  line: number;         // Line where call occurs
  conditional: boolean; // Inside if/ternary?
  inLoop: boolean;      // Inside loop?
}

interface CallGraphChunkData {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
}

// ─────────────────────────────────────────────────────────────
// Feature Extraction
// ─────────────────────────────────────────────────────────────

/**
 * Extract feature name from a file path for chunking.
 * e.g., "src/atomic-crm/contacts/ContactList.tsx" → "contacts"
 *       "src/hooks/useSmartDefaults.ts" → "hooks"
 */
function extractFeatureName(relativePath: string): string {
  // Pattern: src/atomic-crm/<feature>/...
  const atomicMatch = relativePath.match(/^src\/atomic-crm\/([^/]+)\//);
  if (atomicMatch) {
    return atomicMatch[1];
  }
  // Pattern: src/hooks/...
  if (relativePath.startsWith("src/hooks/")) {
    return "hooks";
  }
  // Files directly in src/atomic-crm/ go to "_root" chunk
  return "_root";
}

// ─────────────────────────────────────────────────────────────
// Node Type Detection
// ─────────────────────────────────────────────────────────────

/**
 * Determine if a name represents a React hook (starts with "use")
 */
function isHookName(name: string): boolean {
  return name.startsWith("use") && name.length > 3 && /[A-Z]/.test(name[3]);
}

/**
 * Determine if a name represents a React component (PascalCase)
 */
function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name) && !isHookName(name);
}

/**
 * Classify a function's node type based on its name and characteristics
 */
function classifyNodeType(name: string, isArrow: boolean): CallGraphNode['nodeType'] {
  if (isHookName(name)) return 'hook';
  if (isComponentName(name)) return 'component';
  if (isArrow) return 'arrow';
  return 'function';
}

// ─────────────────────────────────────────────────────────────
// Context Detection (Conditional / Loop)
// ─────────────────────────────────────────────────────────────

/**
 * Check if a node is inside a conditional statement (if/ternary)
 */
function isInConditional(node: Node): boolean {
  let parent = node.getParent();
  while (parent) {
    const kind = parent.getKind();
    if (
      kind === SyntaxKind.IfStatement ||
      kind === SyntaxKind.ConditionalExpression ||
      kind === SyntaxKind.SwitchStatement
    ) {
      return true;
    }
    // Stop at function boundary
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.FunctionExpression ||
      kind === SyntaxKind.ArrowFunction
    ) {
      break;
    }
    parent = parent.getParent();
  }
  return false;
}

/**
 * Check if a node is inside a loop statement
 */
function isInLoop(node: Node): boolean {
  let parent = node.getParent();
  while (parent) {
    const kind = parent.getKind();
    if (
      kind === SyntaxKind.ForStatement ||
      kind === SyntaxKind.ForInStatement ||
      kind === SyntaxKind.ForOfStatement ||
      kind === SyntaxKind.WhileStatement ||
      kind === SyntaxKind.DoStatement
    ) {
      return true;
    }
    // Stop at function boundary
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.FunctionExpression ||
      kind === SyntaxKind.ArrowFunction
    ) {
      break;
    }
    parent = parent.getParent();
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// Edge Extraction
// ─────────────────────────────────────────────────────────────

/**
 * Extract edges from call expressions within a function body
 */
function extractCallEdges(
  sourceNodeId: string,
  bodyNode: Node
): CallGraphEdge[] {
  const edges: CallGraphEdge[] = [];

  // Get all call expressions
  const callExpressions = bodyNode.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    let targetName: string | undefined;

    // Handle simple identifier calls: foo()
    if (expression.getKind() === SyntaxKind.Identifier) {
      targetName = expression.getText();
    }
    // Handle property access calls: obj.method()
    else if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      // Get just the method name, not the full path
      const propAccess = expression.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      targetName = propAccess.getName();
    }

    if (!targetName) continue;

    // Determine edge type
    let edgeType: CallGraphEdge['edgeType'] = 'call';
    if (isHookName(targetName)) {
      edgeType = 'hook';
    }

    edges.push({
      source: sourceNodeId,
      target: targetName, // Just the name, not fully resolved
      targetName,
      edgeType,
      line: callExpr.getStartLineNumber(),
      conditional: isInConditional(callExpr),
      inLoop: isInLoop(callExpr),
    });
  }

  return edges;
}

/**
 * Extract edges from JSX elements (component renders)
 */
function extractJsxEdges(
  sourceNodeId: string,
  bodyNode: Node
): CallGraphEdge[] {
  const edges: CallGraphEdge[] = [];

  // Get JSX elements: <Component>...</Component>
  const jsxElements = bodyNode.getDescendantsOfKind(SyntaxKind.JsxElement);
  for (const jsx of jsxElements) {
    const openingElement = jsx.getOpeningElement();
    const tagName = openingElement.getTagNameNode().getText();

    // Only track PascalCase components (not HTML elements like div, span)
    if (isComponentName(tagName)) {
      edges.push({
        source: sourceNodeId,
        target: tagName,
        targetName: tagName,
        edgeType: 'render',
        line: jsx.getStartLineNumber(),
        conditional: isInConditional(jsx),
        inLoop: isInLoop(jsx),
      });
    }

    // Extract callback props: onClick={handleSubmit}
    const attributes = openingElement.getAttributes();
    for (const attr of attributes) {
      if (attr.getKind() === SyntaxKind.JsxAttribute) {
        const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
        const initializer = jsxAttr.getInitializer();
        if (initializer?.getKind() === SyntaxKind.JsxExpression) {
          const expr = initializer.asKindOrThrow(SyntaxKind.JsxExpression);
          const exprNode = expr.getExpression();
          if (exprNode?.getKind() === SyntaxKind.Identifier) {
            const handlerName = exprNode.getText();
            // Only track function references (not inline arrow functions)
            if (/^(handle|on)[A-Z]/.test(handlerName) || handlerName.startsWith("handle")) {
              edges.push({
                source: sourceNodeId,
                target: handlerName,
                targetName: handlerName,
                edgeType: 'callback',
                line: attr.getStartLineNumber(),
                conditional: isInConditional(attr),
                inLoop: isInLoop(attr),
              });
            }
          }
        }
      }
    }
  }

  // Get self-closing JSX elements: <Component />
  const selfClosingElements = bodyNode.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  for (const jsx of selfClosingElements) {
    const tagName = jsx.getTagNameNode().getText();

    if (isComponentName(tagName)) {
      edges.push({
        source: sourceNodeId,
        target: tagName,
        targetName: tagName,
        edgeType: 'render',
        line: jsx.getStartLineNumber(),
        conditional: isInConditional(jsx),
        inLoop: isInLoop(jsx),
      });
    }

    // Extract callback props from self-closing elements too
    const attributes = jsx.getAttributes();
    for (const attr of attributes) {
      if (attr.getKind() === SyntaxKind.JsxAttribute) {
        const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
        const initializer = jsxAttr.getInitializer();
        if (initializer?.getKind() === SyntaxKind.JsxExpression) {
          const expr = initializer.asKindOrThrow(SyntaxKind.JsxExpression);
          const exprNode = expr.getExpression();
          if (exprNode?.getKind() === SyntaxKind.Identifier) {
            const handlerName = exprNode.getText();
            if (/^(handle|on)[A-Z]/.test(handlerName) || handlerName.startsWith("handle")) {
              edges.push({
                source: sourceNodeId,
                target: handlerName,
                targetName: handlerName,
                edgeType: 'callback',
                line: attr.getStartLineNumber(),
                conditional: isInConditional(attr),
                inLoop: isInLoop(attr),
              });
            }
          }
        }
      }
    }
  }

  return edges;
}

// ─────────────────────────────────────────────────────────────
// Tarjan's SCC Algorithm for Cycle Detection
// ─────────────────────────────────────────────────────────────

/**
 * Detect circular dependencies using Tarjan's Strongly Connected Components algorithm.
 * Returns arrays of node IDs that form cycles (SCCs with size > 1).
 */
export function detectCycles(nodes: CallGraphNode[], edges: CallGraphEdge[]): string[][] {
  // Build adjacency list
  const adjList = new Map<string, string[]>();
  const nodeIds = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    // Only consider edges where both source and target are known nodes
    if (nodeIds.has(edge.source)) {
      const neighbors = adjList.get(edge.source) || [];
      // For target, we need to find matching node by name
      const targetNode = nodes.find(n => n.name === edge.target);
      if (targetNode) {
        neighbors.push(targetNode.id);
        adjList.set(edge.source, neighbors);
      }
    }
  }

  // Tarjan's algorithm state
  let index = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const sccs: string[][] = [];

  function strongConnect(v: string): void {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adjList.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        // Successor w has not yet been visited
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        // Successor w is on stack, hence in current SCC
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    // If v is a root node, pop the stack and generate an SCC
    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      // Only report SCCs with more than one node (actual cycles)
      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  // Run algorithm on all nodes
  for (const node of nodes) {
    if (!indices.has(node.id)) {
      strongConnect(node.id);
    }
  }

  return sccs;
}

// ─────────────────────────────────────────────────────────────
// Node Extraction from Source Files
// ─────────────────────────────────────────────────────────────

/**
 * Extract nodes and edges from a function declaration
 */
function extractFromFunctionDeclaration(
  funcDecl: FunctionDeclaration,
  relativePath: string,
  exported: boolean
): { node: CallGraphNode; edges: CallGraphEdge[] } | null {
  const name = funcDecl.getName();
  if (!name) return null;

  const nodeId = `${relativePath}:${funcDecl.getStartLineNumber()}:${name}`;
  const isAsync = funcDecl.isAsync();

  const node: CallGraphNode = {
    id: nodeId,
    name,
    file: relativePath,
    line: funcDecl.getStartLineNumber(),
    nodeType: classifyNodeType(name, false),
    exported,
    async: isAsync,
  };

  // Extract edges from function body
  const body = funcDecl.getBody();
  if (!body) return { node, edges: [] };

  const callEdges = extractCallEdges(nodeId, body);
  const jsxEdges = extractJsxEdges(nodeId, body);

  return {
    node,
    edges: [...callEdges, ...jsxEdges],
  };
}

/**
 * Extract nodes and edges from a variable declaration (arrow function)
 */
function extractFromVariableDeclaration(
  varDecl: VariableDeclaration,
  relativePath: string,
  exported: boolean
): { node: CallGraphNode; edges: CallGraphEdge[] } | null {
  const name = varDecl.getName();
  const initializer = varDecl.getInitializer();

  if (!initializer) return null;

  // Only handle arrow functions and function expressions
  if (
    initializer.getKind() !== SyntaxKind.ArrowFunction &&
    initializer.getKind() !== SyntaxKind.FunctionExpression
  ) {
    return null;
  }

  const nodeId = `${relativePath}:${varDecl.getStartLineNumber()}:${name}`;
  const isArrow = initializer.getKind() === SyntaxKind.ArrowFunction;

  let isAsync = false;
  if (isArrow) {
    isAsync = (initializer as ArrowFunction).isAsync();
  }

  const node: CallGraphNode = {
    id: nodeId,
    name,
    file: relativePath,
    line: varDecl.getStartLineNumber(),
    nodeType: classifyNodeType(name, isArrow),
    exported,
    async: isAsync,
  };

  // Extract edges from function body
  const callEdges = extractCallEdges(nodeId, initializer);
  const jsxEdges = extractJsxEdges(nodeId, initializer);

  return {
    node,
    edges: [...callEdges, ...jsxEdges],
  };
}

/**
 * Process a single source file and extract its nodes and edges
 */
function processSourceFile(
  sourceFile: SourceFile,
  relativePath: string
): { nodes: CallGraphNode[]; edges: CallGraphEdge[] } {
  const nodes: CallGraphNode[] = [];
  const edges: CallGraphEdge[] = [];

  // Process exported function declarations
  const functionDeclarations = sourceFile.getFunctions();
  for (const funcDecl of functionDeclarations) {
    const exported = funcDecl.isExported() || funcDecl.isDefaultExport();
    const result = extractFromFunctionDeclaration(funcDecl, relativePath, exported);
    if (result) {
      nodes.push(result.node);
      edges.push(...result.edges);
    }
  }

  // Process exported variable declarations (arrow functions)
  const variableStatements = sourceFile.getVariableStatements();
  for (const varStmt of variableStatements) {
    const exported = varStmt.isExported();
    for (const decl of varStmt.getDeclarations()) {
      const result = extractFromVariableDeclaration(decl, relativePath, exported);
      if (result) {
        nodes.push(result.node);
        edges.push(...result.edges);
      }
    }
  }

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────
// Main Extraction Function
// ─────────────────────────────────────────────────────────────

export async function extractCallGraph(onlyChunks?: Set<string>): Promise<void> {
  console.log("📊 Extracting call graph from src/atomic-crm/**/*.{ts,tsx} and src/hooks/**/*.ts...");

  const sourceFiles = project.addSourceFilesAtPaths([
    "src/atomic-crm/**/*.ts",
    "src/atomic-crm/**/*.tsx",
    "src/hooks/**/*.ts",
  ]);

  // Filter out test files and node_modules
  const filteredFiles = sourceFiles.filter(sf => {
    const filePath = sf.getFilePath();
    return !filePath.includes("node_modules") &&
           !filePath.includes(".test.") &&
           !filePath.includes(".spec.") &&
           !filePath.includes("__tests__");
  });

  // Filter source files if incremental mode
  let filesToProcess = filteredFiles;
  if (onlyChunks) {
    filesToProcess = filteredFiles.filter(sf => {
      const relativePath = path.relative(process.cwd(), sf.getFilePath());
      const chunkName = extractFeatureName(relativePath);
      return onlyChunks.has(chunkName);
    });
    console.log(`  📂 Incremental mode: processing ${filesToProcess.length} of ${filteredFiles.length} files`);
  }

  // Collect all nodes and edges
  const allNodes: CallGraphNode[] = [];
  const allEdges: CallGraphEdge[] = [];

  for (const sourceFile of filesToProcess) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath);

    const { nodes, edges } = processSourceFile(sourceFile, relativePath);
    allNodes.push(...nodes);
    allEdges.push(...edges);
  }

  // Detect cycles
  const cycles = detectCycles(allNodes, allEdges);

  // Group by feature for chunked output
  const chunks = new Map<string, CallGraphChunkData>();

  for (const node of allNodes) {
    const feature = extractFeatureName(node.file);
    if (!chunks.has(feature)) {
      chunks.set(feature, { nodes: [], edges: [] });
    }
    chunks.get(feature)!.nodes.push(node);
  }

  // Assign edges to chunks based on source node
  const nodeToChunk = new Map<string, string>();
  for (const node of allNodes) {
    nodeToChunk.set(node.id, extractFeatureName(node.file));
  }

  // Track cross-chunk edges separately (unused but kept for future cross-chunk analysis)
  const _crossChunkEdges: CallGraphEdge[] = [];

  for (const edge of allEdges) {
    const sourceChunk = nodeToChunk.get(edge.source);
    if (sourceChunk) {
      chunks.get(sourceChunk)!.edges.push(edge);
    }
  }

  // Count totals
  const totalNodes = allNodes.length;
  const totalEdges = allEdges.length;
  const cyclesDetected = cycles.length;

  // Prepare file paths for staleness detection
  const sourceFilePaths = filteredFiles.map(sf => sf.getFilePath());

  // Build file-to-chunk mapping
  const fileToChunkMapping = new Map<string, string>();
  for (const sourceFile of filteredFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath);
    const chunkName = extractFeatureName(relativePath);
    fileToChunkMapping.set(filePath, chunkName);
  }

  // Write output
  if (onlyChunks) {
    const existingManifest = readExistingManifest("call-graph-inventory");
    if (existingManifest) {
      writeIncrementalChunkedDiscovery(
        "call-graph-inventory",
        "scripts/discover/extractors/call-graph.ts",
        ["src/atomic-crm/**/*.ts", "src/atomic-crm/**/*.tsx", "src/hooks/**/*.ts"],
        sourceFilePaths,
        chunks,
        fileToChunkMapping,
        existingManifest
      );
    } else {
      console.log("  ⚠️  No existing manifest found, falling back to full write");
      writeChunkedDiscovery(
        "call-graph-inventory",
        "scripts/discover/extractors/call-graph.ts",
        ["src/atomic-crm/**/*.ts", "src/atomic-crm/**/*.tsx", "src/hooks/**/*.ts"],
        sourceFilePaths,
        {
          total_items: totalNodes,
          total_nodes: totalNodes,
          total_edges: totalEdges,
          total_chunks: chunks.size,
          cycles_detected: cyclesDetected,
        },
        chunks,
        fileToChunkMapping
      );
    }
  } else {
    writeChunkedDiscovery(
      "call-graph-inventory",
      "scripts/discover/extractors/call-graph.ts",
      ["src/atomic-crm/**/*.ts", "src/atomic-crm/**/*.tsx", "src/hooks/**/*.ts"],
      sourceFilePaths,
      {
        total_items: totalNodes,
        total_nodes: totalNodes,
        total_edges: totalEdges,
        total_chunks: chunks.size,
        cycles_detected: cyclesDetected,
      },
      chunks,
      fileToChunkMapping
    );
  }

  // Log summary
  console.log(`  ✓ Found ${totalNodes} nodes, ${totalEdges} edges`);
  if (cyclesDetected > 0) {
    console.log(`  ⚠️  Detected ${cyclesDetected} circular dependency cycle(s)`);
    for (const cycle of cycles) {
      const names = cycle.map(id => id.split(":").pop()).join(" → ");
      console.log(`      ${names}`);
    }
  }
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  extractCallGraph().catch((error) => {
    console.error("❌ Error extracting call graph:", error);
    process.exit(1);
  });
}
