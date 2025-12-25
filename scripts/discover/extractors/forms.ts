import { SyntaxKind, SourceFile, Node, JsxElement, JsxSelfClosingElement } from "ts-morph";
import * as path from "path";
import { project } from "../utils/project.js";
import { createEnvelope, writeDiscoveryFile } from "../utils/output.js";

/**
 * Form information extracted from React components.
 * Detects React Admin forms, React Hook Form, and React 19 action patterns.
 */
interface FormInfo {
  componentName: string;
  file: string;
  line: number;
  formType:
    | "react-admin-simple"
    | "react-admin-tabbed"
    | "react-admin-wizard"
    | "react-hook-form-direct"
    | "react19-action"
    | "unknown";
  formPatterns: {
    primary: string;
    secondary: string[];
  };
  inputComponents: string[];
  validationSchemaRef?: string;
  hasZodResolver: boolean;
  features: {
    hasTabs: boolean;
    hasWizard: boolean;
    hasProgress: boolean;
  };
  componentChain: string[];
  inputComponentsDeep: string[];
  formContextWrappers: string[];
}

// React Admin form wrapper components
const REACT_ADMIN_FORM_COMPONENTS = new Set([
  "Form",
  "SimpleForm",
  "TabbedForm",
  "CreateBase",
  "EditBase",
]);

// React 19 form hooks
const REACT_19_FORM_HOOKS = new Set(["useActionState", "useFormStatus"]);

// React Hook Form hooks
const REACT_HOOK_FORM_HOOKS = new Set([
  "useForm",
  "useFormContext",
  "useFormState",
  "useWatch",
  "useFieldArray",
]);

// Tab-related components
const TAB_COMPONENTS = new Set([
  "TabbedForm",
  "TabbedFormInputs",
  "FormTab",
  "Tab",
  "Tabs",
]);

// Wizard components
const WIZARD_COMPONENTS = new Set(["FormWizard", "WizardForm", "Wizard"]);

// Progress components
const PROGRESS_COMPONENTS = new Set([
  "FormProgressProvider",
  "FormProgressBar",
  "Progress",
]);

/**
 * Extract all JSX element names from a node tree.
 */
function extractJsxElements(node: Node): Set<string> {
  const elements = new Set<string>();

  // Get all JSX elements (opening tags with children)
  const jsxElements = node.getDescendantsOfKind(SyntaxKind.JsxElement);
  for (const el of jsxElements) {
    const openingElement = el.getOpeningElement();
    const tagName = openingElement.getTagNameNode().getText();
    elements.add(tagName);
  }

  // Get all self-closing JSX elements
  const selfClosing = node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  for (const el of selfClosing) {
    const tagName = el.getTagNameNode().getText();
    elements.add(tagName);
  }

  return elements;
}

/**
 * Extract hook calls from a component.
 */
function extractHookCalls(node: Node): Set<string> {
  const hooks = new Set<string>();

  const callExpressions = node.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    if (expression.getKind() === SyntaxKind.Identifier) {
      const text = expression.getText();
      if (text.startsWith("use") && text.length > 3) {
        hooks.add(text);
      }
    }
  }

  return hooks;
}

/**
 * Detect zodResolver usage and extract the schema name.
 */
function extractZodResolver(node: Node): { hasResolver: boolean; schemaName?: string } {
  const callExpressions = node.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    if (expression.getText() === "zodResolver") {
      const args = callExpr.getArguments();
      if (args.length > 0) {
        return {
          hasResolver: true,
          schemaName: args[0].getText(),
        };
      }
      return { hasResolver: true };
    }
  }

  return { hasResolver: false };
}

/**
 * Extract input component names (components ending with "Input").
 */
function extractInputComponents(jsxElements: Set<string>): string[] {
  const inputs: string[] = [];
  for (const el of jsxElements) {
    if (el.endsWith("Input") || el.endsWith("Autocomplete") || el.endsWith("Select")) {
      inputs.push(el);
    }
  }
  return inputs.sort();
}

/**
 * Recursively scan JSX for input components
 * Looks for components ending in Input, Select, Checkbox, etc.
 */
function extractInputComponentsDeep(sourceFile: SourceFile): string[] {
  const inputs = new Set<string>();

  // Input component patterns
  const inputPatterns = /^(Text|Number|Boolean|Date|Reference|Select|AutoComplete|Checkbox|Radio|File|Image|Rich|Autocomplete|State|Segment|Country|Currency).*Input$/;
  const otherInputs = /^(SelectInput|SelectArrayInput|CheckboxGroupInput|RadioButtonGroupInput|FileInput|ImageInput|RichTextInput|Input)$/;

  // Scan all JSX elements
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.JsxOpeningElement ||
        node.getKind() === SyntaxKind.JsxSelfClosingElement) {
      const tagNameNode = node.getChildAtIndex(1);
      if (tagNameNode) {
        const tagName = tagNameNode.getText();
        if (tagName && (inputPatterns.test(tagName) || otherInputs.test(tagName))) {
          inputs.add(tagName);
        }
        // Also catch custom combobox inputs
        if (tagName && tagName.endsWith('ComboboxInput')) {
          inputs.add(tagName);
        }
      }
    }
  });

  return [...inputs].sort();
}

