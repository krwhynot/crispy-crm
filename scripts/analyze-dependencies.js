#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Track dependencies
const dependencyGraph = new Map();
const visited = new Set();
const recursionStack = new Set();

function extractImports(content, filePath) {
  const imports = [];
  const importRegex = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Only track local imports (not node_modules)
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      const resolvedPath = resolveImportPath(importPath, filePath);
      if (resolvedPath) {
        imports.push(resolvedPath);
      }
    }
  }

  return imports;
}

function resolveImportPath(importPath, fromFile) {
  const dir = path.dirname(fromFile);
  let resolvedPath;

  if (importPath.startsWith('@/')) {
    // Handle @/ alias (assuming it maps to src/)
    resolvedPath = path.join(projectRoot, 'src', importPath.slice(2));
  } else {
    resolvedPath = path.resolve(dir, importPath);
  }

  // Try various extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return path.relative(projectRoot, fullPath);
    }
    // Try index file
    const indexPath = path.join(resolvedPath, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return path.relative(projectRoot, indexPath);
    }
  }

  return null;
}

function buildDependencyGraph(dir, baseDir = '') {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(projectRoot, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      // Skip node_modules and hidden directories
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        buildDependencyGraph(fullPath, path.join(baseDir, file));
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const imports = extractImports(content, fullPath);
      dependencyGraph.set(relativePath, imports);
    }
  }
}

function detectCircularDependency(node, path = []) {
  if (recursionStack.has(node)) {
    const cycleStart = path.indexOf(node);
    return path.slice(cycleStart).concat(node);
  }

  if (visited.has(node)) {
    return null;
  }

  visited.add(node);
  recursionStack.add(node);

  const dependencies = dependencyGraph.get(node) || [];

  for (const dep of dependencies) {
    const cycle = detectCircularDependency(dep, [...path, node]);
    if (cycle) {
      return cycle;
    }
  }

  recursionStack.delete(node);
  return null;
}

// Analyze dependencies
console.log('🔍 Analyzing dependencies in Atomic CRM...\n');

// Build the dependency graph
const srcPath = path.join(projectRoot, 'src');
buildDependencyGraph(srcPath);

console.log(`📊 Total files analyzed: ${dependencyGraph.size}`);

// Find circular dependencies
const circularDeps = [];
for (const [file] of dependencyGraph) {
  visited.clear();
  recursionStack.clear();
  const cycle = detectCircularDependency(file);
  if (cycle) {
    circularDeps.push(cycle);
  }
}

// Report circular dependencies
if (circularDeps.length > 0) {
  console.log('\n⚠️  Circular dependencies detected:\n');
  const uniqueCycles = new Set();
  for (const cycle of circularDeps) {
    const cycleKey = cycle.sort().join(' -> ');
    if (!uniqueCycles.has(cycleKey)) {
      uniqueCycles.add(cycleKey);
      console.log('  Cycle:');
      cycle.forEach((file, index) => {
        console.log(`    ${index === 0 ? '┌─' : index === cycle.length - 1 ? '└─>' : '├─'} ${file}`);
      });
      console.log('');
    }
  }
} else {
  console.log('\n✅ No circular dependencies detected');
}

// Analyze module coupling
console.log('\n📦 Module Analysis:\n');

const modules = new Map();

for (const [file, deps] of dependencyGraph) {
  const module = file.split('/')[1]; // Assumes src/module/...
  if (!modules.has(module)) {
    modules.set(module, {
      files: 0,
      internalDeps: 0,
      externalDeps: 0,
      dependsOn: new Set()
    });
  }

  const moduleData = modules.get(module);
  moduleData.files++;

  for (const dep of deps) {
    const depModule = dep.split('/')[1];
    if (depModule === module) {
      moduleData.internalDeps++;
    } else {
      moduleData.externalDeps++;
      moduleData.dependsOn.add(depModule);
    }
  }
}

// Sort modules by coupling
const sortedModules = Array.from(modules.entries()).sort((a, b) =>
  b[1].externalDeps - a[1].externalDeps
);

console.log('Module Coupling Analysis:');
console.log('─'.repeat(80));
for (const [module, data] of sortedModules) {
  const coupling = data.externalDeps / (data.internalDeps + data.externalDeps + 1);
  console.log(`  ${module}:`);
  console.log(`    Files: ${data.files}`);
  console.log(`    Internal dependencies: ${data.internalDeps}`);
  console.log(`    External dependencies: ${data.externalDeps}`);
  console.log(`    Coupling ratio: ${(coupling * 100).toFixed(1)}%`);
  if (data.dependsOn.size > 0) {
    console.log(`    Depends on: ${Array.from(data.dependsOn).join(', ')}`);
  }
  console.log('');
}