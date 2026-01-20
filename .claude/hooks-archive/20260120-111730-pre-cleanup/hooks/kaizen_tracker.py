#!/usr/bin/env python3
"""
Commit Tracker - Records commits for analytics and invalidates cache
"""
import sys
import os
import json
import re

COMMIT_REGEX = r"^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\([\w\-\.]+\))?!?:\s.+"


def read_stdin_json():
    """Read JSON input from stdin (new Claude Code hook API)"""
    try:
        input_data = sys.stdin.read()
        if input_data:
            return json.loads(input_data)
    except (json.JSONDecodeError, IOError):
        pass
    return {}


def get_bash_command(hook_data):
    """Get command from hook input data"""
    tool_input = hook_data.get('tool_input', {})
    return tool_input.get('command', '')


def get_bash_output(hook_data):
    """Get output from hook response data"""
    tool_response = hook_data.get('tool_response', {})
    stdout = tool_response.get('stdout', '')
    stderr = tool_response.get('stderr', '')
    return f"{stdout}\n{stderr}"


def was_commit_successful(output):
    """Check if git commit was successful"""
    success_indicators = ['create mode', 'insertions', 'deletions', 'files changed', '[main', '[master', 'Author:']
    return any(ind in output for ind in success_indicators)


def extract_commit_type(command):
    """Extract commit type and scope from command"""
    patterns = [
        r'git\s+commit\s+.*-m\s*["\'](.+?)["\']',
        r'git\s+commit\s+.*-m\s*\$\(cat\s+<<[\'"]?EOF[\'"]?\n(.+?)\nEOF',
    ]
    for pattern in patterns:
        match = re.search(pattern, command, re.DOTALL | re.IGNORECASE)
        if match:
            message = match.group(1).strip().split('\n')[0]
            full_match = re.match(r'^(\w+)(?:\(([^)]+)\))?', message)
            if full_match:
                commit_type = full_match.group(1).lower()
                scope = full_match.group(2).lower() if full_match.group(2) else None
                return (commit_type, scope)
    return (None, None)


def invalidate_analytics_cache():
    """Delete cache file to trigger fresh analytics"""
    cache_path = os.path.join(os.environ.get('CLAUDE_PROJECT_DIR', '.'), '.claude/cache/churn_cache.json')
    try:
        if os.path.exists(cache_path):
            os.remove(cache_path)
    except:
        pass


def main():
    hook_data = read_stdin_json()
    command = get_bash_command(hook_data)
    output = get_bash_output(hook_data)

    # Only track successful git commits
    if 'git commit' not in command.lower():
        sys.exit(0)

    if not was_commit_successful(output):
        sys.exit(0)

    commit_type, scope = extract_commit_type(command)
    if not commit_type:
        sys.exit(0)

    # Invalidate analytics cache on any successful commit
    invalidate_analytics_cache()

    # Output feedback
    if scope == 'checkpoint':
        print("📸 Checkpoint saved")
    elif scope:
        print(f"📝 Commit recorded: {commit_type}({scope})")
    else:
        print(f"📝 Commit recorded: {commit_type}")

    sys.exit(0)


if __name__ == '__main__':
    main()
