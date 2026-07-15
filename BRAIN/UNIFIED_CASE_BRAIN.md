# Unified Case Brain

## Purpose
One operating brain for case memory, timeline, threat intelligence, decisions, and execution. AKOS is the thinking layer. Supermemory is the large-memory adapter. ECHO is the movement and quality layer.

## Double-helix roles
- **AKOS / Brain spiral:** remembers, links, compares, sequences, and recommends.
- **ECHO / Brawn spiral:** retrieves the right material, assembles work products, checks them, and stages them for human approval.
- **Source-of-Truth Mesh:** gives each item one identity and many linked views.

## Four operating chambers
1. **Case Timeline Brain** — custody-restoration milestones, filing deadlines, service status, motion sequence, and phase gates.
2. **Threat Intelligence Hub** — observed events, source links, pattern signals, escalation indicators, and response history. A signal is not a finding until reviewed.
3. **Autonomous Decision Engine** — recommends next actions from current events, deadlines, case stage, and risk. It does not file, serve, contact a court, or make legal conclusions autonomously.
4. **Unified Orchestrator** — routes an event through memory, timeline, threat, decision, and ECHO execution, then records the result.

## Event loop
`ingest -> identify -> tag -> link -> retrieve -> reason -> recommend -> human gate -> execute -> verify -> publish views -> record provenance`

## Memory-first rule
Search the mesh before creating a new memory. Reuse an existing resource ID when the source is the same. Create a new version when the source changes. Never replace an original with a derivative.

## Status language
Use only: `verified`, `reported`, `inferred`, `stale`, `blocked`, or `pending human review`. Connector claims, file counts, deadlines, legal theories, and “live” status require a source pointer and current check.

## Hard gates
- JEFS filings: manual user review and approval.
- Service, court contact, evidence release, and external legal action: manual approval.
- Threat labels: evidence-linked and non-conclusory.
- High-impact recommendations: show inputs, uncertainty, and the reason for the recommendation.

## Source order
1. Original court or evidence source.
2. Canonical storage pointer in the Source-of-Truth Mesh.
3. Hash/version/provenance record.
4. Working index or derivative.
5. Narrative summary.

## Integration contract
- Supermemory adapter: large tagged memory and semantic retrieval; credentials remain outside Git.
- AKOS: canonical IDs, links, timeline, threat, decision, and audit state.
- ECHO: execution plan, quality checks, packaging, and staged outputs.
- Aspen Grove: pointer routing only; it does not silently become the source of truth.

See `BRAIN/MEMORY_INGESTION_PROTOCOL.md`, `BRAIN/CASE_EVENT_SCHEMA.json`, `BRAIN/THREAT_SIGNAL_SCHEMA.json`, `BRAIN/DECISION_ENGINE.md`, and `BRAWN/ECHO_ORCHESTRATOR.md`.