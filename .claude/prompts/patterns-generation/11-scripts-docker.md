---
name: generate-patterns-scripts-docker
directory: scripts/docker/
complexity: LOW
output: scripts/docker/PATTERNS.md
---

# Generate PATTERNS.md for Docker Helper Scripts

## Context

The `scripts/docker/` directory contains shell scripts for managing Docker containers and monitoring system resources in a WSL2 environment. These scripts provide lifecycle management for Supabase containers with resource limits and real-time monitoring of memory and CPU usage.

**Primary concerns**: Container lifecycle management, resource constraints, WSL2 memory optimization, real-time monitoring.

**Key files**:
- `supabase-docker.sh` - Full Supabase container lifecycle (start, stop, restart, cleanup)
- `monitor-resources.sh` - Real-time WSL2 and Docker resource monitoring

---

## Phase 1: Exploration

Read these files to understand the script patterns:

### Container Lifecycle Management

```
scripts/docker/supabase-docker.sh
```
- Purpose: Manage Supabase containers with resource limits in WSL2
- Key patterns: Command dispatch, prerequisite checks, graceful start/stop, destructive cleanup confirmation, colored output

### Resource Monitoring

```
scripts/docker/monitor-resources.sh
```
- Purpose: Real-time monitoring of WSL2 memory, Docker containers, and top processes
- Key patterns: Continuous monitoring loop, progress bar rendering, color-coded thresholds, docker stats integration

---

## Phase 2: Pattern Identification

Identify these patterns from the scripts:

### Pattern A: Command Dispatch Structure

How the script organizes multiple subcommands:
- Case statement for command routing
- Help message with usage examples
- Default to help on unknown command
- Exit code conventions

### Pattern B: Prerequisite Validation

How scripts verify dependencies before operations:
- `command -v` checks for required tools
- Docker daemon accessibility check
- Supabase CLI verification
- Configuration file existence checks
- Helpful error messages with remediation steps

### Pattern C: Graceful Container Lifecycle

How containers are started, stopped, and restarted:
- Check existing state before operations
- Resource limits via docker-compose.override.yml
- Sleep delays for container readiness
- Status verification after operations

### Pattern D: Destructive Operation Confirmation

How dangerous operations require explicit user consent:
- Text-based confirmation prompts
- Exact match requirement ("yes", "RESET")
- Clear warning messages before prompt
- Graceful cancellation handling

### Pattern E: Real-Time Monitoring Loop

How the monitor script displays live updates:
- Infinite loop with sleep interval
- Clear screen between refreshes
- Color-coded thresholds (green/yellow/red)
- Progress bar rendering
- Ctrl+C exit instruction

---

## Phase 3: Generate PATTERNS.md

Use this structure for the output:

```markdown
# Docker Helper Scripts Patterns

Shell utilities for managing Docker containers and monitoring WSL2 resources.

## Architecture Overview

```
scripts/docker/
├── Container Lifecycle
│   └── supabase-docker.sh    → start|stop|restart|cleanup|status|stats
│                               └── Resource limits from override.yml
│                               └── WSL2 memory management
│
└── Resource Monitoring
    └── monitor-resources.sh   → Real-time dashboard
                                └── WSL2 memory + swap usage
                                └── Docker container stats
                                └── Top memory consumers
