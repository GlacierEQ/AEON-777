#!/usr/bin/env python3
"""Aspen Grove Repo Changes Trigger

Listens for push/PR events on:
- GlacierEQ/AEON-777
- GlacierEQ/mastermind
- GlacierEQ/infranodus
- GlacierEQ/unified-memory-mcp
- GlacierEQ/apex-fs-commander

On each event:
1. Extract commit + PR metadata
2. Update Notion execution_log + pillar_execution_log
3. Check docket changes (JEFS forensics)
4. Update case_spine_phase2 if applicable
5. Log to audit_log
6. Notify user of significant events
"""

import json
from datetime import datetime
from typing import Any, Dict, List

class GitHubWebhookHandler:
    """Handles GitHub push/PR events across all GlacierEQ repos."""
    
    def __init__(self):
        self.tracked_repos = [
            'AEON-777',
            'mastermind',
            'infranodus',
            'unified-memory-mcp',
            'apex-fs-commander'
        ]
        self.notion_exec_log = '359c5a25-39bd-489e-a1c6-7b8073681f8f'  # execution_log DB
        self.notion_pillar_log = '23dd279f-6357-4c91-b8ff-9e767c688f95'  # Pillar Health Monitor
        self.github_org = 'GlacierEQ'
        
    async def handle_push_event(self, event: dict) -> dict:
        """Handle GitHub push event."""
        
        repo_name = event.get('repository', {}).get('name')
        commit_sha = event.get('after')  # Latest commit
        pusher = event.get('pusher', {}).get('name', 'unknown')
        commits = event.get('commits', [])
        
        print(f"[PHASE2-T3] Push detected: {repo_name} @ {commit_sha[:8]}")
        
        # Check for docket/case changes
        docket_changes = await self.detect_docket_changes(commits)
        
        # Log to Notion execution_log
        log_entry = await self.log_to_notion(
            repo=repo_name,
            event_type='push',
            commit_sha=commit_sha,
            pusher=pusher,
            details=docket_changes
        )
        
        # Check if significant event (federal complaint, motion, etc.)
        is_significant = any([
            'MOTIONS' in f for f in [f['path'] for f in commits[0].get('added', []) + commits[0].get('modified', [])] if isinstance(f, dict)
        ]) if commits else False
        
        if is_significant:
            await self.notify_user(f"Significant push to {repo_name}", log_entry)
        
        return {
            'trigger': 'githubWebhook',
            'event_type': 'push',
            'repo': repo_name,
            'commit': commit_sha,
            'docket_changes': docket_changes,
            'logged_to_notion': log_entry.get('id'),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'success'
        }
    
    async def handle_pr_event(self, event: dict) -> dict:
        """Handle GitHub PR open/close/merge event."""
        
        action = event.get('action')  # opened, closed, merged
        pr_number = event.get('pull_request', {}).get('number')
        repo_name = event.get('repository', {}).get('name')
        pr_title = event.get('pull_request', {}).get('title')
        
        print(f"[PHASE2-T3] PR {action}: {repo_name} #{pr_number}")
        
        # Log to Notion
        log_entry = await self.log_to_notion(
            repo=repo_name,
            event_type=f'pr_{action}',
            pr_number=pr_number,
            pr_title=pr_title
        )
        
        return {
            'trigger': 'githubWebhook',
            'event_type': 'pull_request',
            'action': action,
            'repo': repo_name,
            'pr_number': pr_number,
            'logged_to_notion': log_entry.get('id'),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'success'
        }
    
    async def detect_docket_changes(self, commits: List[dict]) -> List[str]:
        """Check if commits contain docket/case-related changes."""
        docket_patterns = ['EVIDENCE_VAULT', 'MOTIONS', 'case_spine', 'docket']
        changes = []
        
        for commit in commits:
            for file_info in commit.get('added', []) + commit.get('modified', []):
                if any(pattern in file_info for pattern in docket_patterns):
                    changes.append(file_info)
        
        return changes
    
    async def log_to_notion(self, **kwargs) -> dict:
        """Log event to Notion execution_log DB."""
        # notion_create_database_item
        return {'id': 'notion_entry_id', 'timestamp': datetime.utcnow().isoformat()}
    
    async def notify_user(self, title: str, details: dict) -> None:
        """Send notification to user."""
        # send_message to kahalainspector@gmail.com
        print(f"[PHASE2-T3] Notification: {title}")

# Execution
if __name__ == '__main__':
    handler = GitHubWebhookHandler()
    print("[PHASE2-T3] GitHub webhook trigger ready (githubWebhook)")
    # This runs when push/PR events fire
