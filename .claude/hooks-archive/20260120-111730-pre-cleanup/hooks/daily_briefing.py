#!/usr/bin/env python3
"""
Daily Briefing - SessionStart Hook
Displays code health insights including high-churn files
"""
import sys
import os
import subprocess


def get_top_churn_files(limit=3):
    """Get files with highest churn in last 14 days"""
    try:
        project_dir = os.environ.get('CLAUDE_PROJECT_DIR', '.')
        result = subprocess.run(
            ['git', 'log', '--since=14 days ago', '--name-only', '--pretty=format:'],
            capture_output=True, text=True, cwd=project_dir
        )

        files = {}
        for line in result.stdout.strip().split('\n'):
            if line and not line.startswith('.claude/') and not line.endswith('.md'):
                files[line] = files.get(line, 0) + 1

        # Sort by churn count
        sorted_files = sorted(files.items(), key=lambda x: -x[1])
        return sorted_files[:limit]
    except Exception:
        return []


def format_churn_warning(churn_count):
    """Format churn warning indicator"""
    if churn_count >= 10:
        return f"({churn_count} edits)"
    elif churn_count >= 6:
        return f"({churn_count} edits)"
    else:
        return f"({churn_count} edits)"


def main():
    print()
    print("📊 Code Health Check")

    churn_files = get_top_churn_files()
    if churn_files:
        print("   Churn Watch (14 days):")
        for filepath, count in churn_files:
            warning = format_churn_warning(count)
            display_path = filepath if len(filepath) < 50 else f"...{filepath[-47:]}"
            print(f"      {display_path} {warning}")

    print()
    print("💡 Run /health-summary for detailed analysis")
    print()

    sys.exit(0)


if __name__ == '__main__':
    main()