/**
 * Build component chain by following local imports
 * Returns array from entry point to deepest form component
 */
function buildComponentChain(sourceFile: SourceFile, componentName: string): string[] {
  const chain: string[] = [componentName];

  // Get local component imports
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (!moduleSpecifier.startsWith('.')) continue;

    // Look for form-related component imports
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      // Form component patterns
      if (name.includes('Inputs') || name.includes('Form') || name.includes('Compact')) {
        chain.push(name);
      }
    }
  }

  return chain;
}

/**
 * Detect components using form context hooks
 */
function extractFormContextWrappers(sourceFile: SourceFile): string[] {
  const wrappers: string[] = [];
  const contextHooks = ['useFormContext', 'useFormState', 'useWatch', 'useFieldArray'];

  // Check if file uses any form context hooks
  const fileText = sourceFile.getText();
  for (const hook of contextHooks) {
    if (fileText.includes(hook)) {
      // Get the component name from exported functions
      const exportedDeclarations = sourceFile.getExportedDeclarations();
      for (const [exportName, declarations] of exportedDeclarations) {
        for (const declaration of declarations) {
          if (declaration.getKind() === SyntaxKind.FunctionDeclaration) {
            const funcDecl = declaration.asKindOrThrow(SyntaxKind.FunctionDeclaration);
            const name = funcDecl.getName();
            if (name && /^[A-Z]/.test(name)) {
              wrappers.push(name);
            }
          } else if (declaration.getKind() === SyntaxKind.VariableDeclaration) {
            const varDecl = declaration.asKindOrThrow(SyntaxKind.VariableDeclaration);
            const name = varDecl.getName();
            if (/^[A-Z]/.test(name)) {
              wrappers.push(name);
            }
          }
        }
      }
      break;
    }
  }

  return [...new Set(wrappers)];
}

/**
 * Determine the primary form type based on detected patterns.
 */
function determineFormType(
  jsxElements: Set<string>,
  hooks: Set<string>
): FormInfo["formType"] {
  // Check for React 19 action patterns first (most specific)
  if (hooks.has("useActionState") || hooks.has("useFormStatus")) {
    return "react19-action";
  }

  // Check for React Admin tabbed form
  if (jsxElements.has("TabbedForm") || jsxElements.has("TabbedFormInputs")) {
    return "react-admin-tabbed";
  }

  // Check for wizard form
  if ([...jsxElements].some((el) => WIZARD_COMPONENTS.has(el))) {
    return "react-admin-wizard";
  }

  // Check for React Admin simple form
  if (jsxElements.has("SimpleForm")) {
    return "react-admin-simple";
  }

  // Check for React Admin Form (generic)
  if (jsxElements.has("Form") || jsxElements.has("CreateBase") || jsxElements.has("EditBase")) {
    return "react-admin-simple";
  }

  // Check for direct React Hook Form usage
  if (hooks.has("useForm")) {
    return "react-hook-form-direct";
  }

  return "unknown";
}

/**
 * Determine form patterns (primary and secondary).
 */
function determineFormPatterns(
  jsxElements: Set<string>,
  hooks: Set<string>
): FormInfo["formPatterns"] {
  const patterns: string[] = [];

  // Add detected form wrapper components
  for (const component of REACT_ADMIN_FORM_COMPONENTS) {
    if (jsxElements.has(component)) {
      patterns.push(component);
    }
  }

  // Add React 19 hooks
  for (const hook of REACT_19_FORM_HOOKS) {
    if (hooks.has(hook)) {
      patterns.push(hook);
    }
  }

  // Add React Hook Form hooks
  for (const hook of REACT_HOOK_FORM_HOOKS) {
    if (hooks.has(hook)) {
      patterns.push(hook);
    }
  }

  const primary = patterns[0] || "unknown";
  const secondary = patterns.slice(1);

  return { primary, secondary };
}

/**
 * Detect form features (tabs, wizard, progress).
 */
function detectFormFeatures(jsxElements: Set<string>): FormInfo["features"] {
  const hasTabs = [...jsxElements].some((el) => TAB_COMPONENTS.has(el));
  const hasWizard = [...jsxElements].some((el) => WIZARD_COMPONENTS.has(el));
  const hasProgress = [...jsxElements].some((el) => PROGRESS_COMPONENTS.has(el));

  return { hasTabs, hasWizard, hasProgress };
}

/**
 * Check if a component appears to be a form component based on its content.
 */
function isFormComponent(jsxElements: Set<string>, hooks: Set<string>): boolean {
  // Has React Admin form components
  if ([...jsxElements].some((el) => REACT_ADMIN_FORM_COMPONENTS.has(el))) {
    return true;
  }

  // Has React 19 form hooks
  if ([...hooks].some((h) => REACT_19_FORM_HOOKS.has(h))) {
    return true;
  }

  // Has React Hook Form hooks AND input components
  if (hooks.has("useForm") || hooks.has("useFormContext")) {
    return true;
  }

  return false;
}

