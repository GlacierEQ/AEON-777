# Evidence Intake Gate

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Purpose

This gate is the hard boundary between a discovery signal and a promotable evidence item. It stores no source bytes and does not make factual or legal assertions. Original bytes remain in approved source/file/cloud roots; GitHub owns this schema/validator contract; Supabase may hold restricted audited gate receipts only.

## Promotion flow

`SOURCE BYTE → SOURCE POINTER → SHA-256 → ACQUISITION/CUSTODIAN → ORIGINAL/DERIVED → DUPLICATE/CONTROLLING COPY → SENSITIVITY → CHAIN OF CUSTODY → VERIFIED RECORD → HUMAN REVIEW → PROVENANCE RECEIPT → EVIDENCE ITEM`

A filename, title, search result, index row, OCR result, summary, memory, task, or Notion page is never enough to cross the gate.

## States

- `discovery_only`: accepted as a lead with exact machine-computed blockers; not evidence.
- `quarantined`: preserved but barred from promotion until a defect is resolved.
- `promotion_ready`: mechanical evidence requirements pass; human review is the only permitted remaining blocker.
- `verified_evidence`: all mechanical requirements pass, human review is approved, blocker list is empty, and a provenance receipt is required.

`filing_ready_assertion` is deliberately not promotable through this gate. Filing readiness requires a separate current-evidence-and-authority gate.

## Fail-closed requirements for verified evidence

A record cannot become `verified_evidence` unless all of the following are present and consistent:

1. Approved source root and stable source pointer.
2. Original filename and source version.
3. SHA-256 of the exact bytes, byte count, and MIME type.
4. Acquisition time, custodian, and acquisition method.
5. Original-vs-derived classification; derivatives link to their parent.
6. Duplicate state resolved; exact duplicates identify a duplicate group and controlling copy.
7. Sensitivity classified.
8. Chain of custody is `preserved` or explicitly `not_required`.
9. Truth partition is `verified_record`.
10. Exact bytes are preserved when they are accessible.
11. Restricted, privileged, minor-sensitive, medical, school, psychological, or sealed material is `no_projection` or `pointer_only`.
12. Human review is approved with reviewer and timestamp.
13. Promotion blocker receipt is empty and provenance receipt generation is required.

## Blocker integrity

The semantic validator independently computes the blocker set and requires `promotion.blockers` to match it exactly. A caller cannot omit a known defect and still pass the gate.

## Privacy boundary

No source bytes, credentials, protected-minor details, medical/school/psychological content, precise addresses, privileged narratives, or allegation-bearing narratives belong in generalized projection surfaces. Restricted items use pointer-only or no-projection policies.

## Duplicate doctrine

- `unique`: no exact-byte duplicate found in the bounded comparison set.
- `exact_duplicate`: SHA-256 equality; duplicate group and controlling-copy disposition are mandatory.
- `version_related`: similar lineage but byte hashes differ; do not collapse automatically.
- `unknown`: promotion-blocking.

## Integration

The validator is part of the `BRAIN/CONNECTORS` test suite. Downstream evidence ingestion must pass this gate before creating a provenance receipt or a canonical evidence item. Existing legacy indexes remain discovery-only until re-ingested through this contract.
