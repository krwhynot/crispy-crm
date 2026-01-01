import { SyntaxKind } from "ts-morph";
import type {
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  FunctionExpression,
} from "ts-morph";
import { project } from "../utils/project.js";
import { writeChunkedDiscovery } from "../utils/output.js";
import * as path from "path";

/**
 * Get chunk name for a hook based on its file path.
 * Groups hooks by feature directory for token-efficient loading.
 */
function getChunkName(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath);

  // Feature-specific hooks: src/atomic-crm/<feature>/... → "feature"
  const featureMatch = relativePath.match(/^src\/atomic-crm\/([^/]+)\//);
  if (featureMatch) return featureMatch[1];

  // Shared hooks: src/hooks/... → "shared"
  if (relativePath.startsWith("src/hooks/")) return "shared";

  // Component hooks: src/components/... → "components"
  if (relativePath.startsWith("src/components/")) return "components";

  return "_root";
}

interface HookInfo {
  name: string;
  file: string;
  line: number;
  parameters: string[];
  returnType: string;
  dependencies: string[];
  isReact19Action: boolean;
}

const REACT_19_ACTION_HOOKS = new Set(["useActionState", "useFormStatus", "useOptimistic"]);

function isHookName(name: string): boolean {
  return name.startsWith("use") && name.length > 3;
}

function extractHookDependencies(functionBody: string, hookName: string): string[] {
  const dependencies = new Set<string>();

  const hookCallPattern = /\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g;
  let match;

  while ((match = hookCallPattern.exec(functionBody)) !== null) {
    const depName = match[1];
    if (depName !== hookName) {
      dependencies.add(depName);
    }
  }

  return Array.from(dependencies).sort();
}

function extractFromFunctionDeclaration(
  decl: FunctionDeclaration,
  filePath: string
): HookInfo | null {
  const name = decl.getName();
  if (!name || !isHookName(name)) return null;

  const params = decl.getParameters().map((p) => p.getName());
  const returnType = decl.getReturnType().getText(decl);
  const functionBody = decl.getBodyText() || "";

  const dependencies = extractHookDependencies(functionBody, name);
  const isReact19Action =
    REACT_19_ACTION_HOOKS.has(name) || dependencies.some((dep) => REACT_19_ACTION_HOOKS.has(dep));

  return {
    name,
    file: path.relative(process.cwd(), filePath),
    line: decl.getStartLineNumber(),
    parameters: params,
    returnType: returnType === "void" ? "void" : returnType || "unknown",
    dependencies,
    isReact19Action,
  };
}

function extractFromVariableDeclaration(
  decl: VariableDeclaration,
  filePath: string
): HookInfo | null {
  const name = decl.getName();
  if (!isHookName(name)) return null;

  const initializer = decl.getInitializer();
  if (!initializer) return null;

  let params: string[] = [];
  let returnType = "unknown";
  let functionBody = "";

  if (initializer.getKind() === SyntaxKind.ArrowFunction) {
    const arrowFunc = initializer as ArrowFunction;
    params = arrowFunc.getParameters().map((p) => p.getName());
    returnType = arrowFunc.getReturnType().getText(arrowFunc);
    functionBody = arrowFunc.getBodyText() || "";
  } else if (initializer.getKind() === SyntaxKind.FunctionExpression) {
    const funcExpr = initializer as FunctionExpression;
    params = funcExpr.getParameters().map((p) => p.getName());
    returnType = funcExpr.getReturnType().getText(funcExpr);
    functionBody = funcExpr.getBodyText() || "";
  } else {
    return null;
  }

  const dependencies = extractHookDependencies(functionBody, name);
  const isReact19Action =
    REACT_19_ACTION_HOOKS.has(name) || dependencies.some((dep) => REACT_19_ACTION_HOOKS.has(dep));

  return {
    name,
    file: path.relative(process.cwd(), filePath),
    line: decl.getStartLineNumber(),
    parameters: params,
    returnType: returnType === "void" ? "void" : returnType || "unknown",
    dependencies,
    isReact19Action,
  };
}

export async function extractHooks(onlyChunks?: Set<string>): Promise<void> {
  console.log("🪝 Extracting custom hooks...");

  const globs = ["src/**/use*.ts", "src/**/use*.tsx", "src/**/*.ts", "src/**/*.tsx"];

  // Use return value directly - getSourceFiles() returns stale cached files
  const allSourceFiles = project.addSourceFilesAtPaths(globs);

  // Filter to only process files from stale chunks (incremental mode)
  const sourceFiles = onlyChunks
    ? allSourceFiles.filter((sf) => {
        const chunkName = getChunkName(sf.getFilePath());
        return onlyChunks.has(chunkName);
      })
    : allSourceFiles;

  const hooks: HookInfo[] = [];
  const processedFiles = new Set<string>();

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();

    if (
      filePath.includes("node_modules") ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.")
    ) {
      continue;
    }

    processedFiles.add(filePath);

    const functionDeclarations = sourceFile.getFunctions();
    for (const funcDecl of functionDeclarations) {
      if (funcDecl.isExported() || funcDecl.isDefaultExport()) {
        const hookInfo = extractFromFunctionDeclaration(funcDecl, filePath);
        if (hookInfo) {
          hooks.push(hookInfo);
        }
      }
    }

    const variableStatements = sourceFile.getVariableStatements();
    for (const varStmt of variableStatements) {
      if (varStmt.isExported()) {
        for (const decl of varStmt.getDeclarations()) {
          const hookInfo = extractFromVariableDeclaration(decl, filePath);
          if (hookInfo) {
            hooks.push(hookInfo);
          }
        }
      }
    }
  }

  const react19ActionCount = hooks.filter((h) => h.isReact19Action).length;
  const standardHookCount = hooks.length - react19ActionCount;

  // Group hooks by chunk for token-efficient loading
  const hooksByChunk = new Map<string, HookInfo[]>();
  const fileToChunkMapping = new Map<string, string>();

  for (const hook of hooks) {
    const chunkName = getChunkName(hook.file);

    if (!hooksByChunk.has(chunkName)) {
      hooksByChunk.set(chunkName, []);
    }
    hooksByChunk.get(chunkName)!.push(hook);

    // Map absolute path for fileToChunkMapping
    const absolutePath = path.resolve(process.cwd(), hook.file);
    fileToChunkMapping.set(absolutePath, chunkName);
  }

  // Write chunked output
  writeChunkedDiscovery(
    "hooks-inventory",
    "scripts/discover/extractors/hooks.ts",
    globs,
    Array.from(processedFiles),
    {
      total_items: hooks.length,
      react19_actions: react19ActionCount,
      standard_hooks: standardHookCount,
    },
    hooksByChunk,
    fileToChunkMapping
  );

  console.log(`  ✓ Found ${hooks.length} custom hooks in ${hooksByChunk.size} chunks`);
  console.log(`    - ${standardHookCount} standard hooks`);
  console.log(`    - ${react19ActionCount} React 19 action hooks`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extractHooks().catch((error) => {
    console.error("❌ Error extracting hooks:", error);
    process.exit(1);
  });
}
