import type {
  VariableDeclaration,
  CallExpression,
  PropertyAccessExpression,
  ObjectLiteralExpression,
  Node,
  SourceFile,
} from "ts-morph";
import { SyntaxKind } from "ts-morph";
import * as path from "path";
import { project } from "../utils/project.js";
import {
  writeChunkedDiscovery,
  writeIncrementalChunkedDiscovery,
  readExistingManifest,
} from "../utils/output.js";

/**
 * Centralized security function detection pattern.
 * Expanded to catch more security-related transforms.
 */
const SECURITY_PATTERN =
  /sanitize|escape|encode|clean|strip|purify|xss|html|script|sql|inject|validate.*url|normalize|filter|whitelist|blacklist/i;

/**
 * Check if a function name indicates a security-related transform.
 */
function isSecurityFunction(funcName: string): boolean {
  return SECURITY_PATTERN.test(funcName);
}

/**
 * Extract feature name from validation file path.
 * Pattern: src/atomic-crm/validation/{feature}.ts → "feature"
 */
function extractFeatureName(filePath: string): string {
  return path.basename(filePath, ".ts");
}

/**
 * Schema symbol table entry for tracking schema variable properties.
 * Used in two-pass analysis to resolve transforms in referenced schemas.
 */
interface SchemaSymbol {
  hasTransform: boolean;
  hasPipe: boolean;
  transformDetails?: {
    functionName: string;
    isSecurity: boolean;
  };
}

/**
 * Schema field information extracted from Zod object schemas
 */
interface SchemaField {
  name: string;
  zodType: string; // "string", "coerce.number", "enum", etc.
  constraints: string[]; // ["max(255)", "min(1)", "email()"]
  optional: boolean;
  nullable: boolean;
  hasTransform: boolean;
  hasDefault: boolean;
  hasPipe?: boolean; // Track .pipe() chains after transforms
  pipedValidation?: string; // e.g., "z.string().url()"
  enumValues?: string[];
  transformDetails?: {
    functionName: string; // 'sanitizeHtml', 'urlAutoPrefix', 'toLowerCase'
    isSecurity: boolean; // true for sanitization functions
  };
}

/**
 * Zod schema information
 */
interface SchemaInfo {
  name: string;
  file: string;
  line: number;
  schemaType: "strictObject" | "object" | "enum" | "array" | "union" | "other";
  fields: SchemaField[];
  enumValues?: string[]; // For enum schemas
  relatedSchemas: string[];
  validationFunctions: string[];
  hasTransforms: boolean;
  hasSuperRefine: boolean;
}

/**
 * Detect the Zod schema type from the initializer expression
 */
function detectSchemaType(callExpr: CallExpression): SchemaInfo["schemaType"] {
  const expression = callExpr.getExpression();
  const exprText = expression.getText();

  // Use regex to handle whitespace/newlines in multi-line declarations
  // e.g., "z\n  .object" should match as "z.object"
  // Pattern: z (optional whitespace including newlines) . (method name) (end)

  if (/^z\s*\.\s*strictObject$/.test(exprText)) {
    return "strictObject";
  }

  if (/^z\s*\.\s*object$/.test(exprText)) {
    return "object";
  }

  if (/^z\s*\.\s*enum$/.test(exprText)) {
    return "enum";
  }

  if (/^z\s*\.\s*array$/.test(exprText)) {
    return "array";
  }

  if (/^z\s*\.\s*(union|discriminatedUnion)$/.test(exprText)) {
    return "union";
  }

  return "other";
}

/**
 * Extract enum values from z.enum([...]) call
 */
