#!/usr/bin/env node
/**
 * PreToolUse Hook: Verification Before Git Operations
 *
 * BLOCKS git commit, push, and PR creation unless verification commands
 * (npm run build, npx tsc --noEmit) have been run in the current session.
 *
 * Exit codes:
 *   0 = Allow tool execution
 *   2 = Block tool execution (message sent to Claude via stderr)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface HookInput {
  session_id: string;
  tool_name: string;
  tool_input: {
    command?: string;
    file_path?: string;
    content?: string;
  };
}

interface SessionState {
  buildVerified: boolean;
  typesVerified: boolean;
  testsVerified: boolean;
  lastBuildTime?: string;
  lastTypesTime?: string;
  lastTestsTime?: string;
}

const STATE_DIR = join(__dirname, "state");
const getStatePath = (sessionId: string) => join(STATE_DIR, `verification-${sessionId}.json`);

function ensureStateDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

function loadSessionState(sessionId: string): SessionState {
  ensureStateDir();
  const statePath = getStatePath(sessionId);

  if (existsSync(statePath)) {
    try {
      return JSON.parse(readFileSync(statePath, "utf-8"));
    } catch {
      // Corrupted state, start fresh
    }
  }

  return {
    buildVerified: false,
    typesVerified: false,
    testsVerified: false,
  };
}

function saveSessionState(sessionId: string, state: SessionState): void {
  ensureStateDir();
  const statePath = getStatePath(sessionId);
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function isVerificationCommand(command: string): { type: "build" | "types" | "tests" | null } {
  const lowerCmd = command.toLowerCase();

  // Build verification
  if (lowerCmd.includes("npm run build") || lowerCmd.includes("npm build")) {
    return { type: "build" };
  }

  // TypeScript verification
  if (
    lowerCmd.includes("tsc --noEmit") ||
    lowerCmd.includes("tsc -noEmit") ||
    lowerCmd.includes("npx tsc") ||
    lowerCmd.includes("npm run typecheck")
  ) {
    return { type: "types" };
  }

  // Test verification
  if (
    lowerCmd.includes("npm test") ||
    lowerCmd.includes("npm run test") ||
    lowerCmd.includes("vitest") ||
    lowerCmd.includes("jest")
  ) {
    return { type: "tests" };
  }

  return { type: null };
}

function isGitOperation(command: string): boolean {
  const lowerCmd = command.toLowerCase();

  // Git commit
  if (lowerCmd.includes("git commit")) {
    return true;
  }

  // Git push
  if (lowerCmd.includes("git push")) {
    return true;
  }

  // GitHub CLI PR creation
  if (lowerCmd.includes("gh pr create") || lowerCmd.includes("gh pr merge")) {
    return true;
  }

  return false;
}

async function main() {
  try {
    const input = readFileSync(0, "utf-8");
    const data: HookInput = JSON.parse(input);

    // Only handle Bash tool
    if (data.tool_name !== "Bash") {
      process.exit(0);
      return;
    }

    const command = data.tool_input.command || "";
    const sessionId = data.session_id || "unknown";

    // Load current session state
    const state = loadSessionState(sessionId);

    // Check if this is a verification command - update state
    const verification = isVerificationCommand(command);
    if (verification.type) {
      const now = new Date().toISOString();
      switch (verification.type) {
        case "build":
          state.buildVerified = true;
          state.lastBuildTime = now;
          break;
        case "types":
          state.typesVerified = true;
          state.lastTypesTime = now;
          break;
        case "tests":
          state.testsVerified = true;
          state.lastTestsTime = now;
          break;
      }
      saveSessionState(sessionId, state);
      process.exit(0);
      return;
    }

    // Check if this is a git operation that requires verification
    if (isGitOperation(command)) {
      const missing: string[] = [];

      if (!state.buildVerified) {
        missing.push("npm run build");
      }
      if (!state.typesVerified) {
        missing.push("npx tsc --noEmit");
      }

      if (missing.length > 0) {
        const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ VERIFICATION REQUIRED BEFORE GIT OPERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are attempting: ${command.substring(0, 50)}...

MISSING VERIFICATION:
${missing.map((cmd) => `  ✗ ${cmd}`).join("\n")}

REQUIRED ACTION:
Run the verification commands first and confirm they pass.
Then retry your git operation.

Use skill: verification-before-completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        console.error(message);
        process.exit(2); // Block the tool
        return;
      }
    }

    // Allow all other commands
    process.exit(0);
  } catch (err) {
    // On error, allow the tool to proceed (fail-open for hooks)
    console.error("Error in verification-before-git hook:", err);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Uncaught error:", err);
  process.exit(0); // Fail-open
});
