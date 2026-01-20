#!/usr/bin/env python3
"""
Churn Guard - File Churn Detection Hook
Blocks edits to files with excessive recent modifications (>= 10 commits in 14 days)
Warns on moderate churn (>= 6 commits)
"""
import sys
import os
import json
import subprocess
from datetime import datetime, timedelta

def get_file_path():
    """Extract file path from CLAUDE_TOOL_INPUT env var for Edit/Write tools"""
    tool_input = os.environ.get('CLAUDE_TOOL_INPUT', '{}')
    try:
        data = json.loads(tool_input)
        return data.get('file_path', '')
    except json.JSONDecodeError:
        return ''

def is_excluded(file_path):
    """Check if file is excluded from churn detection"""
    exclusions = [
        '.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx',  # TDD churn expected
        '.md',  # Documentation
        'package.json', 'package-lock.json', 'pnpm-lock.yaml',  # Dependencies
        '.claude/',  # Config files
        '.baseline/',  # Audit baseline files (churn = progress tracking)
    ]
    for exc in exclusions:
        if exc in file_path:
            return True
    return False

def file_is_new(file_path, days=3):
    """Check if file was created less than N days ago"""
    try:
        result = subprocess.run(
            ['git', 'log', '--diff-filter=A', '--format=%aI', '--', file_path],
            capture_output=True, text=True, cwd=os.environ.get('CLAUDE_PROJECT_DIR', '.')
        )
        if result.stdout.strip():
            created_date = datetime.fromisoformat(result.stdout.strip().split('\n')[0].replace('Z', '+00:00'))
            return datetime.now(created_date.tzinfo) - created_date < timedelta(days=days)
    except:
        pass
    return False

def get_churn_count(file_path, days=14):
    """Count commits touching file in last N days"""
    try:
        since_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        result = subprocess.run(
            ['git', 'log', f'--since={since_date}', '--oneline', '--', file_path],
            capture_output=True, text=True, cwd=os.environ.get('CLAUDE_PROJECT_DIR', '.')
        )
        return len([l for l in result.stdout.strip().split('\n') if l])
    except:
        return 0

def main():
    file_path = get_file_path()

    if not file_path:
        sys.exit(0)  # Allow - no file path

    if is_excluded(file_path):
        sys.exit(0)  # Allow - excluded file type

    if file_is_new(file_path):
        sys.exit(0)  # Allow - honeymoon period

    churn = get_churn_count(file_path)

    if churn >= 10:
        print(f"⚠️ High Churn Warning: {file_path}")
        print(f"   This file has {churn} edits in 14 days. Consider refactoring.")
        print(f"   Review history: git log --oneline -20 -- {file_path}")
        sys.exit(2)  # BLOCK
    elif churn >= 6:
        print(f"📊 Churn Notice: {file_path}")
        print(f"   {churn} edits in 14 days - approaching threshold.")
        sys.exit(0)  # WARN but allow

    sys.exit(0)  # Allow

if __name__ == '__main__':
    main()
