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

Multi-command CLI tools use case statements for clean command routing with sensible defaults.

**When to use**: Multi-command CLI tools with distinct operations.

### Command Router

```bash
# scripts/docker/supabase-docker.sh:303-336

case "${1:-help}" in
    start)
        start_supabase
        ;;
    stop)
        stop_supabase
        ;;
    restart)
        restart_supabase
        ;;
    status)
        show_status
        ;;
    stats)
        show_stats
        ;;
    cleanup)
        cleanup
        ;;
    reclaim)
        reclaim_memory
        ;;
    check)
        check_integration
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
```

### Help Message

```bash
# scripts/docker/supabase-docker.sh:271-300

show_help() {
    print_header "Supabase Docker Lifecycle Management"

    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Start Supabase with resource limits"
    echo "  stop       - Stop all Supabase containers"
    echo "  restart    - Restart Supabase (stop + start)"
    echo "  status     - Show Supabase status and resource usage"
    echo "  stats      - Show real-time container statistics"
    echo "  cleanup    - Remove all containers and volumes (⚠️  destructive)"
    echo "  reclaim    - Reclaim memory from WSL2 kernel cache"
    echo "  check      - Check Docker Desktop WSL2 integration"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start           # Start with resource limits"
    echo "  $0 status          # Check status and memory usage"
    echo "  $0 stats           # Monitor real-time resource usage"
    echo ""
}
```

**Key points:**
- Use `${1:-help}` for default command
- Exit 1 on unknown command
- Include usage examples in help
- List all available commands

---

## Pattern B: Prerequisite Validation

Scripts verify all dependencies before operations to fail fast with helpful messages.

**When to use**: Before any operation requiring external tools.

### Tool Availability Check

```bash
# scripts/docker/supabase-docker.sh:40-70

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found in WSL2!"
        echo ""
        log_warn "Please enable Docker Desktop WSL2 integration:"
        echo "  1. Open Docker Desktop on Windows"
        echo "  2. Go to Settings → Resources → WSL Integration"
        echo "  3. Enable integration for Ubuntu-24.04"
        echo "  4. Click Apply & Restart"
        exit 1
    fi
    log_debug "Docker version: $(docker --version)"
}

# Function to check if Supabase CLI is available
check_supabase_cli() {
    if ! command -v npx &> /dev/null || ! npx supabase --version &> /dev/null; then
        log_error "Supabase CLI not found!"
        echo "  Install with: npm install -D supabase"
        exit 1
    fi
}

# Function to check if Supabase is initialized
check_supabase_init() {
    if [ ! -f "$PROJECT_ROOT/supabase/config.toml" ]; then
        log_error "Supabase not initialized in this project!"
        echo "  Run: npx supabase init"
        exit 1
    fi
}
```

**Key points:**
- Check with `command -v`
- Provide clear installation instructions on failure
- Exit 1 immediately on missing prerequisite
- Check configuration files exist

---

## Pattern C: Graceful Container Lifecycle

Safe container management checks existing state before operations and waits for readiness.

**When to use**: Starting/stopping containerized services.

### Start with Resource Limits

```bash
# scripts/docker/supabase-docker.sh:97-124

start_supabase() {
    print_header "Starting Supabase with Resource Limits"

    check_docker
    check_supabase_cli
    check_supabase_init

    # Check if already running
    if npx supabase status &> /dev/null; then
        log_warn "Supabase is already running!"
        echo "  Use 'restart' to apply new resource limits"
        exit 0
    fi

    log_info "Starting Supabase services..."
    npx supabase start

    # Apply resource limits after containers are up
    sleep 3  # Give containers time to fully start
    apply_resource_limits

    echo ""
    log_info "✅ Supabase started successfully with resource limits!"
    echo ""

    # Show status
    npx supabase status
}
```

### Stop with Verification

```bash
# scripts/docker/supabase-docker.sh:127-137

stop_supabase() {
    print_header "Stopping Supabase"

    check_supabase_cli

    log_info "Stopping all Supabase containers..."
    npx supabase stop

    echo ""
    log_info "✅ Supabase stopped successfully!"
}
```

