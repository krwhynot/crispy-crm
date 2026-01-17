#!/bin/bash
# ============================================================================
# WSL2 Disk Analyzer - Comprehensive Disk Space Analysis Tool
# ============================================================================
# Purpose: Analyze and clean disk space in WSL2 with developer-focused detection
# Usage: ./scripts/analyze_disk.sh [command] [options]
# ============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION="1.0.0"

# Default configuration
DRY_RUN=true
USE_COLORS=true
OUTPUT_FILE=""
MIN_SIZE_MB=100
VERBOSE=false
declare -a EXCLUDE_PATHS=("$HOME/projects/crispy-crm")

# Summary tracking
declare -A CATEGORY_SIZES
TOTAL_RECLAIMABLE=0

# ============================================================================
# Colors & Output Formatting
# ============================================================================

setup_colors() {
    if [[ "$USE_COLORS" == true ]] && [[ -t 1 ]]; then
        RED='\033[0;31m'
        GREEN='\033[0;32m'
        YELLOW='\033[1;33m'
        BLUE='\033[0;34m'
        CYAN='\033[0;36m'
        MAGENTA='\033[0;35m'
        BOLD='\033[1m'
        DIM='\033[2m'
        NC='\033[0m'
    else
        RED='' GREEN='' YELLOW='' BLUE='' CYAN='' MAGENTA='' BOLD='' DIM='' NC=''
    fi
}

log_info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_debug()   { [[ "$VERBOSE" == true ]] && echo -e "${DIM}[DEBUG]${NC} $1" || true; }
log_clean()   { echo -e "${MAGENTA}[CLEAN]${NC} $1"; }
log_size()    { echo -e "${CYAN}[SIZE]${NC} $1"; }

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
}

print_section() {
    echo ""
    echo -e "${CYAN}──────────────────────────────────────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}──────────────────────────────────────────────────────────────────────────────────${NC}"
}

# Progress spinner for long operations
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while ps -p "$pid" > /dev/null 2>&1; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        printf "\r"
        sleep $delay
    done
    printf "       \r"
}

# ============================================================================
# Utility Functions
# ============================================================================

# Convert bytes to human-readable format
human_readable() {
    local bytes=$1
    if (( bytes >= 1073741824 )); then
        echo "$(echo "scale=2; $bytes / 1073741824" | bc)G"
    elif (( bytes >= 1048576 )); then
        echo "$(echo "scale=2; $bytes / 1048576" | bc)M"
    elif (( bytes >= 1024 )); then
        echo "$(echo "scale=2; $bytes / 1024" | bc)K"
    else
        echo "${bytes}B"
    fi
}

# Get directory size in bytes (fast)
get_dir_size_bytes() {
    local dir="$1"
    if [[ -d "$dir" ]]; then
        du -sb "$dir" 2>/dev/null | cut -f1 || echo 0
    else
        echo 0
    fi
}

# Get directory size human-readable
get_dir_size() {
    local dir="$1"
    if [[ -d "$dir" ]]; then
        du -sh "$dir" 2>/dev/null | cut -f1 || echo "0"
    else
        echo "0"
    fi
}

# Check if path should be excluded
is_excluded() {
    local path="$1"
    for excluded in "${EXCLUDE_PATHS[@]}"; do
        if [[ "$path" == "$excluded"* ]]; then
            return 0
        fi
    done
    return 1
}

# Add to category total
add_to_category() {
    local category="$1"
    local bytes="$2"
    local current=${CATEGORY_SIZES[$category]:-0}
    CATEGORY_SIZES[$category]=$((current + bytes))
    TOTAL_RECLAIMABLE=$((TOTAL_RECLAIMABLE + bytes))
}

# ============================================================================
# Performance-Optimized File Finding
# ============================================================================

