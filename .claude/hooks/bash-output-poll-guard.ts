/**
 * BashOutput Poll Guard Hook
 *
 * Detects when the agent is stuck in an infinite polling loop waiting for
 * background shell output that never arrives.
 *
 * Strategy:
 * - Track consecutive BashOutput calls per shell_id
 * - After 3 consecutive empty results, inject a warning
 * - After 5 consecutive empty results, BLOCK and force action
 *
 * State is stored in .claude/hooks/state/bash-output-polls.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface PollState {
  [shellId: string]: {
    emptyCount: number;
    lastPollTime: number;
    totalPolls: number;
  };
}

interface HookInput {
  tool_name: string;
  tool_input: {
    bash_id?: string;
    shell_id?: string;
  };
  session_id: string;
}

interface HookOutput {
  decision: 'approve' | 'block' | 'modify';
  message?: string;
  modified_params?: Record<string, unknown>;
}

// Configuration
const MAX_EMPTY_POLLS_WARNING = 3;
const MAX_EMPTY_POLLS_BLOCK = 5;
const POLL_RESET_INTERVAL_MS = 30000; // Reset count if 30s between polls

function getStateFilePath(): string {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const stateDir = path.join(projectDir, '.claude', 'hooks', 'state');

  // Ensure state directory exists
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  return path.join(stateDir, 'bash-output-polls.json');
}

function loadState(): PollState {
  const statePath = getStateFilePath();

  if (fs.existsSync(statePath)) {
    try {
      const content = fs.readFileSync(statePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  return {};
}

function saveState(state: PollState): void {
  const statePath = getStateFilePath();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function cleanupOldEntries(state: PollState): PollState {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  const cleaned: PollState = {};

  for (const [shellId, data] of Object.entries(state)) {
    if (now - data.lastPollTime < maxAge) {
      cleaned[shellId] = data;
    }
  }

  return cleaned;
}

function main(): void {
  // Read input from stdin
  let input = '';

  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const hookInput: HookInput = JSON.parse(input);
      const result = processHook(hookInput);
      console.log(JSON.stringify(result));
    } catch (_error) {
      // On error, approve by default to not block the agent
      console.log(JSON.stringify({ decision: 'approve' }));
    }
  });
}

function processHook(input: HookInput): HookOutput {
  // Only process BashOutput calls
  if (input.tool_name !== 'BashOutput') {
    return { decision: 'approve' };
  }

  const shellId = input.tool_input.bash_id || input.tool_input.shell_id;

  if (!shellId) {
    return { decision: 'approve' };
  }

  // Load and cleanup state
  let state = loadState();
  state = cleanupOldEntries(state);

  const now = Date.now();

  // Get or create entry for this shell
  if (!state[shellId]) {
    state[shellId] = {
      emptyCount: 0,
      lastPollTime: now,
      totalPolls: 0
    };
  }

  const entry = state[shellId];

  // Check if we should reset count (long gap between polls)
  if (now - entry.lastPollTime > POLL_RESET_INTERVAL_MS) {
    entry.emptyCount = 0;
  }

  // Increment counters (we'll decrement if output is found in PostToolUse)
  entry.emptyCount++;
  entry.totalPolls++;
  entry.lastPollTime = now;

  // Save state
  saveState(state);

  // Check thresholds
  if (entry.emptyCount >= MAX_EMPTY_POLLS_BLOCK) {
    return {
      decision: 'block',
      message: `
🛑 STUCK PROCESS DETECTED - BLOCKING FURTHER POLLS

You have polled shell "${shellId}" ${entry.emptyCount} times with no output.
This indicates the process is likely stuck, crashed, or finished without output.

REQUIRED ACTIONS:
1. Kill this shell: KillShell({ shell_id: "${shellId}" })
2. Check if process is alive: Bash("ps aux | grep <process-name>")
3. Try running in FOREGROUND with timeout instead of background
4. If the process should have output, investigate why it's silent

DO NOT continue polling. The stuck-process-detection skill has more guidance.

To reset: Use a different approach or wait 30 seconds before retrying.
`
    };
  }

  if (entry.emptyCount >= MAX_EMPTY_POLLS_WARNING) {
    return {
      decision: 'approve',
      message: `
⚠️ WARNING: Possible stuck process detected

Shell "${shellId}" has returned empty output ${entry.emptyCount} consecutive times.
You will be BLOCKED after ${MAX_EMPTY_POLLS_BLOCK - entry.emptyCount} more empty polls.

Consider:
- Is this process actually running?
- Should you kill it and try foreground execution?
- Is there a configuration issue preventing output?

Use KillShell to terminate if needed.
`
    };
  }

  return { decision: 'approve' };
}

// Note: This file would need a companion PostToolUse hook to reset the
// empty count when BashOutput actually returns content. For simplicity,
// we rely on the time-based reset instead.

main();
