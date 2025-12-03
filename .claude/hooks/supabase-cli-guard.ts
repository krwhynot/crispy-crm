#!/usr/bin/env npx tsx
/**
 * PreToolUse Hook: Supabase CLI Guard
 *
 * BLOCKS invalid Supabase CLI and Docker commands before execution:
 * - `supabase db execute` (doesn't exist)
 * - `supabase run/sql/query` (don't exist)
 * - `docker exec -it` in non-TTY (will fail)
 *
 * Also provides helpful corrections with auto-detected container names.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface HookInput {
  session_id: string;
  tool_name: string;
  tool_input: {
    command?: string;
    [key: string]: unknown;
  };
}

interface BlockPattern {
  pattern: RegExp;
  message: string;
  suggestion: string;
}

// Get project ID from config.toml for container name suggestions
function getProjectId(): string | null {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || join(__dirname, "..", "..");
    const configPath = join(projectDir, "supabase", "config.toml");

    if (!existsSync(configPath)) {
      return null;
    }

    const config = readFileSync(configPath, "utf-8");
    const match = config.match(/^id\s*=\s*["']?([^"'\s\n]+)["']?/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Patterns that should be BLOCKED
function getBlockPatterns(projectId: string | null): BlockPattern[] {
  const containerName = projectId ? `supabase_db_${projectId}` : "supabase_db_<your-project-id>";

  return [
    {
      pattern: /supabase\s+db\s+execute/i,
      message: "❌ BLOCKED: 'supabase db execute' does NOT exist!",
      suggestion: `Use Docker + psql instead:\n  docker exec ${containerName} psql -U postgres -d postgres -c "YOUR SQL HERE"`
    },
    {
      pattern: /supabase\s+run\s+/i,
      message: "❌ BLOCKED: 'supabase run' does NOT exist!",
      suggestion: "For Edge Functions, use: supabase functions serve <name>\nFor SQL, use Docker + psql"
    },
    {
      pattern: /supabase\s+sql\s+/i,
      message: "❌ BLOCKED: 'supabase sql' does NOT exist!",
      suggestion: `Use Docker + psql instead:\n  docker exec ${containerName} psql -U postgres -d postgres -c "YOUR SQL HERE"`
    },
    {
      pattern: /supabase\s+query\s+/i,
      message: "❌ BLOCKED: 'supabase query' does NOT exist!",
      suggestion: `Use Docker + psql instead:\n  docker exec ${containerName} psql -U postgres -d postgres -c "YOUR SQL HERE"`
    },
    {
      pattern: /npx\s+supabase\s+db\s+execute/i,
      message: "❌ BLOCKED: 'npx supabase db execute' does NOT exist!",
      suggestion: `Use Docker + psql instead:\n  docker exec ${containerName} psql -U postgres -d postgres -c "YOUR SQL HERE"`
    },
    {
      pattern: /docker\s+exec\s+-it\s+supabase/i,
      message: "❌ BLOCKED: 'docker exec -it' will fail in non-TTY environment!",
      suggestion: `Remove the -t flag for non-interactive use:\n  docker exec ${containerName} psql -U postgres -c "YOUR SQL HERE"\n\nOr remove both -i and -t flags.`
    },
    {
      pattern: /docker\s+exec\s+-ti\s+supabase/i,
      message: "❌ BLOCKED: 'docker exec -ti' will fail in non-TTY environment!",
      suggestion: `Remove the -t flag for non-interactive use:\n  docker exec ${containerName} psql -U postgres -c "YOUR SQL HERE"`
    }
  ];
}

async function main() {
  try {
    // Read input from stdin
    const input = readFileSync(0, "utf-8");
    const data: HookInput = JSON.parse(input);

    // Only check Bash commands
    if (data.tool_name !== "Bash") {
      process.exit(0);
    }

    const command = data.tool_input.command;
    if (!command) {
      process.exit(0);
    }

    // Get project ID for suggestions
    const projectId = getProjectId();
    const blockPatterns = getBlockPatterns(projectId);

    // Check each pattern
    for (const { pattern, message, suggestion } of blockPatterns) {
      if (pattern.test(command)) {
        // Output to stderr (shown to Claude as block message)
        console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message}

📚 CORRECT APPROACH:
${suggestion}

💡 TIP: Use \`Skill("supabase-cli")\` for complete reference.

Valid supabase db commands: diff, dump, lint, pull, push, reset, start
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
        // Exit code 2 = BLOCK the tool
        process.exit(2);
      }
    }

    // Additional warning for generic container names (not blocking)
    if (/docker\s+exec.*supabase_db[^_]/i.test(command)) {
      const containerName = projectId ? `supabase_db_${projectId}` : "supabase_db_<project-id>";
      console.error(`
⚠️ WARNING: Container name may be incomplete.

Full container name should include project ID: ${containerName}

Find your container: docker ps --filter "name=supabase_db"
`);
      // Just warn, don't block (exit 0)
    }

    // Allow the command
    process.exit(0);

  } catch (error) {
    // On error, allow the command (fail open)
    console.error(`Hook error: ${error}`);
    process.exit(0);
  }
}

main();