find_largest_files() {
    local path="${1:-$HOME}"
    local limit="${2:-20}"

    print_section "Largest Files in $path"

    # Use fd if available (10x faster), otherwise fallback to find
    if command -v fd &>/dev/null; then
        log_debug "Using fd for fast file search..."
        fd --type f --hidden --no-ignore --size "+${MIN_SIZE_MB}m" . "$path" 2>/dev/null \
            | head -100 \
            | xargs -I {} du -b {} 2>/dev/null \
            | sort -rn \
            | head -"$limit" \
            | while read -r size file; do
                if ! is_excluded "$file"; then
                    printf "  %8s  %s\n" "$(human_readable "$size")" "$file"
                fi
            done
    else
        log_debug "Using du for file search (fd not available)..."
        du -ahx "$path" 2>/dev/null \
            | sort -rh \
            | head -"$limit" \
            | while read -r size file; do
                if ! is_excluded "$file"; then
                    printf "  %8s  %s\n" "$size" "$file"
                fi
            done
    fi
}

# ============================================================================
# Developer Cache Detection (15+ types)
# ============================================================================

analyze_caches() {
    print_header "Developer Cache Analysis"

    # Define cache locations with their clean commands
    declare -A CACHES=(
        # Node.js ecosystem
        ["npm"]="$HOME/.npm|npm cache clean --force"
        ["yarn"]="$HOME/.cache/yarn|yarn cache clean"
        ["yarn-berry"]="$HOME/.yarn/berry/cache|yarn cache clean"
        ["pnpm"]="$HOME/.local/share/pnpm/store|pnpm store prune"
        ["bun"]="$HOME/.bun/install/cache|bun pm cache rm"

        # Python ecosystem
        ["pip"]="$HOME/.cache/pip|pip cache purge"
        ["uv"]="$HOME/.cache/uv|uv cache clean"
        ["poetry"]="$HOME/.cache/pypoetry|poetry cache clear --all ."
        ["pipx"]="$HOME/.local/pipx|pipx uninstall-all (careful!)"

        # Rust
        ["cargo-registry"]="$HOME/.cargo/registry|cargo cache -a (install cargo-cache first)"
        ["cargo-git"]="$HOME/.cargo/git|cargo cache -a"

        # Go
        ["go-mod"]="$HOME/go/pkg/mod|go clean -modcache"
        ["go-build"]="$HOME/.cache/go-build|go clean -cache"

        # Java/JVM
        ["gradle"]="$HOME/.gradle/caches|./gradlew cleanBuildCache"
        ["maven"]="$HOME/.m2/repository|mvn dependency:purge-local-repository"

        # Cloud/DevOps
        ["docker-buildx"]="$HOME/.docker/buildx|docker buildx prune -f"
        ["supabase"]="$HOME/.supabase|supabase db stop (data preserved)"
        ["terraform"]="$HOME/.terraform.d/plugin-cache|rm -rf ~/.terraform.d/plugin-cache/*"

        # IDE/Editors
        ["vscode-server"]="$HOME/.vscode-server/extensions|Manual cleanup needed"
        ["cursor-server"]="$HOME/.cursor-server|Manual cleanup needed"
        ["claude-cli"]="$HOME/.cache/claude-cli-nodejs|rm -rf ~/.cache/claude-cli-nodejs"

        # Browser caches (in WSL)
        ["chromium"]="$HOME/.cache/chromium|rm -rf ~/.cache/chromium"
        ["google-chrome"]="$HOME/.cache/google-chrome|rm -rf ~/.cache/google-chrome"
    )

    local total_cache_bytes=0
    local found_count=0

    echo ""
    printf "  ${BOLD}%-18s %10s  %s${NC}\n" "CACHE" "SIZE" "CLEAN COMMAND"
    echo "  ──────────────────────────────────────────────────────────────────────────────"

    for cache_name in "${!CACHES[@]}"; do
        IFS='|' read -r cache_path clean_cmd <<< "${CACHES[$cache_name]}"

        if [[ -d "$cache_path" ]]; then
            local size_bytes
            size_bytes=$(get_dir_size_bytes "$cache_path")

            if (( size_bytes > MIN_SIZE_MB * 1048576 )); then
                local size_human
                size_human=$(human_readable "$size_bytes")

                printf "  ${YELLOW}%-18s${NC} %10s  ${DIM}%s${NC}\n" "$cache_name" "$size_human" "$clean_cmd"

                total_cache_bytes=$((total_cache_bytes + size_bytes))
                found_count=$((found_count + 1))

                add_to_category "Developer Caches" "$size_bytes"
            fi
        fi
    done

    if (( found_count == 0 )); then
        log_info "No significant caches found (threshold: ${MIN_SIZE_MB}MB)"
    else
        echo ""
        echo "  ──────────────────────────────────────────────────────────────────────────────"
        printf "  ${BOLD}Total reclaimable:${NC} ${GREEN}%s${NC} across %d caches\n" \
            "$(human_readable "$total_cache_bytes")" "$found_count"
    fi
}