/**
 * Extract form information from a single source file.
 */
function extractFormsFromFile(sourceFile: SourceFile): FormInfo[] {
  const forms: FormInfo[] = [];
  const filePath = sourceFile.getFilePath();
  const relativePath = path.relative(process.cwd(), filePath);

  // Get exported function declarations
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [exportName, declarations] of exportedDeclarations) {
    for (const declaration of declarations) {
      let componentName: string | undefined;
      let lineNumber: number | undefined;
      let componentNode: Node | undefined;

      if (declaration.getKind() === SyntaxKind.FunctionDeclaration) {
        const funcDecl = declaration.asKindOrThrow(SyntaxKind.FunctionDeclaration);
        componentName = funcDecl.getName();
        lineNumber = funcDecl.getStartLineNumber();
        componentNode = funcDecl;
      } else if (declaration.getKind() === SyntaxKind.VariableDeclaration) {
        const varDecl = declaration.asKindOrThrow(SyntaxKind.VariableDeclaration);
        componentName = varDecl.getName();
        lineNumber = varDecl.getStartLineNumber();
        componentNode = varDecl;
      }

      if (!componentName || !lineNumber || !componentNode) {
        continue;
      }

      // Extract JSX elements and hooks
      const jsxElements = extractJsxElements(componentNode);
      const hooks = extractHookCalls(componentNode);

      // Skip if not a form component
      if (!isFormComponent(jsxElements, hooks)) {
        continue;
      }

      // Extract zodResolver info
      const { hasResolver, schemaName } = extractZodResolver(componentNode);

      // Extract new fields
      const inputComponentsDeep = extractInputComponentsDeep(sourceFile);
      const componentChain = buildComponentChain(sourceFile, componentName);
      const formContextWrappers = extractFormContextWrappers(sourceFile);

      // Build form info
      const formInfo: FormInfo = {
        componentName,
        file: relativePath,
        line: lineNumber,
        formType: determineFormType(jsxElements, hooks),
        formPatterns: determineFormPatterns(jsxElements, hooks),
        inputComponents: extractInputComponents(jsxElements),
        hasZodResolver: hasResolver,
        features: detectFormFeatures(jsxElements),
        componentChain,
        inputComponentsDeep,
        formContextWrappers,
      };

      // Add schema reference if found
      if (schemaName) {
        formInfo.validationSchemaRef = schemaName;
      }

      forms.push(formInfo);
    }
  }

  return forms;
}

/**
 * Main extraction function.
 * Scans form-related files and extracts form component information.
 */
export async function extractForms(): Promise<void> {
  console.log("📝 Extracting form components...");

  // Source globs from the plan
  // Use the return value to get ONLY the files matching our globs
  // (not all files accumulated in the project singleton)
  const globs = [
    "src/atomic-crm/**/*Create*.tsx",
    "src/atomic-crm/**/*Edit*.tsx",
    "src/atomic-crm/**/*Form*.tsx",
    "src/atomic-crm/**/*Inputs*.tsx",
  ];

  const sourceFiles = project.addSourceFilesAtPaths(globs);
  const forms: FormInfo[] = [];
  const processedFiles: string[] = [];

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();

    // Skip test files
    if (filePath.includes("__tests__") || filePath.includes(".test.") || filePath.includes(".spec.")) {
      continue;
    }

    processedFiles.push(filePath);

    const extractedForms = extractFormsFromFile(sourceFile);
    forms.push(...extractedForms);
  }

  // Calculate summary stats
  const reactAdminCount = forms.filter(
    (f) =>
      f.formType === "react-admin-simple" ||
      f.formType === "react-admin-tabbed" ||
      f.formType === "react-admin-wizard"
  ).length;

  const react19Count = forms.filter((f) => f.formType === "react19-action").length;
  const hookFormCount = forms.filter((f) => f.formType === "react-hook-form-direct").length;
  const withZodCount = forms.filter((f) => f.hasZodResolver).length;
  const withTabsCount = forms.filter((f) => f.features.hasTabs).length;
  const withProgressCount = forms.filter((f) => f.features.hasProgress).length;

  const envelope = createEnvelope(
    "scripts/discover/extractors/forms.ts",
    globs,
    processedFiles,
    {
      total_items: forms.length,
      react_admin_forms: reactAdminCount,
      react19_action_forms: react19Count,
      react_hook_form_direct: hookFormCount,
      with_zod_resolver: withZodCount,
      with_tabs: withTabsCount,
      with_progress: withProgressCount,
    },
    { forms }
  );

  writeDiscoveryFile("forms-inventory.json", envelope);

  console.log(`  ✓ Found ${forms.length} form components`);
  console.log(`    - ${reactAdminCount} React Admin forms`);
  console.log(`    - ${react19Count} React 19 action forms`);
  console.log(`    - ${hookFormCount} React Hook Form direct`);
  console.log(`    - ${withZodCount} with Zod validation`);
}

// Allow direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  extractForms().catch((error) => {
    console.error("❌ Error extracting forms:", error);
    process.exit(1);
  });
}
