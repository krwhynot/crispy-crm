import { SyntaxKind } from "ts-morph";
import * as path from "path";
import { project } from "../utils/project.js";
import { createEnvelope, writeDiscoveryFile } from "../utils/output.js";

interface ComponentInfo {
  name: string;
  file: string;
  line: number;
  type: "form_controller" | "presentational";
  hooks: string[];
  imports: string[];
  isDefaultExport: boolean;
}

export async function extractComponents(): Promise<void> {
  console.log("🔍 Scanning React components in src/atomic-crm/**/*.tsx...");

  const sourceFiles = project.addSourceFilesAtPaths("src/atomic-crm/**/*.tsx");
  const components: ComponentInfo[] = [];

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(process.cwd(), filePath);

    const exportedDeclarations = sourceFile.getExportedDeclarations();

    for (const [exportName, declarations] of exportedDeclarations) {
      for (const declaration of declarations) {
        let componentName: string | undefined;
        let lineNumber: number | undefined;
        let isDefaultExport = false;

        if (declaration.getKind() === SyntaxKind.FunctionDeclaration) {
          const funcDecl = declaration.asKindOrThrow(SyntaxKind.FunctionDeclaration);
          componentName = funcDecl.getName();
          lineNumber = funcDecl.getStartLineNumber();
          isDefaultExport = exportName === "default";
        } else if (declaration.getKind() === SyntaxKind.VariableDeclaration) {
          const varDecl = declaration.asKindOrThrow(SyntaxKind.VariableDeclaration);
          componentName = varDecl.getName();
          lineNumber = varDecl.getStartLineNumber();

          const exportDecl = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
          isDefaultExport = exportDecl?.hasExportKeyword() === false && exportName === "default";
        }

        if (!componentName || !lineNumber) {
          continue;
        }

        const sourceFileForComponent = declaration.getSourceFile();
        const hooks = extractHooks(sourceFileForComponent);
        const imports = extractImportSources(sourceFileForComponent);

        const type = determineComponentType(hooks);

        components.push({
          name: componentName,
          file: relativePath,
          line: lineNumber,
          type,
          hooks,
          imports,
          isDefaultExport,
        });
      }
    }
  }

  const formControllers = components.filter(c => c.type === "form_controller").length;
  const presentational = components.filter(c => c.type === "presentational").length;

  const sourceFilePaths = sourceFiles.map(sf => sf.getFilePath());

  const envelope = createEnvelope(
    "scripts/discover/extractors/components.ts",
    ["src/atomic-crm/**/*.tsx"],
    sourceFilePaths,
    {
      total_items: components.length,
      form_controllers: formControllers,
      presentational,
    },
    { components }
  );

  writeDiscoveryFile("component-inventory.json", envelope);
}

function extractHooks(sourceFile: any): string[] {
  const hooks = new Set<string>();

  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();

    if (expression.getKind() === SyntaxKind.Identifier) {
      const text = expression.getText();
      if (text.startsWith("use") && text.length > 3 && text[3] === text[3].toUpperCase()) {
        hooks.add(text);
      }
    }
  }

  return Array.from(hooks).sort();
}

function extractImportSources(sourceFile: any): string[] {
  const importSources = new Set<string>();

  const importDeclarations = sourceFile.getImportDeclarations();

  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    importSources.add(moduleSpecifier);
  }

  return Array.from(importSources).sort();
}

function determineComponentType(hooks: string[]): "form_controller" | "presentational" {
  const formControllerHooks = ["useActionState", "useFormStatus"];

  for (const hook of hooks) {
    if (formControllerHooks.includes(hook)) {
      return "form_controller";
    }
  }

  return "presentational";
}
