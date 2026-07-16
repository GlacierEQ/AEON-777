# Supermemory Ingestion Register

## Case brain

`1FDV-23-0001009`

## Purpose

This register connects the case-brain source mesh to Supermemory without replacing the originals. AKOS owns identity, provenance, classification, relationships, and freshness. Supermemory provides long-memory and semantic retrieval. ECHO consumes resolved pointers and stages checked outputs.

## Prepared source set

The staging inventory found 98 unique source records across 129 source paths in workspace, organization knowledge, and agent case materials. Duplicate locations remain linked by SHA-256 identity rather than being treated as separate evidence.

Prepared memory views:

- 1 source registry
- 14 high-value individual source records
- 44 category bundles
- 59 total payloads

Memory lanes:

- `case`: case context, briefings, custody, communications, and strategy
- `filings`: motions, notices, JEFS instructions, court materials, and filing packages
- `evidence`: exhibit, video, audio, transcript, and federal complaint material
- `operations`: manifests, connector plans, Aspen Grove, MESH, and execution workflows
- `source_records`: material that is not safely classifiable by filename and must remain lightly labeled

## Stable identity

Every staged view carries:

- case ID
- category/domain
- original source path or paths
- SHA-256 source identity
- representation type
- sensitivity and status
- stable `customId`

The original files remain the source of truth. Memory views are replaceable retrieval layers. No filename, legal conclusion, allegation, or system-status claim becomes verified solely by indexing.

## Runtime status at register creation

- Supermemory connection: authenticated and read-verified.
- Existing case container: reachable; existing case-brain material already present.
- AKOS–ECHO bridge: indexed and complete.
- New 59-payload source batch: prepared in the workspace staging layer, but not accepted because the account returned `402 Text tokens limit reached` before the batch could be queued.

## Resume order

1. Restore Supermemory text credits.
2. Submit `00_registry.json`.
3. Submit the 14 individual payloads.
4. Submit category bundles in numeric order.
5. Poll each returned document until `done`.
6. Record accepted, failed, and stale items by `customId`.
7. Run a read-only retrieval check by case ID and lane.
8. Update this register; do not claim full synchronization until the check passes.

## Human gates

AKOS may preserve, classify, link, summarize, detect conflicts, and recommend. ECHO may resolve pointers, assemble, check, and stage. JEFS filing, service, court contact, evidence release, and irreversible escalation remain human-review actions.