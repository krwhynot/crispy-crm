import { SyntaxKind, FunctionDeclaration, VariableDeclaration } from "ts-morph";
import * as path from "path";
import { project } from "../utils/project.js";
import { writeChunkedDiscovery, writeIncrementalChunkedDiscovery, readExistingManifest } from "../utils/output.js";

/**
 * Validation service information
 */
interface ValidationServiceInfo {
  name: string;
  file: string;
  line: number;
  type: 'validator' | 'formatter' | 'custom';
  schemaReference?: string;
  errorFormatting: boolean;
  isAsync: boolean;
  customValidators: string[];
}

/**
 * Custom validator function info
 */
interface CustomValidatorInfo {
  name: string;
  file: string;
  line: number;
  pattern: string;
}

/**
 * Detect if function formats Zod errors for React Admin
 */
function detectsErrorFormatting(funcText: string): boolean {
  const patterns = [
    /z\.ZodError/,
    /error\.issues/,
    /err\.path\.join/,
    /formattedErrors/,
    /body:\s*\{\s*errors/,
  ];
  return patterns.some(p => p.test(funcText));
}

/**
 * Extract schema reference from validation function
 */
function extractSchemaReference(funcText: string): string | undefined {
  const match = funcText.match(/(\w+Schema)\.(?:safe)?[Pp]arse/);
  return match ? match[1] : undefined;
}

/**
 * Detect custom validator functions (non-Zod helpers)
 */
function isCustomValidator(name: string, funcText: string): boolean {
  const validatorPatterns = [
    /^is[A-Z]/,
    /^validate[A-Z]/,
    /^check[A-Z]/,
  ];

  const usesZod = /z\.\w+/.test(funcText);

  return validatorPatterns.some(p => p.test(name)) && !usesZod;
}

/**
 * Detect what a custom validator validates
 */
function detectValidatorPattern(name: string, funcText: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('url')) return 'url';
  if (lowerName.includes('email')) return 'email';
  if (lowerName.includes('phone')) return 'phone';
  if (lowerName.includes('date')) return 'date';
  if (lowerName.includes('linkedin')) return 'linkedin-url';
  return 'unknown';
}

/**
 * Extract feature name from file path for chunking
 */
function extractFeatureName(filePath: string): string {
  return path.basename(filePath, '.ts');
}

/**
 * Main extraction function
 */
