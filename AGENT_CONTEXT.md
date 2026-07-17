# AGENT_CONTEXT.md
## GlacierEQ Master Stack — AI Context Injection Document
### Case: 1FDV-23-0001009 | System: CASEBRAIN V3 | Updated: 2026-07-16

> Paste this document at the start of any AI session to grant full stack awareness.
> The AI outputs tool calls as JSON. A human executor or orchestrator runs them and pastes results back.

---

## TOOL CALL PROTOCOL

When you need to use a tool, output a JSON block in this format:
```json
{
  "tool": "tool_name",
  "params": { "param1": "value1", "param2": "value2" }
}
```
The executor will run it and return results. Wait for results before proceeding.

---

## IDENTITY & CASE CONTEXT

- **GitHub Account**: GlacierEQ
- **Primary Repo**: GlacierEQ/AEON-777 (main branch)
- **Secondary Repo**: GlacierEQ/SUPERLUMINAL_CASE_MATRIX (main branch)
- **Case Number**: 1FDV-23-0001009
- **Court**: Hawaii Family Court, First Circuit
- **Governance**: CASEBRAIN V3
- **Memory System**: Supermemory (CaseBrain) — semantic recall of all case facts

### Actor Nodes
| Node | Identity |
|------|----------|
| shaw | Judge — primary judicial actor |
| naso | Judge — secondary judicial actor |
| brower | Guardian ad Litem / attorney |
| yamatani | DHS/CWS actor |
| hpd | Honolulu Police Department |
| csea | Child Support Enforcement Agency |
| shared | Cross-actor evidence |
| other | Miscellaneous actors |

---

## TOOL SET 1 — GITHUB MCP (github_mcp_direct)

Auth: GlacierEQ token (pre-configured on executor)

### File Operations
```
get_file_contents(owner, repo, path, ref?)
  → Read any file or list directory contents

create_or_update_file(owner, repo, path, content, message, branch, sha?)
  → Create new file or update existing (sha required for updates)

push_files(owner, repo, branch, files[], message)
  → Push multiple files in a single commit
  → files: [{ path: "...", content: "..." }]

delete_file(owner, repo, path, message, branch)
  → Delete a file
```

### Repository
```
search_repositories(query)
get_file_contents(owner, repo, path="/")  → list root directory
list_branches(owner, repo)
list_commits(owner, repo, sha?, since?, until?, author?, path?)
get_commit(owner, repo, sha, detail?)
list_tags(owner, repo)
get_tag(owner, repo, tag)
create_repository(name, description?, private?, autoInit?)
fork_repository(owner, repo, organization?)
list_repository_collaborators(owner, repo)
```

### Branches & PRs
```
create_branch(owner, repo, branch, from_branch?)
create_pull_request(owner, repo, title, head, base, body?, reviewers?)
update_pull_request(owner, repo, pullNumber, title?, body?, state?, base?)
merge_pull_request(owner, repo, pullNumber, merge_method?, commit_title?)
update_pull_request_branch(owner, repo, pullNumber)
list_pull_requests(owner, repo, state?, base?, head?)
search_pull_requests(query)
pull_request_read(method, owner, repo, pullNumber)
  → methods: get | get_diff | get_status | get_files | get_commits |
             get_review_comments | get_reviews | get_comments | get_check_runs
```

### Issues
```
list_issues(owner, repo, state?, labels?, since?)
issue_read(method, owner, repo, issue_number)
  → methods: get | get_comments | get_sub_issues | get_parent | get_labels
issue_write(method, owner, repo, title?, body?, assignees?, labels?, state?)
  → methods: create | update
search_issues(query)
add_issue_comment(owner, repo, issue_number, body?, reaction?)
sub_issue_write(method, owner, repo, issue_number, sub_issue_id)
  → methods: add | remove | reprioritize
list_issue_fields(owner, repo?)
list_issue_types(owner, repo?)
```

### Reviews & Comments
```
pull_request_review_write(method, owner, repo, pullNumber, body?, event?, commitID?, threadId?)
  → methods: create | submit_pending | delete_pending | resolve_thread | unresolve_thread
add_comment_to_pending_review(owner, repo, pullNumber, path, body, subjectType, line?, side?)
add_reply_to_pull_request_comment(owner, repo, commentId, pullNumber, body?, reaction?)
request_copilot_review(owner, repo, pullNumber)
```

