#!/usr/bin/env python3
"""
Code Analytics Engine - Pure data analysis with HEAD-based caching
No gamification, just actionable insights.
"""
import os
import json
import subprocess
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any, Literal

CACHE_FILE = '.claude/cache/churn_cache.json'
HISTORY_FILE = '.claude/analytics_history.json'

@dataclass
class FileChurn:
    path: str
    edit_count: int
    recent_7d: int
    authors: List[str]

@dataclass
class CouplingPair:
    file_a: str
    file_b: str
    co_change_count: int
    confidence: float

@dataclass
class Recommendation:
    type: Literal["high_churn", "coupling", "module_focus", "firefighting"]
    target: str
    reason: str
    suggested_action: str
    data: Dict[str, Any]

def get_project_dir() -> str:
    return os.environ.get('CLAUDE_PROJECT_DIR', '.')

def get_git_head() -> str:
    """Get current HEAD SHA"""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', 'HEAD'],
            capture_output=True, text=True, cwd=get_project_dir()
        )
        return result.stdout.strip()
    except:
        return ''

def get_cache_path() -> str:
    return os.path.join(get_project_dir(), CACHE_FILE)

def load_cache() -> Optional[Dict]:
    """Load cache if exists"""
    try:
        with open(get_cache_path(), 'r') as f:
            return json.load(f)
    except:
        return None

def save_cache(head_sha: str, data: Dict) -> None:
    """Save computed data to cache"""
    cache = {
        'version': '1.0',
        'head_sha': head_sha,
        'generated_at': datetime.now().isoformat(),
        'window_days': 14,
        'data': data
    }
    path = get_cache_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(cache, f, indent=2)

def get_file_churn(days: int = 14) -> List[FileChurn]:
    """Get files with highest churn in last N days"""
    project_dir = get_project_dir()
    since_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    # Get file edit counts
    result = subprocess.run(
        ['git', 'log', f'--since={since_date}', '--name-only', '--pretty=format:'],
        capture_output=True, text=True, cwd=project_dir
    )

    file_counts = {}
    for line in result.stdout.strip().split('\n'):
        if line and not line.startswith('.claude/'):
            file_counts[line] = file_counts.get(line, 0) + 1

    # Get recent 7d counts
    since_7d = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    result_7d = subprocess.run(
        ['git', 'log', f'--since={since_7d}', '--name-only', '--pretty=format:'],
        capture_output=True, text=True, cwd=project_dir
    )

    recent_counts = {}
    for line in result_7d.stdout.strip().split('\n'):
        if line:
            recent_counts[line] = recent_counts.get(line, 0) + 1

    # Build FileChurn objects
    churn_list = []
    for path, count in sorted(file_counts.items(), key=lambda x: -x[1]):
        churn_list.append(FileChurn(
            path=path,
            edit_count=count,
            recent_7d=recent_counts.get(path, 0),
            authors=[]  # Could add author tracking later
        ))

    return churn_list

def detect_coupling(days: int = 14, min_support: int = 3) -> List[CouplingPair]:
    """Detect files that frequently change together"""
    project_dir = get_project_dir()
    since_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    # Get commits with their files
    result = subprocess.run(
        ['git', 'log', f'--since={since_date}', '--name-only', '--pretty=format:%H'],
        capture_output=True, text=True, cwd=project_dir
    )

    # Parse commits and their files
    commits = {}
    current_commit = None
    for line in result.stdout.strip().split('\n'):
        if len(line) == 40:  # SHA
            current_commit = line
            commits[current_commit] = []
        elif line and current_commit and not line.startswith('.claude/'):
            commits[current_commit].append(line)

    # Count co-changes
    co_changes = {}
    for files in commits.values():
        if len(files) > 1 and len(files) <= 10:  # Skip single-file and huge commits
            for i, f1 in enumerate(files):
                for f2 in files[i+1:]:
                    pair = tuple(sorted([f1, f2]))
                    co_changes[pair] = co_changes.get(pair, 0) + 1

    # Filter by minimum support
    pairs = []
    for (f1, f2), count in sorted(co_changes.items(), key=lambda x: -x[1]):
        if count >= min_support:
            pairs.append(CouplingPair(
                file_a=f1,
                file_b=f2,
                co_change_count=count,
                confidence=count / max(len(commits), 1)
            ))

    return pairs[:10]  # Top 10 coupling pairs

