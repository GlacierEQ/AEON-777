# Memory Ingestion Protocol

## Goal
Build larger, smarter, organized memory without flooding the brain with duplicates, unsupported claims, or stale copies.

## Before upload
1. Preserve the original in its canonical location.
2. Assign or recover a stable `resource_id`.
3. Capture source pointer, case, jurisdiction, date, version, and hash when available.
4. Classify: `court`, `filing`, `evidence`, `communication`, `timeline`, `threat`, `strategy`, `connector`, or `system`.
5. Mark access level and whether human review is required.

## Chunking
Chunk by meaning, not arbitrary length:
- court document: caption, procedural history, facts, ruling, order, exhibits;
- evidence: event, speaker/device, timestamp, chain-of-custody segment;
- email/message: one thread or event cluster;
- filing: issue, rule, factual support, requested relief, exhibit links.

Every chunk carries `resource_id`, `chunk_id`, `version`, `source_pointer`, `created_at`, `observed_at`, `tags`, and `confidence`.

## Tags
Use compact tags from these groups:
- case: `case:1FDV-23-0001009`
- layer: `state`, `federal`, `international`
- function: `timeline`, `threat`, `decision`, `filing`, `evidence`, `service`
- phase: `phase-1` through `phase-4` when supported
- status: `verified`, `reported`, `inferred`, `stale`, `blocked`, `review`
- sensitivity: `sealed`, `private`, `restricted`, `public`

## Deduplication
Search by stable ID, source pointer, filename plus hash, and semantic similarity. If the same source is found, update its version links; do not create a second identity. If the source differs, preserve both and link them as `supersedes`, `supports`, `contradicts`, or `derivative_of`.

## Memory lanes
- **Canonical lane:** identity, provenance, source pointer, version, hash.
- **Working lane:** summaries, extracted facts, tags, embeddings, open questions.
- **Decision lane:** recommendations, assumptions, deadlines, approvals, outcomes.
- **Execution lane:** ECHO packages, checks, staged outputs, and delivery records.

## Upload rule
A memory write is complete only when the source pointer and provenance record exist. A successful API response alone does not prove the case brain is current.

## Safety
Never upload credentials, webhook tokens, private keys, or unredacted secrets. Never treat an allegation, model output, or prior summary as a verified fact without its source.