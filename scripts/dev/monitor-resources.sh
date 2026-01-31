#!/bin/bash
# Resource Monitoring Script - Watch memory and CPU during development
# Shows real-time resource usage for Node processes

set -e

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Atomic CRM - Resource Monitor                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to format bytes as MB/GB
format_memory() {
  echo $1 | awk '{if ($1 >= 1024) printf "%.1fGB\n", $1/1024; else printf "%dMB\n", $1}'
}

# Monitor loop
while true; do
  clear

  # System Memory
  echo -e "${YELLOW}System Memory:${NC}"
  free -h | tail -2

  echo ""
  echo -e "${YELLOW}Top Node Processes (by memory):${NC}"
  # Show top Node processes by memory
  ps aux --sort=-%mem | grep -E "node|vite|supabase" | head -8 | awk '{
    printf "  %-8s %5.1f%% %5.1f%% %s\n", $1, $3, $4, substr($0, index($0,$11))
  }' | head -5

  echo ""
  echo -e "${YELLOW}Supabase Container Memory:${NC}"
  # Show Docker container memory if running
  if command -v docker &> /dev/null; then
    docker ps --filter="label=com.supabase.local=true" --format="table {{.Names}}\t{{.Status}}" 2>/dev/null | tail -5 || echo "  No Supabase containers running"
  else
    echo "  Docker not found"
  fi

  echo ""
  echo -e "${BLUE}Last Updated: $(date '+%H:%M:%S')${NC}"
  echo "Refresh interval: 2 seconds (change with \$INTERVAL)"

  sleep ${INTERVAL:-2}
done