def get_commit_breakdown(days: int = 14) -> Dict[str, int]:
    """Get commit type distribution"""
    project_dir = get_project_dir()
    since_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    result = subprocess.run(
        ['git', 'log', f'--since={since_date}', '--oneline'],
        capture_output=True, text=True, cwd=project_dir
    )

    types = {'feat': 0, 'fix': 0, 'refactor': 0, 'docs': 0, 'test': 0, 'chore': 0, 'other': 0}
    for line in result.stdout.strip().split('\n'):
        if line:
            # Extract type from conventional commit
            parts = line.split(' ', 1)
            if len(parts) > 1:
                msg = parts[1]
                matched = False
                for t in ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'build', 'ci']:
                    if msg.startswith(f'{t}(') or msg.startswith(f'{t}:'):
                        if t in types:
                            types[t] += 1
                        else:
                            types['other'] += 1
                        matched = True
                        break
                if not matched:
                    types['other'] += 1

    return types

def get_fix_ratio(days: int = 14) -> float:
    """Calculate fix / (fix + feat) ratio"""
    breakdown = get_commit_breakdown(days)
    total = breakdown.get('fix', 0) + breakdown.get('feat', 0)
    if total == 0:
        return 0.0
    return breakdown.get('fix', 0) / total

def generate_recommendations() -> List[Recommendation]:
    """Generate actionable recommendations based on analytics"""
    recommendations = []

    # High churn recommendations
    churn_files = get_file_churn()
    for fc in churn_files[:3]:
        if fc.edit_count >= 10:
            accel = "accelerating" if fc.recent_7d > fc.edit_count * 0.5 else "stable"
            recommendations.append(Recommendation(
                type="high_churn",
                target=fc.path,
                reason=f"{fc.edit_count} edits with {int(fc.recent_7d/fc.edit_count*100)}% in last week - {accel} churn",
                suggested_action="Consider: Extract into smaller modules or address root cause",
                data={"edit_count": fc.edit_count, "recent_7d": fc.recent_7d}
            ))

    # Coupling recommendations
    coupling = detect_coupling()
    for cp in coupling[:2]:
        if cp.co_change_count >= 5:
            recommendations.append(Recommendation(
                type="coupling",
                target=f"{cp.file_a} ↔ {cp.file_b}",
                reason=f"{cp.co_change_count} co-changes ({int(cp.confidence*100)}% coupling rate)",
                suggested_action="Consider: Review if shared logic should be extracted",
                data={"co_changes": cp.co_change_count, "confidence": cp.confidence}
            ))

    # Firefighting detection
    fix_ratio = get_fix_ratio()
    if fix_ratio > 0.6:
        recommendations.append(Recommendation(
            type="firefighting",
            target="codebase",
            reason=f"{int(fix_ratio*100)}% fix ratio suggests reactive work",
            suggested_action="Consider: Allocate time for proactive refactoring",
            data={"fix_ratio": fix_ratio}
        ))

    return recommendations

def compute_all_analytics() -> Dict:
    """Compute all analytics data"""
    return {
        'file_churn': [asdict(fc) for fc in get_file_churn()],
        'coupling_pairs': [asdict(cp) for cp in detect_coupling()],
        'commit_breakdown': get_commit_breakdown(),
        'fix_ratio': get_fix_ratio(),
        'recommendations': [asdict(r) for r in generate_recommendations()]
    }

def get_cached_or_compute() -> Dict:
    """Get analytics from cache or compute fresh"""
    cache = load_cache()
    current_head = get_git_head()

    if cache and cache.get('head_sha') == current_head:
        return cache['data']

    # Cache miss - recompute
    data = compute_all_analytics()
    save_cache(head_sha=current_head, data=data)
    return data

# CLI interface for testing
if __name__ == '__main__':
    import sys
    data = get_cached_or_compute()

    print("📊 Code Analytics")
    print("=" * 50)

    print("\nCOMMIT BREAKDOWN (14 days):")
    for t, c in data['commit_breakdown'].items():
        if c > 0:
            print(f"   {t}: {c}")

    print(f"\nFIX RATIO: {int(data['fix_ratio']*100)}%")

    print("\nTOP CHURN FILES:")
    for fc in data['file_churn'][:5]:
        print(f"   {fc['path']} - {fc['edit_count']} edits")

    print("\nCOUPLING DETECTED:")
    for cp in data['coupling_pairs'][:3]:
        print(f"   {cp['file_a']} ↔ {cp['file_b']} ({cp['co_change_count']} co-changes)")

    print("\nRECOMMENDATIONS:")
    for r in data['recommendations']:
        print(f"   [{r['type'].upper()}] {r['target']}")
        print(f"      {r['reason']}")
        print(f"      → {r['suggested_action']}")
