# AEON-777 Connectors

This directory contains integration connectors for AEON-777's external systems.

## pro_comet_notion_sync.py

**Purpose:** Sync GitHub activity from AEON-777 into Notion and write Supermemory recon snapshots back.

**Setup:**
```bash
export NOTION_TOKEN="secret_xxx"
export NOTION_DB_ID="your-db-id"
export SUPERMEMORY_API_KEY="sm_xxx"
python connectors/pro_comet_notion_sync.py
```

**Classification Lanes (Notion):**
- `CRITICAL` — filing blockers, court evidence issues
- `UPGRADE` — powerup, CI, dependency upgrades
- `REFACTOR` — cleanup, normalization
- `RESEARCH` — investigation sweeps
- `WAITING_HUMAN` — approval-gated items

**Integration with Pro-comet-agent:**
Call `run_sync(issues, kpis)` from the Pro-comet-agent scheduler.
The connector will push classified rows to Notion and update `SUPERMEMORY_RECON.json`.

**Closes:** Issue #36 (partial — Notion DB ID + token required to activate)
