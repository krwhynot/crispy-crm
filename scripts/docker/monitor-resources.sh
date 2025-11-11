#!/bin/bash
# ============================================================================
# Real-time Resource Monitoring for WSL2 and Docker
# ============================================================================
# Purpose: Monitor memory usage, Docker containers, and WSL2 resources
# Usage: ./scripts/docker/monitor-resources.sh
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -ge 1073741824 ]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc)G"
    elif [ $bytes -ge 1048576 ]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc)M"
    elif [ $bytes -ge 1024 ]; then
        echo "$(echo "scale=2; $bytes/1024" | bc)K"
    else
        echo "${bytes}B"
    fi
}

# Function to get memory percentage
get_mem_percent() {
    local used=$1
    local total=$2
    echo "scale=1; $used * 100 / $total" | bc
}

# Function to draw a progress bar
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

# Clear screen function
clear_screen() {
    printf '\033[2J\033[H'
}

# Main monitoring loop
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

    # WSL2 Memory Section
    echo -e "${CYAN}┌─ WSL2 Memory Usage ────────────────────────────────────────────────────┐${NC}"

    # Get memory info
    mem_info=$(free -b | grep "^Mem:")
    mem_total=$(echo $mem_info | awk '{print $2}')
    mem_used=$(echo $mem_info | awk '{print $3}')
    mem_free=$(echo $mem_info | awk '{print $4}')
    mem_available=$(echo $mem_info | awk '{print $7}')
    mem_percent=$(get_mem_percent $mem_used $mem_total)

    # Display memory
    printf "│ ${BOLD}Total:${NC} %-10s ${BOLD}Used:${NC} %-10s ${BOLD}Free:${NC} %-10s ${BOLD}Available:${NC} %-10s │\n" \
        "$(format_bytes $mem_total)" \
        "$(format_bytes $mem_used)" \
        "$(format_bytes $mem_free)" \
        "$(format_bytes $mem_available)"

    echo -n "│ Usage: "
    draw_bar $mem_percent
    printf " %5.1f%%                                 │\n" $mem_percent

    # Swap info
    swap_info=$(free -b | grep "^Swap:")
    if [ ! -z "$swap_info" ]; then
        swap_total=$(echo $swap_info | awk '{print $2}')
        swap_used=$(echo $swap_info | awk '{print $3}')
        if [ $swap_total -gt 0 ]; then
            swap_percent=$(get_mem_percent $swap_used $swap_total)
            echo -n "│ Swap:  "
            draw_bar $swap_percent
            printf " %5.1f%% ($(format_bytes $swap_used)/$(format_bytes $swap_total))     │\n" $swap_percent
        fi
    fi
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    # Docker Containers Section
    echo -e "${CYAN}┌─ Docker Container Stats ───────────────────────────────────────────────┐${NC}"

    # Check if Docker is running
    if docker ps &> /dev/null; then
        # Get container stats
        container_count=$(docker ps --filter "name=supabase" -q | wc -l)

        if [ $container_count -gt 0 ]; then
            echo -e "│ ${GREEN}Found $container_count Supabase containers${NC}                                             │"
            echo -e "├─────────────────────────────────────────────────────────────────────────┤"

            # Header for stats
            printf "│ %-25s %8s %8s %20s %8s │\n" "Container" "CPU%" "Mem%" "Memory" "Limit"
            echo -e "├─────────────────────────────────────────────────────────────────────────┤"

            # Get stats for each container
            docker stats --no-stream --filter "name=supabase" --format "{{.Name}}|{{.CPUPerc}}|{{.MemPerc}}|{{.MemUsage}}" | \
            while IFS='|' read -r name cpu mem_perc mem_usage; do
                # Truncate long names
                short_name=$(echo $name | sed 's/supabase_//' | cut -c1-25)

                # Parse memory usage
                mem_current=$(echo $mem_usage | cut -d'/' -f1 | tr -d ' ')
                mem_limit=$(echo $mem_usage | cut -d'/' -f2 | tr -d ' ')

                # Color code based on memory percentage
                mem_perc_num=$(echo $mem_perc | tr -d '%')
                color=$GREEN
                if (( $(echo "$mem_perc_num > 80" | bc -l) )); then
                    color=$RED
                elif (( $(echo "$mem_perc_num > 60" | bc -l) )); then
                    color=$YELLOW
                fi

                printf "│ %-25s ${color}%8s %8s %9s${NC} / %-8s │\n" \
                    "$short_name" "$cpu" "$mem_perc" "$mem_current" "$mem_limit"
            done

            # Total memory usage
            echo -e "├─────────────────────────────────────────────────────────────────────────┤"
            total_mem=$(docker stats --no-stream --filter "name=supabase" --format "{{.MemUsage}}" | \
                awk -F'/' '{gsub(/[^0-9.]/,"",$1); sum+=$1} END {print sum}')
            if [ ! -z "$total_mem" ]; then
                printf "│ ${BOLD}Total Container Memory:${NC} %.1f GB                                        │\n" \
                    "$(echo "scale=2; $total_mem / 1024" | bc)"
            fi
        else
            echo -e "│ ${YELLOW}No Supabase containers running${NC}                                          │"
        fi
    else
        echo -e "│ ${RED}Docker daemon not accessible${NC}                                            │"
    fi
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    # Top Processes Section
    echo -e "${CYAN}┌─ Top 5 Memory Consumers ───────────────────────────────────────────────┐${NC}"
    ps aux --sort=-%mem | head -6 | tail -5 | while read line; do
        user=$(echo $line | awk '{print $1}')
        pid=$(echo $line | awk '{print $2}')
        mem=$(echo $line | awk '{print $4}')
        cmd=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | cut -c1-40)

        # Color based on memory usage
        color=$GREEN
        if (( $(echo "$mem > 10" | bc -l) )); then
            color=$RED
        elif (( $(echo "$mem > 5" | bc -l) )); then
            color=$YELLOW
        fi

        printf "│ %-8s %6s ${color}%5.1f%%${NC} %-48s │\n" "$user" "$pid" "$mem" "$cmd"
    done
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    # Footer
    echo -e "${CYAN}Last updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}Refresh interval: 5 seconds${NC}"

    # Warnings
    if (( $(echo "$mem_percent > 80" | bc -l) )); then
        echo ""
        echo -e "${RED}⚠️  WARNING: WSL2 memory usage is above 80%!${NC}"
        echo -e "${YELLOW}   Consider stopping unused containers or reclaiming memory${NC}"
    fi

    sleep 5
done