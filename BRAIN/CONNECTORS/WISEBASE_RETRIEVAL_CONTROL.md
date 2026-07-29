# Wisebase Retrieval Control Plane

Status: **operative**  
Effective: **2026-07-29**  
Preservation amendment: **2026-07-29**

## Authority

Wisebase is a governed retrieval plane. It discovers candidate evidence and relationships across uploaded material, but it does not independently establish canonical truth, current runtime state, source authenticity, duplicate identity, project identity, or legal conclusions.

The operator-designated canonical conversation controls durable Memory Canon doctrine and supersession lineage. Native source artifacts control claim-relative facts. GitHub controls schemas, validators, and implementation history. Notion and task systems are governance projections and receipt indexes.

## Legacy raw preservation doctrine

Legacy material is not garbage, contamination to be erased, or obsolete text to be sanitized. It is raw in-the-moment historical capture. Notes, chats, drafts, exports, symbolic language, anger, uncertainty, hypotheses, allegations, partial theories, model output, and evolving strategy preserve what was known, felt, believed, feared, attempted, or misunderstood at a particular moment.

The system therefore separates two independent decisions:

1. **Source-retention decision:** preserve the original artifact, its language, timestamp, provenance, derivation, and moment context.
2. **Claim-promotion decision:** decide whether a specific proposition from that artifact may be used as current canonical fact, allegation, inference, hypothesis, unresolved issue, superseded view, or restricted material.

A failed promotion gate never authorizes deletion, rewriting, sanitization, loss of historical voice, or destruction of longitudinal research value. Quarantine means controlled access and blocked automatic promotion—not disposal.

Legacy sources should remain retrievable within their authorized sensitivity scope. Sensitive material may require a restricted access envelope, but restriction protects the artifact rather than removing it.

## Required behavior

1. **Preserve first.** Every source artifact defaults to `preserve_raw`; no quarantine, contradiction, supersession, or failed promotion result may delete or rewrite it.
2. **Exact anchors first.** Queries use exact case IDs, docket numbers, dates, document classes, repository names, pull-request numbers, workflow IDs, commit SHAs, provider object IDs, or named source files whenever those identifiers exist.
3. **Candidate evidence only.** Relevance ranking, repetition, generated summaries, and semantic similarity never promote a proposition by themselves.
4. **Source-linked promotion.** Every promoted proposition carries a source pointer, truth class, sensitivity class, current-or-historical status, verification timestamp, contradiction state, and promotion decision.
5. **Restricted material fails closed for exposure and promotion, not retention.** Credentials, protected-minor details, medical details, private communications, unsupported accusations, synthetic anchors, and unqualified legal conclusions remain preserved but outside general canon and broad exposure.
6. **Mutable state requires a current-run receipt.** Deployment, validation, deletion, activation, connector health, and runtime claims require a current provider response, commit, workflow result, immutable record, task mutation, or equivalent execution receipt.
7. **Project identities remain separate.** Megamind, Mastermind, AEON-777, CASEBRAIN, Echoes, and distinct legal matters cannot be merged by naming similarity or semantic proximity.
8. **Similarity is not duplication.** Equal titles, similar content, matching byte counts, or shared paths create duplicate candidates only. Consolidation requires exact-byte hash equality and provenance review, and originals remain preserved unless a separately authorized lifecycle process says otherwise.
9. **Contaminated documents are not validated wholesale.** Reliable source-linked fragments may be promoted while unsupported passages remain qualified; the complete original source remains preserved.
10. **Supersession is append-only.** Later corrections are overlays linked to earlier material. They do not overwrite the prior artifact or erase the historical development of understanding.
11. **Partial retrieval failure does not abort the lane.** Record the failed slice, mark dependent state stale or unverified, continue unaffected exact-source probes, and return the exact limitation.

## Canonical routing domains

- `canonical_truth` — durable doctrine, explicit operator decisions, and supersession lineage.
- `active_case_facts` — source-locked docket entries, orders, NEFs, service records, and verified chronology.
- `actor_event_threads` — qualified people, roles, statements, events, conflicts, and source pointers.
- `machine_pistons` — connectors, tools, repositories, workflows, capabilities, receipts, and current runtime state.
- `legacy_raw_corpus` — unaltered in-the-moment notes, chats, drafts, exports, symbolic language, hypotheses, evolving strategy, and historical model output.
- `restricted_preserved_material` — preserved credentials, protected content, private communications, medical details, and other sensitive artifacts accessible only within authorized scope.

## Precision query profiles

### Legal records

```text
case ID + exact docket numbers + exact date/time + document class
```

Example:

```text
1FDV-23-0001009 Dkt 191 193 199 201 NEF timestamps
```

### Repository state

```text
exact repository + PR/issue/workflow/commit/path + requested state
```

Example:

```text
GlacierEQ/AEON-777 PR 60 merge commit hosted workflow receipt
```

### Architecture

Do not use one broad `memory architecture` query. Split it into source hierarchy, truth taxonomy, sensitivity controls, legacy preservation, current runtime receipt, named project identity, and exact connector capability.

### Historical evolution

Use the source family, date range, project or case identity, and the type of evolution being studied.

```text
source family + date range + project identity + claim/strategy/language evolution
```

This profile is specifically allowed to retrieve contradictory, emotional, symbolic, incomplete, or superseded material because the target is longitudinal understanding rather than current factual promotion.

## Promotion and preservation envelope

```yaml
candidate_id:
query:
query_profile:
exact_anchor_count:
source_name:
source_pointer:
raw_preservation_pointer:
source_retention_decision: preserve_raw
legacy_source:
captured_at:
moment_context_status:
truth_class:
sensitivity:
proposition:
evidence_excerpt_pointer:
current_or_historical:
mutable_state:
current_run_receipt:
last_verified_at:
contradictions:
promotion_decision:
supersession_pointer:
rewrite_source: false
deletion_requested: false
duplicate_action:
exact_hash_verified:
project_identity_action:
source_proven_relationship:
remaining_gate:
```

## Current observed corpus characteristics

Two bounded 2026-07-29 retrieval tests returned useful source material and demonstrated the importance of layered interpretation:

- Architecture query: 100 passages, approximately 62.7% average relevance.
- Exact docket query for Dkts. 191, 193, 199, and 201: 109 passages, approximately 62.9% average relevance.

Exact docket anchors materially improved source concentration. Legacy exports, allegation-heavy documents, symbolic/cosmic narrative, and credential-bearing material also entered result sets. Those results are not disposable noise: they are preserved historical source families. They require claim classification, sensitivity controls, moment context, and source-level promotion gates before current factual use.

## Connector capability boundary

The current Wisebase connector supports file browsing, semantic retrieval, upload interaction, translations, and creation or listing of learning and knowledge-graph assets. It does not expose source-file rename, tag, delete, collection-membership, metadata-edit, or corpus-exclusion operations.

No source was deleted, relabeled, sanitized, or physically excluded. The system preserves legacy artifacts and controls only their exposure, interpretation, and claim-promotion state.

## Completion standard

A Wisebase retrieval is compliant only when it returns the smallest useful source set for the stated purpose, preserves original artifacts and historical voice, retains exact provenance and moment context, labels claim truth and sensitivity, identifies contradictions and supersession, prevents unsupported cross-project merging, and names the exact native-source verification gate for any proposition promoted into current canon.