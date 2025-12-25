import ora from "ora";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { extractComponents } from "./extractors/components.js";
import { extractHooks } from "./extractors/hooks.js";
import { isDiscoveryStale } from "./utils/output.js";
import { project } from "./utils/project.js";

interface ExtractorConfig {
  name: string;
  label: string;
  outputFile: string;
  extractFn: () => Promise<void>;
  getSourceFiles: () => string[];
}

const EXTRACTORS: Record<string, ExtractorConfig> = {
  components: {
    name: "components",
    label: "Components",
    outputFile: "component-inventory.json",
    extractFn: extractComponents,
    getSourceFiles: () => {
      const files = project.addSourceFilesAtPaths("src/atomic-crm/**/*.tsx");
      return files.map(f => f.getFilePath());
    },
  },
  hooks: {
    name: "hooks",
    label: "Hooks",
    outputFile: "hooks-inventory.json",
    extractFn: extractHooks,
    getSourceFiles: () => {
      const globs = ["src/**/use*.ts", "src/**/use*.tsx", "src/**/*.ts", "src/**/*.tsx"];
      const files = project.addSourceFilesAtPaths(globs);
      return files.map(f => f.getFilePath()).filter(
        path => !path.includes("node_modules") && !path.includes(".test.") && !path.includes(".spec.")
      );
    },
  },
};

interface CliArgs {
  checkOnly: boolean;
  onlyExtractors: string[] | null;
}

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const onlyFlag = args.find(a => a.startsWith("--only="));
  const onlyExtractors = onlyFlag ? onlyFlag.split("=")[1].split(",") : null;

  if (onlyExtractors) {
    const invalid = onlyExtractors.filter(e => !EXTRACTORS[e]);
    if (invalid.length > 0) {
      console.error(chalk.red(`Invalid extractors: ${invalid.join(", ")}`));
      console.error(chalk.yellow(`Valid options: ${Object.keys(EXTRACTORS).join(", ")}`));
      process.exit(1);
    }
  }

  return { checkOnly, onlyExtractors };
}

async function checkStaleness(extractorsToCheck: ExtractorConfig[]): Promise<number> {
  console.log(chalk.cyan.bold("\n🔍 Checking discovery file staleness...\n"));

  let hasStale = false;

  for (const extractor of extractorsToCheck) {
    const sourceFiles = extractor.getSourceFiles();
    const result = isDiscoveryStale(extractor.outputFile, sourceFiles);

    if (result.stale) {
      hasStale = true;
      console.log(chalk.red(`✗ ${extractor.label}: STALE`));
      if (result.reason) {
        console.log(chalk.gray(`  Reason: ${result.reason}`));
      }
      if (result.changedFiles && result.changedFiles.length > 0) {
        const displayFiles = result.changedFiles.slice(0, 5);
        displayFiles.forEach(file => console.log(chalk.gray(`    ${file}`)));
        if (result.changedFiles.length > 5) {
          console.log(chalk.gray(`    ... and ${result.changedFiles.length - 5} more`));
        }
      }
    } else {
      console.log(chalk.green(`✓ ${extractor.label}: Fresh`));
    }
  }

  console.log();
  if (hasStale) {
    console.log(chalk.yellow("Discovery files need regeneration. Run without --check to update."));
    return 1;
  } else {
    console.log(chalk.green("All discovery files are up-to-date!"));
    return 0;
  }
}

async function runExtractors(extractorsToRun: ExtractorConfig[]): Promise<void> {
  console.log(chalk.cyan.bold("\n🚀 Running Discovery Generators...\n"));

  const results = await Promise.allSettled(
    extractorsToRun.map(async (extractor) => {
      const spinner = ora(chalk.blue(`Extracting ${extractor.label.toLowerCase()}...`)).start();
      try {
        await extractor.extractFn();
        spinner.succeed(chalk.green(`${extractor.label} extracted`));
        return { name: extractor.name, success: true };
      } catch (error) {
        spinner.fail(chalk.red(`${extractor.label} extraction failed`));
        throw error;
      }
    })
  );

  const failed = results.filter(r => r.status === "rejected");
  if (failed.length > 0) {
    console.log();
    failed.forEach((result, idx) => {
      if (result.status === "rejected") {
        console.error(chalk.red(`\n❌ Extractor ${idx + 1} failed:`), result.reason);
      }
    });
    throw new Error(`${failed.length} extractor(s) failed`);
  }
}

function printSummary(extractorsRun: ExtractorConfig[]): void {
  console.log(chalk.cyan.bold("\n📊 Discovery Complete!\n"));

  let totalItems = 0;

  extractorsRun.forEach((extractor) => {
    const outputPath = path.join(process.cwd(), "docs/_state", extractor.outputFile);
    try {
      const data = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      const itemCount = data.summary?.total_items || 0;
      totalItems += itemCount;
      console.log(chalk.gray("├──"), chalk.white(extractor.outputFile.padEnd(30)), chalk.green(`✓ ${itemCount} items`));
    } catch {
      console.log(chalk.gray("├──"), chalk.white(extractor.outputFile.padEnd(30)), chalk.red("✗ Error reading file"));
    }
  });

  console.log(chalk.gray("└──"), chalk.white(`Total: ${totalItems} items\n`));
}

async function main() {
  const { checkOnly, onlyExtractors } = parseCliArgs();

  const extractorsToUse = onlyExtractors
    ? onlyExtractors.map(name => EXTRACTORS[name])
    : Object.values(EXTRACTORS);

  if (checkOnly) {
    const exitCode = await checkStaleness(extractorsToUse);
    process.exit(exitCode);
  }

  await runExtractors(extractorsToUse);
  printSummary(extractorsToUse);
}

main().catch(err => {
  console.error(chalk.red("\n❌ Discovery failed:"), err);
  process.exit(1);
});