**Key points:**
- Check if already running before start
- Sleep for container readiness
- Apply resource limits after start
- Show status after operations

---

## Pattern D: Destructive Operation Confirmation

Dangerous operations require explicit user consent with exact text matching.

**When to use**: Any operation that deletes data or is irreversible.

### Confirmation Pattern

```bash
# scripts/docker/supabase-docker.sh:188-214

cleanup() {
    print_header "Cleanup Supabase Containers & Volumes"

    log_warn "⚠️  This will remove ALL Supabase containers and volumes!"
    log_warn "⚠️  All local database data will be permanently deleted!"
    echo ""
    read -p "Are you sure? Type 'yes' to confirm: " confirm

    if [ "$confirm" = "yes" ]; then
        log_info "Stopping Supabase..."
        npx supabase stop --no-backup || true

        log_info "Removing containers..."
        docker ps -a --filter "name=supabase" --format "{{.ID}}" | xargs -r docker rm -f

        log_info "Removing volumes..."
        docker volume ls --filter "name=supabase" --format "{{.Name}}" | xargs -r docker volume rm

        log_info "Pruning unused Docker resources..."
        docker system prune -f --filter "label=com.supabase.cli.project=$PROJECT_NAME"

        echo ""
        log_info "✅ Cleanup complete!"
    else
        log_info "Cleanup cancelled."
    fi
}
```

**Key points:**
- Print clear warning with emoji
- Require exact text match (not y/n)
- Use `read -p` for inline prompt
- Cancel gracefully if not confirmed

---

## Pattern E: Real-Time Monitoring Loop

Continuous monitoring displays with color-coded thresholds and clean refresh.

**When to use**: Dashboards and live resource tracking.

### Monitoring Loop

```bash
# scripts/docker/monitor-resources.sh:68-209

echo -e "${BOLD}${BLUE}WSL2 & Docker Resource Monitor${NC}"
echo -e "${CYAN}Press Ctrl+C to exit${NC}"
echo ""
sleep 2

while true; do
    clear_screen

    # Header
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║                    WSL2 & Docker Resource Monitor                      ║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # ... monitoring sections ...

    # Footer
    echo -e "${CYAN}Last updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}Refresh interval: 5 seconds${NC}"

    sleep 5
done
```

### Clear Screen Function

```bash
# scripts/docker/monitor-resources.sh:64-66

clear_screen() {
    printf '\033[2J\033[H'
}
```

### Progress Bar Rendering

```bash
# scripts/docker/monitor-resources.sh:41-61

draw_bar() {
    local percent=$1
    local width=30
    local filled=$(echo "scale=0; $percent * $width / 100" | bc)
    local empty=$((width - filled))

    # Color based on usage
    local color=$GREEN
    if (( $(echo "$percent > 80" | bc -l) )); then
        color=$RED
    elif (( $(echo "$percent > 60" | bc -l) )); then
        color=$YELLOW
    fi

    echo -n "["
    echo -ne "${color}"
    for ((i=0; i<filled; i++)); do echo -n "█"; done
    echo -ne "${NC}"
    for ((i=0; i<empty; i++)); do echo -n "░"; done
    echo -n "]"
}
```

### Color-Coded Thresholds

```bash
# scripts/docker/monitor-resources.sh:148-153

# Color code based on memory percentage
mem_perc_num=$(echo $mem_perc | tr -d '%')
color=$GREEN
if (( $(echo "$mem_perc_num > 80" | bc -l) )); then
    color=$RED
elif (( $(echo "$mem_perc_num > 60" | bc -l) )); then
    color=$YELLOW
fi
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

**Current Status:**
- `supabase-docker.sh` - Has `set -e` (compliant)
- `monitor-resources.sh` - **Missing `set -e`** (known issue) - Script is an infinite monitoring loop where fail-fast behavior is less critical since errors in display functions should not terminate the dashboard

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