```

---

## Pattern A: Command Dispatch Structure

{Description of case-based command routing}

**When to use**: Multi-command CLI tools with distinct operations.

### Command Router

```bash
# scripts/docker/supabase-docker.sh
{Show case statement with command routing, default help, and error handling}
```

### Help Message

```bash
{Show print_header and help output with usage examples}
```

**Key points:**
- Use `${1:-help}` for default command
- Exit 1 on unknown command
- Include usage examples in help
- List all available commands

---

## Pattern B: Prerequisite Validation

{Description of dependency checking before operations}

**When to use**: Before any operation requiring external tools.

### Tool Availability Check

```bash
# scripts/docker/supabase-docker.sh
{Show check_docker, check_supabase_cli, check_supabase_init functions}
```

**Key points:**
- Check with `command -v`
- Provide clear installation instructions on failure
- Exit 1 immediately on missing prerequisite
- Check configuration files exist

---

## Pattern C: Graceful Container Lifecycle

{Description of safe container management}

**When to use**: Starting/stopping containerized services.

### Start with Resource Limits

```bash
{Show start_supabase function with resource limit application}
```

### Stop with Verification

```bash
{Show stop_supabase function}
```

**Key points:**
- Check if already running before start
- Sleep for container readiness
- Apply resource limits after start
- Show status after operations

---

## Pattern D: Destructive Operation Confirmation

{Description of user confirmation for dangerous operations}

**When to use**: Any operation that deletes data or is irreversible.

### Confirmation Pattern

```bash
# scripts/docker/supabase-docker.sh
{Show cleanup function with confirmation prompt}
```

**Key points:**
- Print clear warning with emoji
- Require exact text match (not y/n)
- Use `read -p` for inline prompt
- Cancel gracefully if not confirmed

---

## Pattern E: Real-Time Monitoring Loop

{Description of continuous monitoring display}

**When to use**: Dashboards and live resource tracking.

### Monitoring Loop

```bash
# scripts/docker/monitor-resources.sh
{Show while true loop with clear_screen and sleep}
```

### Progress Bar Rendering

```bash
{Show draw_bar function with color thresholds}
```

### Color-Coded Thresholds

```bash
{Show color selection based on percentage}
```

**Key points:**
- Clear screen with `printf '\033[2J\033[H'`
- Use consistent refresh interval (5 seconds)
- Color by threshold: green <60%, yellow 60-80%, red >80%
- Show exit instructions

---

## Pattern Comparison Table

| Aspect | Command Dispatch | Prerequisites | Lifecycle | Confirmation | Monitoring |
|--------|-----------------|---------------|-----------|--------------|------------|
| **Purpose** | Route commands | Verify tools | Container ops | Safety gate | Live display |
| **Control flow** | case statement | exit on fail | sequence | read + match | while loop |
| **User input** | $1 argument | None | None | Text match | Ctrl+C exit |
| **Exit codes** | 0 or 1 | 1 on fail | 0 on success | 0 either way | N/A (loop) |

---

## Anti-Patterns to Avoid

### 1. Missing set -e

```bash
# BAD: Script continues after failures
#!/bin/bash
docker stop container_that_doesnt_exist
echo "This still runs!"

# GOOD: Exit on first failure
#!/bin/bash
set -e
docker stop container_that_doesnt_exist
echo "Never reached"
```

### 2. No Confirmation on Destructive Operations

```bash
# BAD: Immediate destruction
rm -rf /var/lib/docker/volumes/*

# GOOD: Require explicit confirmation
read -p "Type 'DELETE' to confirm: " confirm
if [ "$confirm" = "DELETE" ]; then
    rm -rf /var/lib/docker/volumes/*
else
    echo "Cancelled"
fi
```

### 3. Hardcoded Paths

```bash
# BAD: Absolute paths that break portability
PROJECT_ROOT="/home/user/projects/crispy-crm"

# GOOD: Derive from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
```

### 4. Missing Docker Daemon Check

```bash
# BAD: Assume docker is available
docker ps

# GOOD: Check before use
if ! docker ps &> /dev/null; then
    echo "Docker daemon not accessible"
    exit 1
fi
```

### 5. No Sleep After Container Start

```bash
# BAD: Immediate operations after start
docker-compose up -d
psql "postgresql://..." -c "SELECT 1"  # May fail!

# GOOD: Wait for readiness
docker-compose up -d
sleep 3  # Give containers time to start
psql "postgresql://..." -c "SELECT 1"
```

---

## Docker Script Checklist

When creating new Docker management scripts:

1. [ ] Add `set -e` at top of script
2. [ ] Define color codes for consistent output
3. [ ] Derive paths from `${BASH_SOURCE[0]}` (not hardcoded)
4. [ ] Check Docker daemon with `docker ps &> /dev/null`
5. [ ] Verify prerequisites with `command -v`
6. [ ] Add confirmation for destructive operations
7. [ ] Use case statement for command dispatch
8. [ ] Include comprehensive help message
9. [ ] Sleep after container start for readiness
10. [ ] Verify: `shellcheck scripts/docker/your-script.sh`

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Command Dispatch** | `supabase-docker.sh` (case statement) |
| **B: Prerequisite Validation** | `supabase-docker.sh` (check_* functions) |
| **C: Container Lifecycle** | `supabase-docker.sh` (start/stop/restart) |
| **D: Destructive Confirmation** | `supabase-docker.sh` (cleanup function) |
| **E: Real-Time Monitoring** | `monitor-resources.sh` (while loop) |
```

---

## Phase 4: Write the File

Write the generated PATTERNS.md to:

```
/home/krwhynot/projects/crispy-crm/scripts/docker/PATTERNS.md
```

### Final Instructions

1. Read both files listed in Phase 1
2. Extract real code examples (not pseudo-code) for each pattern
3. Generate the PATTERNS.md following the template structure
4. Ensure all code blocks reference actual file paths
5. Verify ASCII diagram matches current directory structure
6. Include shell-specific anti-patterns (missing set -e, no confirmation, hardcoded paths)
7. Write to the output path