export async function extractValidationServices(onlyChunks?: Set<string>): Promise<void> {
  console.log("🔐 Extracting validation services from src/atomic-crm/validation/**/*.ts...");

  const globs = ["src/atomic-crm/validation/**/*.ts"];
  const sourceFiles = project.addSourceFilesAtPaths(globs);

  // Filter source files if incremental mode
  let filesToProcess = sourceFiles;
  if (onlyChunks) {
    filesToProcess = sourceFiles.filter(sf => {
      const chunkName = extractFeatureName(sf.getFilePath());
      return onlyChunks.has(chunkName);
    });
    console.log(`  📂 Incremental mode: processing ${filesToProcess.length} of ${sourceFiles.length} files`);
  }

  const services: ValidationServiceInfo[] = [];
  const customValidators: CustomValidatorInfo[] = [];
  const processedFiles = new Set<string>();
  const chunks = new Map<string, (ValidationServiceInfo | CustomValidatorInfo)[]>();

  for (const sourceFile of filesToProcess) {
    const filePath = sourceFile.getFilePath();

    if (filePath.includes("__tests__") || filePath.includes(".test.") || filePath.endsWith("index.ts")) {
      continue;
    }

    processedFiles.add(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const featureName = extractFeatureName(relativePath);

    if (!chunks.has(featureName)) {
      chunks.set(featureName, []);
    }

    const fileCustomValidators: string[] = [];

    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (!func.isExported()) continue;

      const name = func.getName();
      if (!name) continue;

      const funcText = func.getText();
      const isAsync = func.isAsync();

      if (isCustomValidator(name, funcText)) {
        const validator: CustomValidatorInfo = {
          name,
          file: relativePath,
          line: func.getStartLineNumber(),
          pattern: detectValidatorPattern(name, funcText),
        };
        customValidators.push(validator);
        fileCustomValidators.push(name);
        chunks.get(featureName)!.push(validator);
        continue;
      }

      if (funcText.includes('.parse(') || funcText.includes('.safeParse(')) {
        const service: ValidationServiceInfo = {
          name,
          file: relativePath,
          line: func.getStartLineNumber(),
          type: detectsErrorFormatting(funcText) ? 'formatter' : 'validator',
          schemaReference: extractSchemaReference(funcText),
          errorFormatting: detectsErrorFormatting(funcText),
          isAsync,
          customValidators: fileCustomValidators,
        };
        services.push(service);
        chunks.get(featureName)!.push(service);
      }
    }

    const variableStatements = sourceFile.getVariableStatements();
    for (const varStmt of variableStatements) {
      if (!varStmt.isExported()) continue;

      for (const decl of varStmt.getDeclarations()) {
        const name = decl.getName();
        const initializer = decl.getInitializer();
        if (!initializer) continue;

        const funcText = initializer.getText();

        if (isCustomValidator(name, funcText)) {
          const validator: CustomValidatorInfo = {
            name,
            file: relativePath,
            line: decl.getStartLineNumber(),
            pattern: detectValidatorPattern(name, funcText),
          };
          customValidators.push(validator);
          fileCustomValidators.push(name);
          chunks.get(featureName)!.push(validator);
        }
      }
    }
  }

  // Build file-to-chunk mapping from ALL source files (not just processed ones)
  // This is critical for incremental mode to preserve fresh chunks
  const fileToChunkMapping = new Map<string, string>();
  const allSourceFilePaths: string[] = [];
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    // Skip test files and index.ts (same filters as processing loop)
    if (filePath.includes("__tests__") || filePath.includes(".test.") || filePath.endsWith("index.ts")) {
      continue;
    }
    const chunkName = extractFeatureName(filePath);
    fileToChunkMapping.set(filePath, chunkName);
    allSourceFilePaths.push(filePath);
  }

  if (onlyChunks) {
    // Incremental mode: merge with existing manifest
    const existingManifest = readExistingManifest("validation-services-inventory");
    if (existingManifest) {
      writeIncrementalChunkedDiscovery(
        "validation-services-inventory",
        "scripts/discover/extractors/validation-services.ts",
        globs,
        allSourceFilePaths,
        chunks as Map<string, unknown[]>,
        fileToChunkMapping,
        existingManifest
      );
    } else {
      console.log("  ⚠️  No existing manifest found, falling back to full write");
      writeChunkedDiscovery(
        "validation-services-inventory",
        "scripts/discover/extractors/validation-services.ts",
        globs,
        allSourceFilePaths,
        {
          total_items: services.length + customValidators.length,
          total_chunks: chunks.size,
          services: services.length,
          custom_validators: customValidators.length,
          with_error_formatting: services.filter(s => s.errorFormatting).length,
        },
        chunks as Map<string, unknown[]>,
        fileToChunkMapping
      );
    }
  } else {
    // Full mode: write all chunks
    writeChunkedDiscovery(
      "validation-services-inventory",
      "scripts/discover/extractors/validation-services.ts",
      globs,
      allSourceFilePaths,
      {
        total_items: services.length + customValidators.length,
        total_chunks: chunks.size,
        services: services.length,
        custom_validators: customValidators.length,
        with_error_formatting: services.filter(s => s.errorFormatting).length,
      },
      chunks as Map<string, unknown[]>,
      fileToChunkMapping
    );
  }

  console.log(`  ✓ Found ${services.length} validation services`);
  console.log(`    - ${customValidators.length} custom validators`);
  console.log(`    - ${services.filter(s => s.errorFormatting).length} with error formatting`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extractValidationServices().catch((error) => {
    console.error("❌ Error extracting validation services:", error);
    process.exit(1);
  });
}