### Search & Discovery
```
search_code(query)           → search code across repos
search_commits(query)        → search commit messages
search_issues(query)         → search issues
search_pull_requests(query)  → search PRs
search_repositories(query)   → find repos
search_users(query)          → find GitHub users
get_me()                     → authenticated user info
```

### Releases & Labels
```
list_releases(owner, repo)
get_latest_release(owner, repo)
get_release_by_tag(owner, repo, tag)
get_label(owner, repo, name)
```

### Security
```
run_secret_scanning(files, owner, repo)
  → Scan file content strings for exposed secrets/tokens
```

---

## TOOL SET 2 — CASEBRAIN MEMORY (casebrain_01bbe6af8ae3410ca6cf164766bdc2d4)

### Core Memory Operations
```
recall(query, containerTag?)
  → Semantic search across all stored memories
  → Returns relevant facts + user profile summary
  → USE THIS FIRST at start of every session

memory(action, content, containerTag?)
  → action: "save" | "forget"
  → save: store new case facts, session state, decisions
  → forget: remove outdated or noisy memories

listMemories(page, limit, containerTag)
  → Enumerate all stored memory documents
  → Use for audit; use recall() for topic search

whoAmI()
  → Get current logged-in user info

listProjects()
  → List available memory project containers
  → Available: sm_project_default

memory_graph(containerTag)
  → Visualize memory graph (returns interactive HTML)

fetch_graph_data(containerTag, page, limit)
  → Raw graph data for visualization
```

### Memory Governance Rules (CASEBRAIN V3)
- Always `recall()` before writing new memories to avoid duplication
- Containerize case memories under `sm_project_default`
- Memory entries must be atomic — one fact per save
- Never save procedural logs or empty status updates
- Critical forensic docs must be re-ingested if extraction failed

---

## KEY REPO STRUCTURE — AEON-777

```
AEON-777/
├── 1FDV-23-0001009/          Case filings by date
├── BRAIN/                    AI agent configs & directives
├── BRAWN/                    Execution scripts & automation
├── EVIDENCE_VAULT/           Raw evidence files
├── BAR_COMPLAINTS/           Bar complaint drafts
├── MOTIONS/                  Motion drafts
├── motions/                  Filed motions
├── FEDERAL_WARFARE_PHASE/    Federal complaint package
├── JUDICIAL_DELAY_TRACKER/   Delay documentation
├── EX_PARTE_COMMUNICATIONS/  Ex parte evidence
├── ORCHESTRATION/            n8n workflow configs
├── connectors/               MCP connector configs
├── forensic_tools/           Hash verification tools
├── logs/                     Session logs
└── AGENT_CONTEXT.md          ← YOU ARE HERE
```

### High-Value Files (Quick Access)
| File | Purpose |
|------|---------|
| `FEDERAL_COMPLAINT_BY_ACTOR.md` | Federal complaint organized by actor |
| `FEDERAL_COMPLAINT_MASTER_INDEX.md` | Master complaint index |
| `ATOMIC_TRUTH_LOCATIONS.txt` | Evidence location map |
| `LOCAL_EVIDENCE_MANIFEST.json` | Full evidence manifest |
| `CONTRADICTION_MATRIX_MASTER.md` | Actor contradiction log |
| `JUDICIAL_OSINT_EXHAUSTIVE_REPORT.md` | Judicial OSINT on Shaw/Naso |
| `EXECUTION_ARCHITECTURE.md` | System architecture overview |
| `MEM0_DIRECTIVES.json` | Memory governance directives |
| `AGENTS.md` | Agent role definitions |

---

## SESSION STARTUP PROTOCOL

Every new AI session should begin with:

1. `recall("case status current phase active motions")` — load current case state
2. `get_file_contents(owner="GlacierEQ", repo="AEON-777", path="EXECUTION_ARCHITECTURE.md")` — load system map
3. Confirm actor nodes and active threats before proceeding

---

## CRITICAL RULES FOR ALL AGENTS

- **Never delete or overwrite files without explicit user confirmation**
- **Never write to main branch directly on sensitive case files** — use a branch + PR
- **Always recall() before memory() to prevent duplication**
- **Treat all case content as privileged legal material**
- **SHA is required for all file updates** — get it from `get_file_contents()` first
- **One tool call at a time** — wait for executor to return results before next call
- **If memory limit reached** — purge empty/noise docs before attempting new saves

---

*AGENT_CONTEXT.md — GlacierEQ/AEON-777 | CASEBRAIN V3 | 2026-07-16*