# ============================================================================
# WSL2 Configuration Check
# ============================================================================

analyze_wsl2() {
    print_header "WSL2 Configuration & VHD Analysis"

    # Check if we're running in WSL
    if [[ ! -f /proc/version ]] || ! grep -qi "microsoft" /proc/version 2>/dev/null; then
        log_warn "Not running in WSL2 environment"
        return
    fi

    # Current disk usage
    print_section "Current WSL2 Disk Usage"
    echo ""
    df -h / | awk 'NR==1 || /\/$/' | while read -r line; do
        echo "  $line"
    done

    # Memory usage
    echo ""
    echo -e "  ${BOLD}Memory Usage:${NC}"
    free -h | grep -E "^Mem|^Swap" | while read -r line; do
        echo "    $line"
    done

    # Check .wslconfig
    print_section "WSL Configuration Check"

    local wslconfig=""
    for user_path in /mnt/c/Users/*/; do
        if [[ -f "${user_path}.wslconfig" ]]; then
            wslconfig="${user_path}.wslconfig"
            break
        fi
    done

    if [[ -n "$wslconfig" && -f "$wslconfig" ]]; then
        log_info "Found .wslconfig at: $wslconfig"
        echo ""

        # Check for sparseVhd
        if grep -qi "sparseVhd.*=.*true" "$wslconfig" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} sparseVhd=true (VHD auto-compaction enabled)"
        else
            echo -e "  ${YELLOW}!${NC} sparseVhd not enabled"
            echo -e "    ${DIM}Add to [wsl2] section: sparseVhd=true${NC}"
        fi

        # Check memory limit
        local mem_limit
        mem_limit=$(grep -i "^memory=" "$wslconfig" 2>/dev/null | cut -d= -f2 | tr -d ' ')
        if [[ -n "$mem_limit" ]]; then
            echo -e "  ${GREEN}✓${NC} Memory limit: $mem_limit"
        else
            echo -e "  ${DIM}○${NC} No memory limit configured (using 50% of Windows RAM)"
        fi

        # Check swap
        local swap_size
        swap_size=$(grep -i "^swap=" "$wslconfig" 2>/dev/null | cut -d= -f2 | tr -d ' ')
        if [[ -n "$swap_size" ]]; then
            echo -e "  ${GREEN}✓${NC} Swap size: $swap_size"
        fi
    else
        log_warn "No .wslconfig found"
        echo ""
        echo "  Recommended .wslconfig settings:"
        echo -e "  ${DIM}"
        cat << 'EOF'
    [wsl2]
    memory=8GB
    processors=4
    swap=4GB
    sparseVhd=true

    [experimental]
    autoMemoryReclaim=gradual
EOF
        echo -e "  ${NC}"
    fi

    # VHD compaction instructions
    print_section "VHD Compaction Instructions"
    echo ""
    echo "  To reclaim disk space on Windows side:"
    echo ""
    echo -e "  ${BOLD}1. Find your VHD file:${NC}"
    echo "     Typical location: %LOCALAPPDATA%\\Packages\\*Ubuntu*\\LocalState\\ext4.vhdx"
    echo ""
    echo -e "  ${BOLD}2. Shutdown WSL:${NC}"
    echo -e "     ${CYAN}wsl --shutdown${NC}"
    echo ""
    echo -e "  ${BOLD}3. Compact the VHD (PowerShell as Admin):${NC}"
    echo -e "     ${CYAN}Optimize-VHD -Path \"YOUR_VHD_PATH\" -Mode Full${NC}"
    echo ""
    echo -e "  ${BOLD}Alternative using diskpart:${NC}"
    echo -e "     ${CYAN}diskpart${NC}"
    echo -e "     ${CYAN}select vdisk file=\"YOUR_VHD_PATH\"${NC}"
    echo -e "     ${CYAN}compact vdisk${NC}"
    echo -e "     ${CYAN}exit${NC}"
}

# ============================================================================
# Project Cleanup Detection
# ============================================================================

analyze_projects() {
    print_header "Developer Project Analysis"

    local search_paths=("$HOME/projects" "$HOME/repos" "$HOME/src" "$HOME/code" "$HOME/dev")
    local total_stale_bytes=0
    local total_build_bytes=0
    local total_git_bytes=0

    # Stale node_modules
    print_section "Stale node_modules (package.json >30 days old)"
    echo ""

    local stale_count=0
    for search_path in "${search_paths[@]}"; do
        [[ ! -d "$search_path" ]] && continue

        while IFS= read -r -d '' pkg_json; do
            local project_dir
            project_dir=$(dirname "$pkg_json")
            local node_modules="$project_dir/node_modules"

            # Skip excluded paths
            is_excluded "$project_dir" && continue

            if [[ -d "$node_modules" ]]; then
                # Check if package.json is older than 30 days
                local pkg_age
                pkg_age=$(( ($(date +%s) - $(stat -c %Y "$pkg_json")) / 86400 ))

                if (( pkg_age > 30 )); then
                    local size_bytes
                    size_bytes=$(get_dir_size_bytes "$node_modules")
                    local size_human
                    size_human=$(human_readable "$size_bytes")

                    if (( size_bytes > 10485760 )); then  # >10MB
                        printf "  ${YELLOW}%-50s${NC} %8s  ${DIM}(%d days old)${NC}\n" \
                            "${project_dir/#$HOME/~}" "$size_human" "$pkg_age"
                        total_stale_bytes=$((total_stale_bytes + size_bytes))
                        ((stale_count++))
                    fi
                fi
            fi
        done < <(find "$search_path" -maxdepth 4 -name "package.json" -type f -print0 2>/dev/null)
    done

    if (( stale_count == 0 )); then
        log_info "No stale node_modules found"
    else
        echo ""
        log_size "Total stale node_modules: $(human_readable "$total_stale_bytes")"
        echo -e "  ${DIM}Tip: Use 'npx npkill' for interactive cleanup${NC}"
        add_to_category "Stale node_modules" "$total_stale_bytes"
    fi

    # Build artifacts
    print_section "Build Artifacts"
    echo ""

    local build_dirs=(".next" "dist" "build" "target" "__pycache__" ".pytest_cache"
                      ".mypy_cache" ".ruff_cache" "coverage" ".nyc_output" ".turbo")
    local build_count=0

    for search_path in "${search_paths[@]}"; do
        [[ ! -d "$search_path" ]] && continue

        for build_dir in "${build_dirs[@]}"; do
            while IFS= read -r -d '' artifact; do
                is_excluded "$artifact" && continue

                local size_bytes
                size_bytes=$(get_dir_size_bytes "$artifact")

                if (( size_bytes > MIN_SIZE_MB * 1048576 )); then
                    local size_human
                    size_human=$(human_readable "$size_bytes")
                    printf "  ${YELLOW}%-50s${NC} %8s\n" "${artifact/#$HOME/~}" "$size_human"
                    total_build_bytes=$((total_build_bytes + size_bytes))
                    ((build_count++))
                fi
            done < <(find "$search_path" -maxdepth 5 -type d -name "$build_dir" -print0 2>/dev/null)
        done
    done

    if (( build_count == 0 )); then
        log_info "No significant build artifacts found (threshold: ${MIN_SIZE_MB}MB)"
    else
        echo ""
        log_size "Total build artifacts: $(human_readable "$total_build_bytes")"
        add_to_category "Build Artifacts" "$total_build_bytes"
    fi

    # Large .git directories
    print_section "Large Git Repositories"
    echo ""

    local git_count=0
    for search_path in "${search_paths[@]}"; do
        [[ ! -d "$search_path" ]] && continue

        while IFS= read -r -d '' git_dir; do
            is_excluded "$(dirname "$git_dir")" && continue

            local size_bytes
            size_bytes=$(get_dir_size_bytes "$git_dir")

            if (( size_bytes > 200 * 1048576 )); then  # >200MB
                local size_human
                size_human=$(human_readable "$size_bytes")
                local repo_path
                repo_path=$(dirname "$git_dir")
                printf "  ${YELLOW}%-50s${NC} %8s\n" "${repo_path/#$HOME/~}" "$size_human"
                total_git_bytes=$((total_git_bytes + size_bytes))
                ((git_count++))
            fi
        done < <(find "$search_path" -maxdepth 4 -type d -name ".git" -print0 2>/dev/null)
    done

    if (( git_count == 0 )); then
        log_info "No large .git directories found (threshold: 200MB)"
    else
        echo ""
        log_size "Total large .git: $(human_readable "$total_git_bytes")"
        echo -e "  ${DIM}Tip: Run 'git gc --aggressive' in each repo to reclaim space${NC}"
        add_to_category "Large .git" "$total_git_bytes"
    fi
}

# ============================================================================
# System Cleanup Analysis
# ============================================================================

analyze_system() {
    print_header "System Cleanup Opportunities"

    local total_system_bytes=0

    # Journal logs
    print_section "System Journal Logs"
    if command -v journalctl &>/dev/null; then
        local journal_size
        journal_size=$(journalctl --disk-usage 2>/dev/null | grep -oP '[\d.]+[GMKB]+' | head -1 || echo "0")
        echo "  Current journal size: $journal_size"
        echo -e "  ${DIM}Clean: sudo journalctl --vacuum-size=100M${NC}"
    fi

    # Old log files
    print_section "Old Log Files"
    local log_bytes=0

    for log_pattern in "/var/log/*.gz" "/var/log/*.old" "/var/log/*.[0-9]"; do
        for log_file in $log_pattern; do
            [[ -f "$log_file" ]] || continue
            local size
            size=$(stat -c %s "$log_file" 2>/dev/null || echo 0)
            log_bytes=$((log_bytes + size))
        done
    done

    if (( log_bytes > 0 )); then
        echo "  Rotated/old logs: $(human_readable "$log_bytes")"
        echo -e "  ${DIM}Clean: sudo rm /var/log/*.gz /var/log/*.old${NC}"
        total_system_bytes=$((total_system_bytes + log_bytes))
    else
        log_info "No old log files found"
    fi

    # Temp files
    print_section "Temporary Files"
    local tmp_bytes=0

    for tmp_dir in "/tmp" "/var/tmp" "$HOME/.cache"; do
        if [[ -d "$tmp_dir" ]]; then
            # Find files older than 7 days
            while IFS= read -r -d '' file; do
                local size
                size=$(stat -c %s "$file" 2>/dev/null || echo 0)
                tmp_bytes=$((tmp_bytes + size))
            done < <(find "$tmp_dir" -type f -mtime +7 -print0 2>/dev/null)
        fi
    done

    if (( tmp_bytes > 1048576 )); then  # >1MB
        echo "  Old temp files (>7 days): $(human_readable "$tmp_bytes")"
        echo -e "  ${DIM}Clean: find /tmp -type f -mtime +7 -delete${NC}"
        total_system_bytes=$((total_system_bytes + tmp_bytes))
    else
        log_info "Minimal temp files found"
    fi

    # Core dumps
    print_section "Core Dumps"
    local coredump_dir="/var/lib/systemd/coredump"
    if [[ -d "$coredump_dir" ]]; then
        local core_bytes
        core_bytes=$(get_dir_size_bytes "$coredump_dir")
        if (( core_bytes > 1048576 )); then
            echo "  Core dumps: $(human_readable "$core_bytes")"
            echo -e "  ${DIM}Clean: sudo rm -rf /var/lib/systemd/coredump/*${NC}"
            total_system_bytes=$((total_system_bytes + core_bytes))
        else
            log_info "No significant core dumps found"
        fi
    fi

    # APT cache
    print_section "APT Package Cache"
    local apt_cache="/var/cache/apt/archives"
    if [[ -d "$apt_cache" ]]; then
        local apt_bytes
        apt_bytes=$(get_dir_size_bytes "$apt_cache")
        if (( apt_bytes > 10485760 )); then  # >10MB
            echo "  APT cache: $(human_readable "$apt_bytes")"
            echo -e "  ${DIM}Clean: sudo apt-get clean${NC}"
            total_system_bytes=$((total_system_bytes + apt_bytes))
        else
            log_info "APT cache is minimal"
        fi
    fi

    # Snap cache (if exists)
    local snap_cache="$HOME/snap"
    if [[ -d "$snap_cache" ]]; then
        local snap_bytes
        snap_bytes=$(get_dir_size_bytes "$snap_cache")
        if (( snap_bytes > 100 * 1048576 )); then  # >100MB
            print_section "Snap Cache"
            echo "  Snap data: $(human_readable "$snap_bytes")"
            echo -e "  ${DIM}Check: snap list --all (look for disabled versions)${NC}"
            total_system_bytes=$((total_system_bytes + snap_bytes))
        fi
    fi

    if (( total_system_bytes > 0 )); then
        add_to_category "System Cleanup" "$total_system_bytes"
    fi
}

# ============================================================================
# Interactive Cleanup Mode
# ============================================================================

cleanup_category() {
    local category="$1"
    local description="$2"

    echo ""
    echo -e "${YELLOW}Ready to clean: $category${NC}"
    echo "  $description"
    echo ""

    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${CYAN}[DRY-RUN] Would execute cleanup for: $category${NC}"
        return 0
    fi

    read -rp "  Type 'CLEAN' to proceed, or press Enter to skip: " confirm

    if [[ "$confirm" == "CLEAN" ]]; then
        log_clean "Cleaning $category..."
        return 0
    else
        log_info "Skipped $category"
        return 1
    fi
}

interactive_cleanup() {
    print_header "Interactive Cleanup Mode"

    if [[ "$DRY_RUN" == true ]]; then
        echo ""
        echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  DRY-RUN MODE - No changes will be made                                      ║${NC}"
        echo -e "${YELLOW}║  Use --force flag to actually delete files                                   ║${NC}"
        echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    else
        echo ""
        echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  LIVE MODE - Files will be permanently deleted!                               ║${NC}"
        echo -e "${RED}║  Make sure you have backups of important data                                 ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    fi

    echo ""
    echo "Available cleanup categories:"
    echo ""

    local i=1
    local categories=()

    for category in "${!CATEGORY_SIZES[@]}"; do
        local size=${CATEGORY_SIZES[$category]}
        if (( size > 0 )); then
            printf "  ${BOLD}%d.${NC} %-25s %10s\n" "$i" "$category" "$(human_readable "$size")"
            categories+=("$category")
            ((i++))
        fi
    done

    if (( ${#categories[@]} == 0 )); then
        log_info "No cleanup opportunities found!"
        return
    fi

    echo ""
    printf "  ${BOLD}Total reclaimable:${NC} ${GREEN}%s${NC}\n" "$(human_readable "$TOTAL_RECLAIMABLE")"
    echo ""

    # NPM cache cleanup
    if [[ -d "$HOME/.npm" ]]; then
        if cleanup_category "npm cache" "npm cache clean --force"; then
            if [[ "$DRY_RUN" == false ]]; then
                npm cache clean --force 2>/dev/null && log_info "npm cache cleaned!"
            fi
        fi
    fi

    # Pip cache cleanup
    if [[ -d "$HOME/.cache/pip" ]]; then
        if cleanup_category "pip cache" "pip cache purge"; then
            if [[ "$DRY_RUN" == false ]]; then
                pip cache purge 2>/dev/null && log_info "pip cache cleaned!"
            fi
        fi
    fi

    # Go cache cleanup
    if [[ -d "$HOME/.cache/go-build" ]]; then
        if cleanup_category "Go build cache" "go clean -cache"; then
            if [[ "$DRY_RUN" == false ]]; then
                go clean -cache 2>/dev/null && log_info "Go cache cleaned!"
            fi
        fi
    fi

    # Yarn cache cleanup
    if [[ -d "$HOME/.cache/yarn" ]] || [[ -d "$HOME/.yarn/berry/cache" ]]; then
        if cleanup_category "Yarn cache" "yarn cache clean"; then
            if [[ "$DRY_RUN" == false ]]; then
                yarn cache clean 2>/dev/null && log_info "Yarn cache cleaned!"
            fi
        fi
    fi

    # Docker buildx cleanup
    if [[ -d "$HOME/.docker/buildx" ]]; then
        if cleanup_category "Docker buildx cache" "docker buildx prune -f"; then
            if [[ "$DRY_RUN" == false ]]; then
                docker buildx prune -f 2>/dev/null && log_info "Docker buildx cache cleaned!"
            fi
        fi
    fi

    # System cleanup (requires sudo)
    if [[ "$DRY_RUN" == false ]]; then
        echo ""
        echo -e "${BOLD}System cleanup (requires sudo):${NC}"

        if cleanup_category "APT cache" "sudo apt-get clean && sudo apt-get autoremove"; then
            sudo apt-get clean 2>/dev/null
            sudo apt-get autoremove -y 2>/dev/null
            log_info "APT cache cleaned!"
        fi

        if cleanup_category "Journal logs" "sudo journalctl --vacuum-size=100M"; then
            sudo journalctl --vacuum-size=100M 2>/dev/null
            log_info "Journal logs trimmed!"
        fi
    fi

    echo ""
    log_info "Cleanup complete!"
}

# ============================================================================
# Summary Report
# ============================================================================

generate_summary() {
    print_header "Disk Analysis Summary"

    echo ""
    echo -e "${BOLD}Reclaimable Space by Category:${NC}"
    echo ""

    # Sort categories by size (descending)
    for category in "${!CATEGORY_SIZES[@]}"; do
        echo "${CATEGORY_SIZES[$category]} $category"
    done | sort -rn | while read -r size category; do
        if (( size > 0 )); then
            local bar_width=$((size * 40 / (TOTAL_RECLAIMABLE + 1)))
            local bar=""
            for ((i=0; i<bar_width; i++)); do bar+="█"; done
            for ((i=bar_width; i<40; i++)); do bar+="░"; done

            printf "  %-20s %10s  ${GREEN}%s${NC}\n" "$category" "$(human_readable "$size")" "$bar"
        fi
    done

    echo ""
    echo "  ════════════════════════════════════════════════════════════════════════════"
    printf "  ${BOLD}%-20s %10s${NC}\n" "TOTAL RECLAIMABLE" "$(human_readable "$TOTAL_RECLAIMABLE")"
    echo ""

    # Quick actions
    echo -e "${BOLD}Quick Actions:${NC}"
    echo ""
    echo "  1. Run cleanup:      ./scripts/analyze_disk.sh clean --force"
    echo "  2. Interactive:      npx npkill (for node_modules)"
    echo "  3. Visual explorer:  ncdu ~"
    echo ""

    # Save report if requested
    if [[ -n "$OUTPUT_FILE" ]]; then
        {
            echo "WSL2 Disk Analysis Report"
            echo "Generated: $(date)"
            echo "========================="
            echo ""
            echo "Total Reclaimable: $(human_readable "$TOTAL_RECLAIMABLE")"
            echo ""
            echo "By Category:"
            for category in "${!CATEGORY_SIZES[@]}"; do
                local size=${CATEGORY_SIZES[$category]}
                if (( size > 0 )); then
                    printf "  %-20s %s\n" "$category" "$(human_readable "$size")"
                fi
            done
        } > "$OUTPUT_FILE"

        log_info "Report saved to: $OUTPUT_FILE"
    fi
}

# ============================================================================
# Quick Summary (fast overview)
# ============================================================================

quick_summary() {
    print_header "Quick Disk Summary"

    echo ""
    echo -e "${BOLD}Disk Usage:${NC}"
    df -h / | awk 'NR==1 || /\/$/' | while read -r line; do
        echo "  $line"
    done

    echo ""
    echo -e "${BOLD}Memory:${NC}"
    free -h | grep -E "^Mem" | while read -r line; do
        echo "  $line"
    done

    echo ""
    echo -e "${BOLD}Largest Directories in HOME:${NC}"
    du -hx --max-depth=1 "$HOME" 2>/dev/null | sort -rh | head -10 | while read -r line; do
        echo "  $line"
    done

    echo ""
    echo -e "${DIM}Run './scripts/analyze_disk.sh' for full analysis${NC}"
}

# ============================================================================
# Argument Parsing
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --no-color)
                USE_COLORS=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                DRY_RUN=false
                shift
                ;;
            --output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --min-size)
                MIN_SIZE_MB="$2"
                shift 2
                ;;
            --exclude)
                EXCLUDE_PATHS+=("$2")
                shift 2
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --version)
                echo "WSL2 Disk Analyzer v$VERSION"
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                COMMAND="$1"
                shift
                ;;
        esac
    done
}

# ============================================================================
# Help
# ============================================================================

show_help() {
    print_header "WSL2 Disk Analyzer v$VERSION"

    echo "Usage: $0 [command] [options]"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo "  analyze     Full disk analysis (default)"
    echo "  clean       Interactive cleanup mode (dry-run by default)"
    echo "  summary     Quick disk usage summary"
    echo "  caches      Analyze developer caches only"
    echo "  projects    Analyze project directories only"
    echo "  wsl         WSL2 configuration check only"
    echo "  system      System cleanup opportunities only"
    echo "  largest     Find largest files"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --no-color      Disable colored output"
    echo "  --dry-run       Preview cleanup without changes (default for 'clean')"
    echo "  --force         Actually perform cleanup operations"
    echo "  --output FILE   Save report to file"
    echo "  --min-size MB   Minimum size threshold in MB (default: 100)"
    echo "  --exclude PATH  Additional path to exclude (can be repeated)"
    echo "  --verbose, -v   Show debug information"
    echo "  --version       Show version"
    echo "  --help, -h      Show this help"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $0                          # Full analysis"
    echo "  $0 summary                  # Quick overview"
    echo "  $0 clean                    # Preview cleanup"
    echo "  $0 clean --force            # Actually clean"
    echo "  $0 --no-color > report.txt  # Save to file"
    echo "  $0 --min-size 50            # Lower threshold"
    echo "  $0 --exclude ~/other-project # Add exclusion"
    echo ""
    echo -e "${BOLD}Default Exclusions:${NC}"
    for path in "${EXCLUDE_PATHS[@]}"; do
        echo "  - $path"
    done
    echo ""
}

# ============================================================================
# Main Entry Point
# ============================================================================

main() {
    COMMAND="${1:-analyze}"
    shift 2>/dev/null || true

    parse_args "$@"
    setup_colors

    case "$COMMAND" in
        analyze|full)
            analyze_caches
            analyze_wsl2
            analyze_projects
            analyze_system
            generate_summary
            ;;
        clean)
            analyze_caches
            analyze_projects
            analyze_system
            interactive_cleanup
            ;;
        summary|quick)
            quick_summary
            ;;
        caches|cache)
            analyze_caches
            ;;
        projects|project)
            analyze_projects
            ;;
        wsl|wsl2|vhd)
            analyze_wsl2
            ;;
        system|sys)
            analyze_system
            ;;
        largest|files)
            find_largest_files "$HOME" 30
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
