# CASEBRAIN Shared Control Root — 1FDV-23-0001009

This directory is the canonical cross-actor control root for Case No. `1FDV-23-0001009`.

## Mission

Protect Kekoa, restore the parent-child relationship, preserve the evidence, and obtain lawful review of every restriction affecting him.

## Authority hierarchy

1. **GitHub / `GlacierEQ/AEON-777`** — source-controlled schemas, manifests, runbooks, connector contracts, indexes, and generated public work product.
2. **Notion** — control-plane UI, command dashboard, status, task routing, decisions, and links to canonical records.
3. **Google Drive** — structured legal documents, filed copies, court-ready packets, readable evidence indexes, and working legal artifacts.
4. **Dropbox** — raw forensic mirror, original files, large evidence collections, and recovery copies.
5. **Supabase** — audited operational ledger, connector registry, state, RLS, hashes, and reversible staging.
6. **ClickUp** — execution queue and human-review tasks.
7. **Supermemory / MemoryPlugin / Mem0** — summaries, pointers, relationship context, and retrieval acceleration; never the sole evidentiary source.

## Canonical rules

- All GitHub changes are branch-and-PR first. No direct writes to `main` for sensitive case material.
- `shared` is the default cross-actor orchestration container.
- Actor-specific records remain actor scoped; cross-actor events and connector state live here.
- GitHub stores no raw protected-minor medical, school, psychological, credential, or private evidence files.
- Every record must retain `case_id`, source pointer, verification status, claim class, hash when available, access class, and idempotency key.
- Cloud evidence is never flattened, renamed, moved, or deleted by default. FILEBOSS operates dry-run first and produces a manifest before any mutation.
- A failed theory closes only that theory. It does not erase the actor, source, event, or other open theories.
- No artifact is called complete until verification, packaging, durable storage, and registry logging are all proven.

## Active work product

- Artifact: `1FDV-23-0001009_OSINT_ACTOR_INVESTIGATION_WORKBENCH_BATCH01_CONTROLLED.xlsx`
- Version: `V-004`
- SHA-256: `bdabe5237c5ac6c80cc75b02c871888f6ac67349d3b3a6ff32816c631e4e8ee1`
- Size: `494567` bytes
- Closure stage: `10 / 13`
- State: `controlled_local_canonical`
- Cloud byte state: `blocked — Google Drive storageQuotaExceeded`
- Actual cloud file ID: `none`
- Contents: closure controller, artifact lineage, Drive operation ledger, actor registry, raw-lead intake, query plan, event registry, actor-event edges, relationship edges, theory matrix, source log, search-run log, and OSINT Batch 01 findings.

The authoritative file hash is stored in the detached control receipt and companion `.sha256` file. It is not embedded into the workbook because embedding a final hash would change the workbook bytes and invalidate that hash.

## Completion gate

The artifact is locally verified and packaged, but it is not yet durably stored or cloud-verified. The remaining sequence is:

1. Free Google Drive storage or select another approved writable connector.
2. Upload the exact V-004 workbook bytes.
3. Fetch and record cloud metadata.
4. Download the exact cloud file.
5. Calculate and compare SHA-256.
6. Update GitHub, Notion, and the workbook lineage with the cloud-native ID and verified hash.
7. Mark closure stages 11 through 13 complete.

## Files in this control root

- `CONNECTOR_ALIGNMENT.yaml` — canonical role, path, status, and write-policy map.
- `RESOURCE_REGISTRY.json` — machine-readable repository, Notion, Drive, Dropbox, artifact, closure, and blocker state.
- `SYNC_POLICY.md` — allowed flows, blocked flows, review gates, and conflict rules.
