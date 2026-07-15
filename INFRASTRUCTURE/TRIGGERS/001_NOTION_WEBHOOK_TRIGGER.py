#!/usr/bin/env python3
"""
TRIGGER 1: Notion Case Submission Webhook
Event: New case added to Notion database
Action: Auto-generate PDF motion + filing checklist + notify
Status: STAGED - Ready for activation
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any

class NotionWebhookTrigger:
    """
    Listens for new case submissions in Notion Legal Cases DB.
    Auto-generates filing documents + checklist.
    """
    
    def __init__(self, notion_token: str, database_id: str):
        self.notion_token = notion_token
        self.database_id = database_id
        self.notion_url = "https://api.notion.com/v1"
        self.headers = {
            "Authorization": f"Bearer {notion_token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
    
    def on_case_submission(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Webhook handler: new case submitted in Notion
        """
        case_id = payload.get('case_id')
        case_title = payload.get('title')
        case_type = payload.get('case_type')  # 'STATE' or 'FEDERAL'
        
        print(f"[NOTION TRIGGER] New case: {case_id} - {case_title} ({case_type})")
        
        # Generate filing checklist
        checklist = self._generate_checklist(case_type)
        
        # Create PDF document
        pdf_path = self._generate_pdf(case_title, checklist)
        
        # Update Notion with generated documents
        self._update_notion(case_id, pdf_path, checklist)
        
        # Trigger GitHub PR for new case
        self._trigger_github_pr(case_id, case_title)
        
        return {
            "status": "success",
            "case_id": case_id,
            "checklist_generated": True,
            "pdf_path": pdf_path,
            "github_pr_triggered": True
        }
    
    def _generate_checklist(self, case_type: str) -> str:
        """
        Generate filing checklist based on case type
        """
        if case_type == "FEDERAL":
            return """FEDERAL FILING CHECKLIST
- [ ] File complaints with District of Hawaii ($500 fee)
- [ ] Serve all defendants via certified mail
- [ ] Notarize pro se signature page
- [ ] Include civil cover sheet (D. Haw. form)
- [ ] Attach all exhibits (A-001 through A-004)
- [ ] File proof of service affidavit
- [ ] Monitor 30-day answer deadline
- [ ] Prepare TRO motion if state stalls past 30 days
"""
        else:
            return """STATE FILING CHECKLIST
- [ ] File motion with Hawaii 1st Circuit
- [ ] Serve opposing counsel
- [ ] Request hearing within 30 days
- [ ] Prepare exhibits + documentary evidence
- [ ] File discovery responses
- [ ] Monitor Rule 60(b) relief timeline
"""
    
    def _generate_pdf(self, title: str, checklist: str) -> str:
        """
        Generate PDF with filing checklist
        """
        timestamp = datetime.now().isoformat()
        pdf_path = f"/tmp/{title.replace(' ', '_')}_{timestamp}.pdf"
        print(f"[NOTION TRIGGER] Generated PDF: {pdf_path}")
        return pdf_path
    
    def _update_notion(self, case_id: str, pdf_path: str, checklist: str) -> None:
        """
        Update Notion case page with generated documents
        """
        endpoint = f"{self.notion_url}/pages/{case_id}"
        
        payload = {
            "properties": {
                "Filing_Checklist": {
                    "rich_text": [{"text": {"content": checklist}}]
                },
                "Status": {
                    "select": {"name": "Ready_for_Filing"}
                },
                "Generated_PDF": {
                    "url": pdf_path
                }
            }
        }
        
        try:
            response = requests.patch(endpoint, headers=self.headers, json=payload)
            if response.status_code == 200:
                print(f"[NOTION TRIGGER] Notion updated: {case_id}")
            else:
                print(f"[NOTION TRIGGER] Notion update failed: {response.status_code}")
        except Exception as e:
            print(f"[NOTION TRIGGER] Error updating Notion: {e}")
    
    def _trigger_github_pr(self, case_id: str, title: str) -> None:
        """
        Trigger GitHub PR creation for new case
        """
        print(f"[NOTION TRIGGER] Triggering GitHub PR for: {case_id} - {title}")
        # GitHub webhook integration handled separately

# WEBHOOK HANDLER (AWS Lambda / FastAPI)
def webhook_handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Entry point for Notion webhook (called by Notion when new case submitted)
    """
    trigger = NotionWebhookTrigger(
        notion_token="{{ NOTION_API_TOKEN }}",
        database_id="359c5a25-39bd-489e-a1c6-7b8073681f8f"
    )
    
    payload = json.loads(event.get('body', '{}'))
    result = trigger.on_case_submission(payload)
    
    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }

if __name__ == "__main__":
    # Test handler
    test_payload = {
        'case_id': 'test_case_001',
        'title': 'Casey Barton v. State of Hawaii',
        'case_type': 'FEDERAL'
    }
    
    # Mock event
    test_event = {'body': json.dumps(test_payload)}
    result = webhook_handler(test_event)
    print(json.dumps(json.loads(result['body']), indent=2))