function extractEnumValues(callExpr: CallExpression): string[] {
  const args = callExpr.getArguments();
  if (args.length === 0) return [];

  const firstArg = args[0];
  if (firstArg.getKind() === SyntaxKind.ArrayLiteralExpression) {
    const arrayLiteral = firstArg.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
    return arrayLiteral.getElements().map((el) => {
      const text = el.getText();
      // Remove quotes from string literals
      return text.replace(/^["']|["']$/g, "");
    });
  }

  return [];
}

/**
 * Extract constraints from a Zod chain (e.g., .max(255), .min(1), .email())
 */
function extractConstraints(node: Node): string[] {
  const constraints: string[] = [];
  const text = node.getText();

  // Match constraint patterns like .max(255), .min(1), .email(), .trim()
  const constraintPattern =
    /\.(max|min|email|url|uuid|regex|length|trim|toLowerCase|toUpperCase)\(([^)]*)\)/g;
  let match;

  while ((match = constraintPattern.exec(text)) !== null) {
    const [, method, arg] = match;
    constraints.push(arg ? `${method}(${arg})` : `${method}()`);
  }

  return constraints;
}

/**
 * Detect if a chain includes .optional()
 */
function hasOptional(text: string): boolean {
  return /\.optional\(\)/.test(text);
}

/**
 * Detect if a chain includes .nullable()
 */
function hasNullable(text: string): boolean {
  return /\.nullable\(\)/.test(text) || /\.nullish\(\)/.test(text);
}

/**
 * Detect if a chain includes .transform()
 */
function hasTransform(text: string): boolean {
  return /\.transform\(/.test(text);
}

/**
 * Detect if a chain includes .default()
 */
function hasDefault(text: string): boolean {
  return /\.default\(/.test(text);
}

/**
 * Detect if a chain includes .pipe()
 */
function hasPipe(text: string): boolean {
  return /\.pipe\(/.test(text);
}

/**
 * AST-based transform detection for Node objects.
 * More reliable than regex for nested structures like z.union([...]).
 *
 * IMPORTANT: Checks BOTH the node itself AND its descendants.
 * In chains like z.string().refine().transform(), the .transform()
 * is the outermost CallExpression, not a descendant.
 */
function hasTransformInNode(node: Node): boolean {
  // Helper to check if a CallExpression is a .transform() call
  const isTransformCall = (callExpr: Node): boolean => {
    if (callExpr.getKind() !== SyntaxKind.CallExpression) return false;

    const expr = (callExpr as CallExpression).getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      if (propAccess.getName() === "transform") {
        return true;
      }
    }
    return false;
  };

  // Check the node itself (handles z.string().refine().transform() case)
  if (isTransformCall(node)) {
    return true;
  }

  // Check all descendant CallExpressions (handles nested transforms in unions, etc.)
  const callExprs = node.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of callExprs) {
    if (isTransformCall(call)) {
      return true;
    }
  }

  return false;
}

/**
 * AST-based extraction of transform details from a Node.
 * More reliable than regex for nested structures like z.union([...]).
 * Returns the first transform found with its function name and security status.
 */
function extractTransformDetailsFromNode(
  node: Node
): { functionName: string; isSecurity: boolean } | undefined {
  // Helper to check if a CallExpression is a .transform() call
  const isTransformCall = (callExpr: Node): boolean => {
    if (callExpr.getKind() !== SyntaxKind.CallExpression) return false;
    const expr = (callExpr as CallExpression).getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      return propAccess.getName() === "transform";
    }
    return false;
  };

  // Collect all transform calls (node itself + descendants)
  const transformCalls: CallExpression[] = [];

  if (isTransformCall(node)) {
    transformCalls.push(node as CallExpression);
  }

  const descendantCalls = node.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of descendantCalls) {
    if (isTransformCall(call)) {
      transformCalls.push(call);
    }
  }

  if (transformCalls.length === 0) return undefined;

  // Extract details from the first transform found
  const transformCall = transformCalls[0];
  const args = transformCall.getArguments();
  if (args.length === 0) {
    return { functionName: "unknown", isSecurity: false };
  }

  const firstArg = args[0];
  let functionName: string;

  // Case 1: Named function reference - transform(urlAutoPrefix)
  if (firstArg.getKind() === SyntaxKind.Identifier) {
    functionName = firstArg.getText();
  }
  // Case 2: Built-in constructor - transform(String), transform(Number), transform(Boolean)
  else if (["String", "Number", "Boolean"].includes(firstArg.getText())) {
    functionName = firstArg.getText();
  }
  // Case 3: Arrow function - transform((x) => x.toLowerCase())
  else if (firstArg.getKind() === SyntaxKind.ArrowFunction) {
    const arrowText = firstArg.getText();
    // Try to extract method name if it's a simple chain like x.toLowerCase()
    const methodMatch = arrowText.match(/\.\s*(\w+)\s*\(\s*\)/);
    if (methodMatch) {
      functionName = methodMatch[1];
    } else {
      // Check for ternary with function call: (val ? sanitizeHtml(val) : val)
      const ternaryFuncMatch = arrowText.match(/\?\s*(\w+)\s*\(/);
      if (ternaryFuncMatch) {
        functionName = ternaryFuncMatch[1];
      } else {
        functionName = "anonymous";
      }
    }
  }
  // Case 4: Function expression
  else if (firstArg.getKind() === SyntaxKind.FunctionExpression) {
    functionName = "inline";
  }
  // Default
  else {
    functionName = "unknown";
  }

  return {
    functionName,
    isSecurity: isSecurityFunction(functionName),
  };
}

/**
 * AST-based extraction of pipe content from a Node.
 * Handles nested parentheses that break simple regex patterns.
 * Returns the full text of what's being piped into.
 */
function extractPipeContent(node: Node): string | undefined {
  // Helper to check if a CallExpression is a .pipe() call
  const isPipeCall = (callExpr: Node): boolean => {
    if (callExpr.getKind() !== SyntaxKind.CallExpression) return false;
    const expr = (callExpr as CallExpression).getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      return propAccess.getName() === "pipe";
    }
    return false;
  };

  // Check node itself first
  if (isPipeCall(node)) {
    const args = (node as CallExpression).getArguments();
    if (args.length > 0) {
      return args[0].getText();
    }
  }

  // Check descendants
  const callExprs = node.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of callExprs) {
    if (isPipeCall(call)) {
      const args = call.getArguments();
      if (args.length > 0) {
        return args[0].getText();
      }
    }
  }

  return undefined;
}

