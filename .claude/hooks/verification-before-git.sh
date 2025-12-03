#!/bin/bash
# Verification Before Git Operations Hook
# Blocks git commit/push/PR without running build & type verification first

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
npx tsx "${SCRIPT_DIR}/verification-before-git.ts"
