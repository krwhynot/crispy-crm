#!/bin/bash
# ============================================================================
# Supabase Docker Lifecycle Management Script
# ============================================================================
# Purpose: Manage Supabase containers with resource limits in WSL2
# Usage: ./scripts/docker/supabase-docker.sh [command]
# ============================================================================

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SUPABASE_DIR="$PROJECT_ROOT/.supabase/docker"
OVERRIDE_FILE="$PROJECT_ROOT/supabase/docker-compose.override.yml"
PROJECT_NAME="crispy-crm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug() { echo -e "${CYAN}[DEBUG]${NC} $1"; }

# Function to print a header
print_header() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

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

# Function to apply resource limits via docker-compose
apply_resource_limits() {
    if [ -f "$OVERRIDE_FILE" ]; then
        log_info "Resource limits will be applied from docker-compose.override.yml"
        log_debug "Override file: $OVERRIDE_FILE"

        # Check if containers are running
        if docker ps | grep -q "supabase_db_$PROJECT_NAME"; then
            log_info "Applying resource limits to running containers..."

            # Get the compose files
            if [ -d "$SUPABASE_DIR" ]; then
                cd "$SUPABASE_DIR"
                # Apply the override configuration to running containers
                docker compose -f docker-compose.yml -f "$OVERRIDE_FILE" up -d --no-recreate
                cd "$PROJECT_ROOT"
            fi
        fi
    else
        log_warn "No override file found at: $OVERRIDE_FILE"
        log_warn "Containers will run without resource limits!"
    fi
}

# Start Supabase with resource limits
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

# Stop Supabase
stop_supabase() {
    print_header "Stopping Supabase"

    check_supabase_cli

    log_info "Stopping all Supabase containers..."
    npx supabase stop

    echo ""
    log_info "✅ Supabase stopped successfully!"
}

# Restart Supabase
restart_supabase() {
    print_header "Restarting Supabase"

    log_info "Stopping Supabase..."
    stop_supabase

    echo ""
    log_info "Waiting for containers to fully stop..."
    sleep 3

    echo ""
    log_info "Starting Supabase..."
    start_supabase
}

# Show status and resource usage
show_status() {
    print_header "Supabase Status & Resource Usage"

    echo -e "${CYAN}=== Service Status ===${NC}"
    npx supabase status 2>/dev/null || log_warn "Supabase not running"

    echo ""
    echo -e "${CYAN}=== Container Resource Usage ===${NC}"

    if docker ps | grep -q "supabase"; then
        docker stats --no-stream --filter "name=supabase" \
            --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    else
        log_warn "No Supabase containers running"
    fi

    echo ""
    echo -e "${CYAN}=== WSL2 Memory Usage ===${NC}"
    free -h | grep -E "^Mem|^Swap"
}

# Show real-time resource statistics
show_stats() {
    print_header "Real-time Container Statistics"

    echo "Press Ctrl+C to exit..."
    echo ""

    docker stats --filter "name=supabase" || log_warn "No containers running"
}

# Cleanup - remove all Supabase containers and volumes
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

# Reclaim memory from WSL2
reclaim_memory() {
    print_header "Reclaim WSL2 Memory"

    log_info "Current memory usage:"
    free -h | grep -E "^Mem"

    echo ""
    log_info "Dropping kernel caches..."
    sudo sh -c 'echo 1 > /proc/sys/vm/drop_caches'

    echo ""
    log_info "Updated memory usage:"
    free -h | grep -E "^Mem"

    echo ""
    log_info "✅ Memory reclaimed!"
}

# Check Docker Desktop integration
check_integration() {
    print_header "Docker Desktop WSL2 Integration Check"

    echo -e "${CYAN}=== Docker Availability ===${NC}"
    if command -v docker &> /dev/null; then
        log_info "✅ Docker command available"
        docker --version
    else
        log_error "❌ Docker command not found"
    fi

    echo ""
    echo -e "${CYAN}=== Docker Daemon ===${NC}"
    if docker ps &> /dev/null; then
        log_info "✅ Docker daemon accessible"
    else
        log_error "❌ Docker daemon not accessible"
        echo "  Enable WSL2 integration in Docker Desktop settings"
    fi

    echo ""
    echo -e "${CYAN}=== WSL2 Configuration ===${NC}"
    if [ -f "/mnt/c/Users/NewAdmin/.wslconfig" ]; then
        log_info "✅ .wslconfig exists"
        echo "  Memory limit: $(grep "^memory=" /mnt/c/Users/NewAdmin/.wslconfig | cut -d= -f2)"
    else
        log_warn "⚠️  .wslconfig not found"
    fi

    echo ""
    echo -e "${CYAN}=== Current Memory ===${NC}"
    free -h | grep -E "^Mem"
}

# Show help
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
    echo "Resource Limits (from docker-compose.override.yml):"
    echo "  PostgreSQL:      2.0 GB RAM, 2 CPUs"
    echo "  Kong Gateway:    512 MB RAM, 1 CPU"
    echo "  Edge Functions:  512 MB RAM, 1 CPU"
    echo "  Studio:          512 MB RAM, 1 CPU"
    echo "  Other services:  256 MB RAM, 0.5 CPU each"
    echo "  Total:           ~4.5 GB RAM"
    echo ""
}

# Main command handler
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