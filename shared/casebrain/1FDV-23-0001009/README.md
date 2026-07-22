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

## Active work product

- Artifact: `1FDV-23-0001009_OSINT_ACTOR_INVESTIGATION_WORKBENCH_BATCH01.xlsx`
- SHA-256: `508c6666f148ab97977467171474fc232e0a11e6671056c7ea947947b40cac7d`
- Size: `482808` bytes
- Contents: actor registry, raw-lead intake, query plan, event registry, actor-event edges, relationship edges, theory matrix, source log, search-run log, and OSINT Batch 01 findings.

The binary workbook remains in the controlled artifact/evidence layer. This repository stores its identity, schema, provenance, routing, and synchronization contract.

## Files in this control root

- `CONNECTOR_ALIGNMENT.yaml` — canonical role, path, status, and write-policy map.
- `RESOURCE_REGISTRY.json` — machine-readable repository, Notion, Drive, Dropbox, and artifact pointers.
- `SYNC_POLICY.md` — allowed flows, blocked flows, review gates, and conflict rules.
