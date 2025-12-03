#!/usr/bin/env python3
"""
PostToolUse hook: Injects parallelization guidance after ExitPlanMode.

Triggers when Claude exits plan mode, reads the plan file, and prompts
Claude to analyze which tasks can be parallelized.
"""
import hashlib
import json
import logging
import os
import sys
from pathlib import Path

# --- Configuration ---
LOG_FILE = Path("/tmp/claude_plan_parallelizer.log")
STATE_FILE = Path("/tmp/claude_plan_parallelizer.state")
PARALLEL_GUIDE_PATH = Path.home() / ".claude" / "guides" / "parallel.md"
# Common plan file locations to check
PLAN_FILE_PATTERNS = [
    Path.cwd() / ".claude" / "plan.md",
    Path.cwd() / "plan.md",
    Path.cwd() / ".claude" / "implementation-plan.md",
]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename=str(LOG_FILE),
    filemode='a'
)

def find_plan_file() -> Path | None:
    """Find the most recently modified plan file."""
    existing = [p for p in PLAN_FILE_PATTERNS if p.exists()]
    if not existing:
        return None
    # Return the most recently modified
    return max(existing, key=lambda p: p.stat().st_mtime)

def load_parallel_guide() -> str:
    """Load the parallel execution guide."""
    try:
        if PARALLEL_GUIDE_PATH.exists():
            return PARALLEL_GUIDE_PATH.read_text()
        logging.warning(f"Parallel guide not found at {PARALLEL_GUIDE_PATH}")
        return ""
    except Exception as e:
        logging.error(f"Error loading parallel guide: {e}")
        return ""

def main():
    logging.info("--- Plan Parallelizer Hook Triggered ---")

    try:
        hook_input = json.load(sys.stdin)
        tool_name = hook_input.get("tool_name", "")

        # Only trigger on ExitPlanMode
        if tool_name != "ExitPlanMode":
            logging.debug(f"Ignoring tool: {tool_name}")
            sys.exit(0)

        logging.info("ExitPlanMode detected, checking for plan file...")

        # Find and read the plan file
        plan_file = find_plan_file()
        if not plan_file:
            logging.info("No plan file found. Skipping.")
            sys.exit(0)

        plan_content = plan_file.read_text()
        if not plan_content.strip():
            logging.info("Plan file is empty. Skipping.")
            sys.exit(0)

        logging.info(f"Found plan at: {plan_file}")

        # Check if plan has changed using hash
        current_hash = hashlib.md5(plan_content.encode()).hexdigest()
        last_hash = STATE_FILE.read_text().strip() if STATE_FILE.exists() else ""

        if current_hash == last_hash:
            logging.info("Plan unchanged since last check. Skipping.")
            sys.exit(0)

        logging.info("New/changed plan detected. Injecting parallelization prompt.")

        # Load the parallel guide
        parallel_guide = load_parallel_guide()
        guide_section = f"\n{parallel_guide}\n" if parallel_guide else ""

        # Build the reflection prompt
        reflection_prompt = f"""<system-reminder>
**Parallelize the Plan**

The plan has been finalized. Before execution, analyze it for parallelization opportunities:
{guide_section}
**Key Principles:**
1. ONLY parallelize if there are multiple independent files/tasks
2. Group tasks by dependency - tasks in the same stage have no dependencies on each other
3. Delegate to subagents for parallel execution (one primary task per agent)
4. Single-file changes should be done directly, not delegated

**Plan Location:** `{plan_file}`

Please present your analysis of which tasks can run in parallel, then proceed with execution.
</system-reminder>"""

        # Output the hook response
        response = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": reflection_prompt
            }
        }

        print(json.dumps(response), flush=True)

        # Update state file
        STATE_FILE.write_text(current_hash)
        logging.info(f"State updated. Hash: {current_hash}")

    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON input: {e}")
        sys.exit(1)
    except Exception as e:
        logging.exception(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