/**
 * Build a symbol table mapping schema variable names to their transform details.
 * This enables two-pass analysis: first collect all schema properties,
 * then resolve references to inherited transforms.
 */
function buildSchemaSymbolTable(sourceFile: SourceFile): Map<string, SchemaSymbol> {
  const symbols = new Map<string, SchemaSymbol>();

  sourceFile.getVariableDeclarations().forEach((decl) => {
    const name = decl.getName();
    const init = decl.getInitializer();
    if (!init) return;

    const text = init.getText();
    // Only track Zod-related variables
    if (text.includes("z.") || name.includes("Schema") || name.includes("schema")) {
      // Use AST-based detection for more accurate results
      const hasTransformResult = hasTransformInNode(init);

      symbols.set(name, {
        hasTransform: hasTransformResult,
        hasPipe: hasPipe(text),
        transformDetails: hasTransformResult ? extractTransformDetails(text) : undefined,
      });
    }
  });

  return symbols;
}

/**
 * Extract transform function details from a Zod chain
 * Pattern: .transform((val) => functionName(val)) or .transform(functionName)
 */
function extractTransformDetails(
  text: string
): { functionName: string; isSecurity: boolean } | undefined {
  if (!hasTransform(text)) return undefined;

  // Pattern 1: .transform((val) => functionName(val)) or .transform((val) => (condition ? functionName(val) : val))
  // This matches sanitizeHtml in ternary: (val ? sanitizeHtml(val) : val)
  const arrowMatch = text.match(/\.transform\s*\(\s*\([^)]*\)\s*=>\s*(?:\([^)]*\?\s*)?(\w+)\s*\(/);
  if (arrowMatch) {
    const funcName = arrowMatch[1];
    // Skip common condition keywords
    if (funcName === "val" || funcName === "value") {
      // Try to find function call after ternary operator
      const ternaryMatch = text.match(/\.transform\s*\(\s*\([^)]*\)\s*=>\s*\([^?]+\?\s*(\w+)\s*\(/);
      if (ternaryMatch) {
        const ternaryFunc = ternaryMatch[1];
        return {
          functionName: ternaryFunc,
          isSecurity: isSecurityFunction(ternaryFunc),
        };
      }
    } else {
      return {
        functionName: funcName,
        isSecurity: isSecurityFunction(funcName),
      };
    }
  }

  // Pattern 2: .transform(functionName)
  const directMatch = text.match(/\.transform\s*\(\s*(\w+)\s*\)/);
  if (directMatch) {
    const funcName = directMatch[1];
    return {
      functionName: funcName,
      isSecurity: isSecurityFunction(funcName),
    };
  }

  // Pattern 3: .transform((val) => val.toLowerCase()) - inline method
  const methodMatch = text.match(/\.transform\s*\(\s*\([^)]*\)\s*=>\s*\w+\.(\w+)\s*\(\s*\)\s*\)/);
  if (methodMatch) {
    return {
      functionName: methodMatch[1],
      isSecurity: false,
    };
  }

  // Pattern 4: .transform(v => v ?? 'default') - nullish coalescing
  if (text.match(/\.transform\s*\(\s*\w+\s*=>\s*\w+\s*\?\?\s*/)) {
    return {
      functionName: "nullishCoalescing",
      isSecurity: false,
    };
  }

  // Pattern 5: .transform(v => v || 'default') - logical OR fallback
  if (text.match(/\.transform\s*\(\s*\w+\s*=>\s*\w+\s*\|\|\s*/)) {
    return {
      functionName: "logicalOrFallback",
      isSecurity: false,
    };
  }

  // Has transform but couldn't parse details
  return {
    functionName: "unknown",
    isSecurity: false,
  };
}

/**
 * Extract the base Zod type from a property value.
 * Uses symbol table to detect references to schema variables (with or without Schema suffix).
 */
function extractZodType(valueText: string, symbolTable?: Map<string, SchemaSymbol>): string {
  // Match z.xxx or z.coerce.xxx patterns
  const coerceMatch = valueText.match(/z\.coerce\.(string|number|boolean|date)/);
  if (coerceMatch) {
    return `coerce.${coerceMatch[1]}`;
  }

  const simpleMatch = valueText.match(
    /z\.(string|number|boolean|date|bigint|symbol|undefined|null|void|any|unknown|never|literal|enum|nativeEnum|array|object|strictObject|union|discriminatedUnion|intersection|tuple|record|map|set|function|lazy|promise|instanceof)/
  );
  if (simpleMatch) {
    return simpleMatch[1];
  }

  // Check for references to other schemas (with or without Schema suffix)
  if (!valueText.startsWith("z.")) {
    const identifierName = valueText.split(/[.(]/)[0];

    // If it exists in symbol table, it's a schema reference (handles isLinkedinUrl, etc.)
    if (symbolTable?.has(identifierName)) {
      return "ref:" + identifierName;
    }

    // Legacy: also check Schema suffix for backward compatibility
    if (/Schema/.test(valueText)) {
      return "ref:" + identifierName;
    }
  }

  return "unknown";
}

/**
 * Extract fields from a z.object() or z.strictObject() call.
 * Uses symbol table to resolve transforms in referenced schemas.
 */
function extractFields(
  callExpr: CallExpression,
  symbolTable?: Map<string, SchemaSymbol>
): SchemaField[] {
  const fields: SchemaField[] = [];
  const args = callExpr.getArguments();

  if (args.length === 0) return fields;

  const firstArg = args[0];
  if (firstArg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    return fields;
  }

  const objectLiteral = firstArg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

  for (const property of objectLiteral.getProperties()) {
    if (property.getKind() === SyntaxKind.PropertyAssignment) {
      const propAssignment = property.asKindOrThrow(SyntaxKind.PropertyAssignment);
      const name = propAssignment.getName();
      const initializer = propAssignment.getInitializer();

      if (!initializer) continue;

      const valueText = initializer.getText();
      const zodType = extractZodType(valueText, symbolTable);
      const constraints = extractConstraints(initializer);

      // Check for enum values if it's an enum type
      let enumValues: string[] | undefined;
      if (zodType === "enum") {
        // Try to find z.enum([...]) in the value
        const enumMatch = valueText.match(/z\.enum\(\s*\[([\s\S]*?)\]\s*\)/);
        if (enumMatch) {
          enumValues = enumMatch[1]
            .split(",")
            .map((v) => v.trim().replace(/^["']|["']$/g, ""))
            .filter((v) => v.length > 0);
        }
      }

      // Detect transforms - use multiple strategies for accuracy
      let fieldHasTransform = hasTransform(valueText);

      // Try AST-based extraction first (handles unions, nested transforms)
      let transformDetails = extractTransformDetailsFromNode(initializer);

      // Fallback to text-based extraction if AST didn't find details
      if (!transformDetails && fieldHasTransform) {
        transformDetails = extractTransformDetails(valueText);
      }

      // Strategy 1: If zodType is a reference, check symbol table for inherited transforms
      if (zodType.startsWith("ref:") && symbolTable) {
        const refName = zodType.slice(4); // Remove "ref:" prefix
        const symbolInfo = symbolTable.get(refName);
        if (symbolInfo?.hasTransform) {
          fieldHasTransform = true;
          // Inherit transform details from referenced schema if we don't have local ones
          if (!transformDetails && symbolInfo.transformDetails) {
            transformDetails = symbolInfo.transformDetails;
          }
        }
      }

      // Strategy 2: For union types, use AST-based detection to find nested transforms
      if (zodType === "union" || valueText.includes("z.union(")) {
        if (hasTransformInNode(initializer)) {
          fieldHasTransform = true;
          // Try to extract transform details if not already found
          if (!transformDetails) {
            transformDetails = extractTransformDetails(valueText);
          }
        }
      }

      // Strategy 3: Check for any identifier references in the value that might have transforms
      if (!fieldHasTransform && symbolTable) {
        // Look for schema references without "Schema" suffix (e.g., isLinkedinUrl)
        const identifierMatch = valueText.match(/^(\w+)\./);
        if (identifierMatch) {
          const refName = identifierMatch[1];
          const symbolInfo = symbolTable.get(refName);
          if (symbolInfo?.hasTransform) {
            fieldHasTransform = true;
            if (!transformDetails && symbolInfo.transformDetails) {
              transformDetails = symbolInfo.transformDetails;
            }
          }
        }
      }

      // Detect pipe chains
      let fieldHasPipe: boolean | undefined;
      let pipedValidation: string | undefined;
      if (hasPipe(valueText)) {
        fieldHasPipe = true;
        // Use AST extraction for accurate content (handles nested parentheses)
        pipedValidation = extractPipeContent(initializer);
        // Fallback to regex if AST fails
        if (!pipedValidation) {
          const pipeMatch = valueText.match(/\.pipe\s*\(\s*(z\.[^)]+)\s*\)/);
          pipedValidation = pipeMatch?.[1];
        }
      }

      // Inherit hasPipe from referenced schema if not detected locally
      if (!fieldHasPipe && zodType.startsWith("ref:") && symbolTable) {
        const refName = zodType.slice(4);
        const symbolInfo = symbolTable.get(refName);
        if (symbolInfo?.hasPipe) {
          fieldHasPipe = true;
        }
      }

      fields.push({
        name,
        zodType,
        constraints,
        optional: hasOptional(valueText),
        nullable: hasNullable(valueText),
        hasTransform: fieldHasTransform,
        hasDefault: hasDefault(valueText),
        ...(fieldHasPipe && { hasPipe: fieldHasPipe }),
        ...(pipedValidation && { pipedValidation }),
        ...(enumValues && { enumValues }),
        ...(transformDetails && { transformDetails }),
      });
    }
  }

  return fields;
}

/**
 * Extract fields directly from an ObjectLiteralExpression.
 * Used for multi-line schemas where findRootZodCall() returns null.
 * This is the core field extraction logic, also used by extractFields().
 */
function extractFieldsFromObjectLiteral(
  objectLiteral: ObjectLiteralExpression,
  symbolTable?: Map<string, SchemaSymbol>
): SchemaField[] {
  const fields: SchemaField[] = [];

  for (const property of objectLiteral.getProperties()) {
    if (property.getKind() === SyntaxKind.PropertyAssignment) {
      const propAssignment = property.asKindOrThrow(SyntaxKind.PropertyAssignment);
      const name = propAssignment.getName();
      const initializer = propAssignment.getInitializer();

      if (!initializer) continue;

      const valueText = initializer.getText();
      const zodType = extractZodType(valueText, symbolTable);
      const constraints = extractConstraints(initializer);

      // Check for enum values if it's an enum type
      let enumValues: string[] | undefined;
      if (zodType === "enum") {
        const enumMatch = valueText.match(/z\.enum\(\s*\[([\s\S]*?)\]\s*\)/);
        if (enumMatch) {
          enumValues = enumMatch[1]
            .split(",")
            .map((v) => v.trim().replace(/^["']|["']$/g, ""))
            .filter((v) => v.length > 0);
        }
      }

      // Detect transforms - use multiple strategies for accuracy
      let fieldHasTransform = hasTransform(valueText);

      // Try AST-based extraction first (handles unions, nested transforms)
      let transformDetails = extractTransformDetailsFromNode(initializer);

      // Fallback to text-based extraction if AST didn't find details
      if (!transformDetails && fieldHasTransform) {
        transformDetails = extractTransformDetails(valueText);
      }

      // Strategy 1: If zodType is a reference, check symbol table for inherited transforms
      if (zodType.startsWith("ref:") && symbolTable) {
        const refName = zodType.slice(4);
        const symbolInfo = symbolTable.get(refName);
        if (symbolInfo?.hasTransform) {
          fieldHasTransform = true;
          if (!transformDetails && symbolInfo.transformDetails) {
            transformDetails = symbolInfo.transformDetails;
          }
        }
      }

      // Strategy 2: For union types, use AST-based detection to find nested transforms
      if (zodType === "union" || valueText.includes("z.union(")) {
        if (hasTransformInNode(initializer)) {
          fieldHasTransform = true;
          if (!transformDetails) {
            transformDetails = extractTransformDetails(valueText);
          }
        }
      }

      // Strategy 3: Check for any identifier references in the value that might have transforms
      if (!fieldHasTransform && symbolTable) {
        const identifierMatch = valueText.match(/^(\w+)\./);
        if (identifierMatch) {
          const refName = identifierMatch[1];
          const symbolInfo = symbolTable.get(refName);
          if (symbolInfo?.hasTransform) {
            fieldHasTransform = true;
            if (!transformDetails && symbolInfo.transformDetails) {
              transformDetails = symbolInfo.transformDetails;
            }
          }
        }
      }

      // Detect pipe chains
      let fieldHasPipe: boolean | undefined;
      let pipedValidation: string | undefined;
      if (hasPipe(valueText)) {
        fieldHasPipe = true;
        pipedValidation = extractPipeContent(initializer);
        if (!pipedValidation) {
          const pipeMatch = valueText.match(/\.pipe\s*\(\s*(z\.[^)]+)\s*\)/);
          pipedValidation = pipeMatch?.[1];
        }
      }

      // Inherit hasPipe from referenced schema if not detected locally
      if (!fieldHasPipe && zodType.startsWith("ref:") && symbolTable) {
        const refName = zodType.slice(4);
        const symbolInfo = symbolTable.get(refName);
        if (symbolInfo?.hasPipe) {
          fieldHasPipe = true;
        }
      }

      fields.push({
        name,
        zodType,
        constraints,
        optional: hasOptional(valueText),
        nullable: hasNullable(valueText),
        hasTransform: fieldHasTransform,
        hasDefault: hasDefault(valueText),
        ...(fieldHasPipe && { hasPipe: fieldHasPipe }),
        ...(pipedValidation && { pipedValidation }),
        ...(enumValues && { enumValues }),
        ...(transformDetails && { transformDetails }),
      });
    }
  }

  return fields;
}

/**
 * Check if a schema has .superRefine() in its chain
 */
function hasSuperRefine(node: Node): boolean {
  return /\.superRefine\(/.test(node.getText());
}

/**
 * Find the root z.xxx() call in a chained expression
 */
function findRootZodCall(node: Node): CallExpression | null {
  // Walk up the chain to find the z.object/z.strictObject/z.enum call
  let current = node;

  // First, find the leftmost call expression in the chain
  while (current) {
    if (current.getKind() === SyntaxKind.CallExpression) {
      const callExpr = current as CallExpression;
      const expression = callExpr.getExpression();

      // Check if this is a z.xxx() call
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propAccess = expression as PropertyAccessExpression;
        const objText = propAccess.getExpression().getText();

        if (objText === "z") {
          return callExpr;
        }
      }

      // If expression is a call (chained), go deeper
      if (expression.getKind() === SyntaxKind.CallExpression) {
        current = expression;
        continue;
      }

      // If it's property access on a call, that call might be the root
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const innerExpr = (expression as PropertyAccessExpression).getExpression();
        if (innerExpr.getKind() === SyntaxKind.CallExpression) {
          current = innerExpr;
          continue;
        }
      }
    }

    break;
  }

  return null;
}

/**
 * Extract schema information from a variable declaration.
 * Uses symbol table to resolve transforms in referenced schemas.
 */
function extractSchemaFromDeclaration(
  decl: VariableDeclaration,
  filePath: string,
  symbolTable?: Map<string, SchemaSymbol>
): SchemaInfo | null {
  const name = decl.getName();

  // Only process declarations that look like schemas
  if (!name.includes("Schema") && !name.includes("schema")) {
    return null;
  }

  const initializer = decl.getInitializer();
  if (!initializer) return null;

  const initText = initializer.getText();

  // Must be a Zod schema (starts with z. or references another schema)
  if (!initText.includes("z.")) {
    return null;
  }

  // Find the root Zod call
  let rootCall: CallExpression | null = null;

  // If initializer is a call expression, try to find root
  if (initializer.getKind() === SyntaxKind.CallExpression) {
    rootCall = findRootZodCall(initializer);
  }

  // Determine schema type
  let schemaType: SchemaInfo["schemaType"] = "other";
  let fields: SchemaField[] = [];
  let enumValues: string[] | undefined;

  if (rootCall) {
    schemaType = detectSchemaType(rootCall);

    if (schemaType === "strictObject" || schemaType === "object") {
      fields = extractFields(rootCall, symbolTable);
    } else if (schemaType === "enum") {
      enumValues = extractEnumValues(rootCall);
    }
  } else {
    // Try to detect type from text patterns (handles multi-line schemas like z\n.object({...}))
    if (initText.includes("z.strictObject(")) {
      schemaType = "strictObject";
    } else if (initText.includes("z.object(")) {
      schemaType = "object";
    } else if (initText.includes("z.enum(")) {
      schemaType = "enum";
    } else if (initText.includes("z.array(")) {
      schemaType = "array";
    } else if (initText.includes("z.union(")) {
      schemaType = "union";
    }

    // For object schemas detected via text pattern, extract fields from ObjectLiteral
    if (schemaType === "strictObject" || schemaType === "object") {
      const objLiteralNodes = initializer.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
      if (objLiteralNodes.length > 0) {
        // Use the first ObjectLiteral (the schema fields definition)
        fields = extractFieldsFromObjectLiteral(objLiteralNodes[0], symbolTable);
      }
    }
  }

  return {
    name,
    file: path.relative(process.cwd(), filePath),
    line: decl.getStartLineNumber(),
    schemaType,
    fields,
    ...(enumValues && enumValues.length > 0 && { enumValues }),
    relatedSchemas: [], // Will be populated in post-processing
    validationFunctions: [], // Will be populated in post-processing
    hasTransforms: hasTransform(initText),
    hasSuperRefine: hasSuperRefine(initializer),
  };
}

/**
 * Find validation functions that use a schema
 */
function findValidationFunctions(
  sourceFile: SourceFile,
  schemaNames: Set<string>
): Map<string, string[]> {
  const schemaToFunctions = new Map<string, string[]>();

  // Initialize map
  for (const name of schemaNames) {
    schemaToFunctions.set(name, []);
  }

  // Find async functions that call .parse() or .safeParse()
  const functions = sourceFile.getFunctions();

  for (const func of functions) {
    const funcName = func.getName();
    if (!funcName) continue;

    const bodyText = func.getBodyText() || "";

    // Check if it contains .parse() or .safeParse() calls
    if (!bodyText.includes(".parse(") && !bodyText.includes(".safeParse(")) {
      continue;
    }

    // Check which schemas are referenced
    for (const schemaName of schemaNames) {
      if (bodyText.includes(schemaName)) {
        schemaToFunctions.get(schemaName)!.push(funcName);
      }
    }
  }

  return schemaToFunctions;
}

/**
 * Find related schemas (same base name, different suffixes like Base, Create, Update)
 */
function findRelatedSchemas(schemas: SchemaInfo[]): void {
  const schemaNames = new Set(schemas.map((s) => s.name));

  for (const schema of schemas) {
    const related: string[] = [];

    // Extract base name (remove Schema suffix and common prefixes)
    const baseName = schema.name
      .replace(/Schema$/, "")
      .replace(/^(create|update|import|quick|close)/i, "");

    // Look for schemas with similar base names
    for (const otherName of schemaNames) {
      if (otherName === schema.name) continue;

      const otherBase = otherName
        .replace(/Schema$/, "")
        .replace(/^(create|update|import|quick|close)/i, "");

      // Check if they share a common base
      if (
        baseName.toLowerCase() === otherBase.toLowerCase() ||
        otherName.toLowerCase().includes(baseName.toLowerCase()) ||
        baseName.toLowerCase().includes(otherBase.toLowerCase())
      ) {
        related.push(otherName);
      }
    }

    schema.relatedSchemas = related;
  }
}

/**
 * Main extraction function
 */
export async function extractSchemas(onlyChunks?: Set<string>): Promise<void> {
  console.log("📋 Extracting Zod schemas from src/atomic-crm/validation/**/*.ts...");

  const globs = ["src/atomic-crm/validation/**/*.ts"];

  // Use the return value to get ONLY the files matching our globs
  // (not all files accumulated in the project singleton)
  const sourceFiles = project.addSourceFilesAtPaths(globs);
  const schemas: SchemaInfo[] = [];
  const processedFiles = new Set<string>();

  // Filter source files if incremental mode
  let filesToProcess = sourceFiles;
  if (onlyChunks) {
    filesToProcess = sourceFiles.filter((sf) => {
      const chunkName = extractFeatureName(sf.getFilePath());
      return onlyChunks.has(chunkName);
    });
    console.log(
      `  📂 Incremental mode: processing ${filesToProcess.length} of ${sourceFiles.length} files`
    );
  }

  for (const sourceFile of filesToProcess) {
    const filePath = sourceFile.getFilePath();

    // Skip test files
    if (
      filePath.includes("__tests__") ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.")
    ) {
      continue;
    }

    // Skip node_modules
    if (filePath.includes("node_modules")) {
      continue;
    }

    processedFiles.add(filePath);

    // Build symbol table FIRST to enable transform resolution in referenced schemas
    // This is the key to fixing Bug 1 (linkedin_url) and Bug 3 (color)
    const symbolTable = buildSchemaSymbolTable(sourceFile);

    // Collect schema names from this file for validation function matching
    const fileSchemaNames = new Set<string>();

    // Find exported variable declarations
    const variableStatements = sourceFile.getVariableStatements();

    for (const varStmt of variableStatements) {
      if (!varStmt.isExported()) continue;

      for (const decl of varStmt.getDeclarations()) {
        const schemaInfo = extractSchemaFromDeclaration(decl, filePath, symbolTable);
        if (schemaInfo) {
          schemas.push(schemaInfo);
          fileSchemaNames.add(schemaInfo.name);
        }
      }
    }

    // Find validation functions for schemas in this file
    if (fileSchemaNames.size > 0) {
      const schemaToFunctions = findValidationFunctions(sourceFile, fileSchemaNames);

      for (const schema of schemas) {
        if (fileSchemaNames.has(schema.name)) {
          const funcs = schemaToFunctions.get(schema.name);
          if (funcs) {
            schema.validationFunctions = funcs;
          }
        }
      }
    }
  }

  // Post-process: find related schemas
  findRelatedSchemas(schemas);

  // Calculate summary statistics
  const strictObjectCount = schemas.filter((s) => s.schemaType === "strictObject").length;
  const objectCount = schemas.filter((s) => s.schemaType === "object").length;
  const enumCount = schemas.filter((s) => s.schemaType === "enum").length;
  const withTransforms = schemas.filter((s) => s.hasTransforms).length;
  const withSuperRefine = schemas.filter((s) => s.hasSuperRefine).length;

  // Group schemas by feature (validation file name)
  const chunks = new Map<string, SchemaInfo[]>();
  for (const schema of schemas) {
    const feature = extractFeatureName(schema.file);
    if (!chunks.has(feature)) {
      chunks.set(feature, []);
    }
    chunks.get(feature)!.push(schema);
  }

  // Build file-to-chunk mapping for incremental updates (exclude test files)
  const fileToChunkMapping = new Map<string, string>();
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    // Skip test files - they're not extracted so shouldn't be in chunk mapping
    if (
      filePath.includes("__tests__") ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.")
    ) {
      continue;
    }
    const chunkName = extractFeatureName(filePath);
    fileToChunkMapping.set(filePath, chunkName);
  }

  // Write output - incremental or full
  // Filter out test files from source paths (they're skipped during extraction, must also be excluded from manifest)
  const allSourceFilePaths = sourceFiles
    .map((sf) => sf.getFilePath())
    .filter((p) => !p.includes("__tests__") && !p.includes(".test.") && !p.includes(".spec."));

  if (onlyChunks) {
    // Incremental mode: merge with existing manifest
    const existingManifest = readExistingManifest("schemas-inventory");
    if (existingManifest) {
      writeIncrementalChunkedDiscovery(
        "schemas-inventory",
        "scripts/discover/extractors/schemas.ts",
        globs,
        allSourceFilePaths,
        chunks,
        fileToChunkMapping,
        existingManifest
      );
    } else {
      // Fallback to full write if manifest is missing
      console.log("  ⚠️  No existing manifest found, falling back to full write");
      writeChunkedDiscovery(
        "schemas-inventory",
        "scripts/discover/extractors/schemas.ts",
        globs,
        allSourceFilePaths,
        {
          total_items: schemas.length,
          total_chunks: chunks.size,
          strict_objects: strictObjectCount,
          objects: objectCount,
          enums: enumCount,
          with_transforms: withTransforms,
          with_super_refine: withSuperRefine,
        },
        chunks,
        fileToChunkMapping
      );
    }
  } else {
    // Full mode: write all chunks
    writeChunkedDiscovery(
      "schemas-inventory",
      "scripts/discover/extractors/schemas.ts",
      globs,
      allSourceFilePaths,
      {
        total_items: schemas.length,
        total_chunks: chunks.size,
        strict_objects: strictObjectCount,
        objects: objectCount,
        enums: enumCount,
        with_transforms: withTransforms,
        with_super_refine: withSuperRefine,
      },
      chunks,
      fileToChunkMapping
    );
  }

  console.log(`  ✓ Found ${schemas.length} Zod schemas`);
  console.log(`    - ${strictObjectCount} z.strictObject()`);
  console.log(`    - ${objectCount} z.object()`);
  console.log(`    - ${enumCount} z.enum()`);
  console.log(`    - ${withTransforms} with transforms`);
  console.log(`    - ${withSuperRefine} with superRefine`);
}

// Allow direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  extractSchemas().catch((error) => {
    console.error("❌ Error extracting schemas:", error);
    process.exit(1);
  });
}
