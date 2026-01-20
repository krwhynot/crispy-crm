#!/usr/bin/env python3
"""
Kaizen Gate - Semantic Commit Enforcement Hook
Blocks vague commit messages and enforces Conventional Commits format
"""
import sys
import os
import json
import re

# Conventional Commits regex
COMMIT_REGEX = r"^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\([\w\-\.]+\))?!?:\s.+"

# Banned vague messages (case-insensitive)
VAGUE_MESSAGES = [
    'updates', 'update', 'changes', 'change', 'fixes', 'fix',
    'wip', 'stuff', 'misc', 'minor', 'various', 'temp', 'test',
    'asdf', 'foo', 'bar', 'commit', 'save', 'done', 'finished'
]

def get_bash_command():
    """Extract command from CLAUDE_TOOL_INPUT for Bash tool"""
    tool_input = os.environ.get('CLAUDE_TOOL_INPUT', '{}')
    try:
        data = json.loads(tool_input)
        return data.get('command', '')
    except json.JSONDecodeError:
        return ''

def extract_commit_message(command):
    """Extract commit message from git commit command"""
    # Match: git commit -m "message" or git commit -m 'message'
    patterns = [
        r'git\s+commit\s+.*-m\s*["\'](.+?)["\']',
        r'git\s+commit\s+.*-m\s*\$\(cat\s+<<[\'"]?EOF[\'"]?\n(.+?)\nEOF',  # HEREDOC
    ]
    for pattern in patterns:
        match = re.search(pattern, command, re.DOTALL | re.IGNORECASE)
        if match:
            # Get just the first line (commit title)
            return match.group(1).strip().split('\n')[0]
    return None

def is_commit_command(command):
    """Check if this is a git commit command"""
    return 'git commit' in command.lower() and '-m' in command

def main():
    command = get_bash_command()

    if not command:
        sys.exit(0)  # Allow - no command

    if not is_commit_command(command):
        sys.exit(0)  # Allow - not a commit

    message = extract_commit_message(command)

    if not message:
        sys.exit(0)  # Allow - couldn't parse (let git handle it)

    # Check for vague messages (exact match, case-insensitive)
    if message.lower().strip() in VAGUE_MESSAGES:
        print(f"🔴 Kaizen Violation: Vague commit message")
        print(f"   Message: '{message}'")
        print(f"   Commits should tell a story. Use: type(scope): description")
        print(f"   Examples:")
        print(f"     feat(auth): add OAuth2 token refresh")
        print(f"     fix(forms): prevent double submission on slow networks")
        print(f"     refactor(providers): extract validation to service layer")
        sys.exit(2)  # BLOCK

    # Check Conventional Commits format
    if not re.match(COMMIT_REGEX, message):
        print(f"🔴 Kaizen Gate: Non-conventional commit format")
        print(f"   Message: '{message}'")
        print(f"   Required format: type(scope): description")
        print(f"   Valid types: feat, fix, docs, style, refactor, perf, test, chore, build, ci")
        print(f"   Example: fix(contacts): handle null organization gracefully")
        sys.exit(2)  # BLOCK

    # Success - well-formed commit
    commit_type = message.split('(')[0].split(':')[0]
    print(f"✅ Kaizen: Good commit ({commit_type})")
    sys.exit(0)  # Allow

if __name__ == '__main__':
    main()
