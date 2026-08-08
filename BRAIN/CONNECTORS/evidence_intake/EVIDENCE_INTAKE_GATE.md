# Evidence Intake Gate

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Authority and purpose

This gate is the hard metadata boundary between a discovery signal and a canonical evidence item. It builds on the existing `BRAIN/RESOURCE_POINTER_SCHEMA.json` for stable source identity and `BRAIN/CONNECTORS/PROVENANCE_RECEIPT_SCHEMA.json` for evidence-grade provenance. It does not store source bytes and does not upgrade allegations, summaries, or model output into facts.

Authority order remains:

`authenticated original/operative source → Resource Pointer → Evidence Intake Gate → Provenance Receipt → canonical Evidence Item → claim links/projections`

Original bytes remain in approved source/file/cloud roots. GitHub owns the schema/validator contract. Supabase may hold restricted audited state/receipts only. Notion, Mem, Supermemory, tasks, and analytics are projections rather than evidence authority.

## Promotion pipeline

`SOURCE BYTE → RESOURCE POINTER → SHA-256 → ACQUISITION/CUSTODIAN → ORIGINAL/DERIVED → DUPLICATE/CONTROLLING COPY → SENSITIVITY → CHAIN OF CUSTODY → CLAIM CLASS → VERIFIED RECORD → HUMAN REVIEW → PROVENANCE RECEIPT → EVIDENCE ITEM`

A filename, title, search hit, index row, OCR result, summary, memory, task, or Notion page remains a discovery signal until the gate passes.

## States

- `discovery_only`: accepted as a lead with an exact machine-computed blocker receipt; not evidence.
- `quarantined`: preserved but promotion is prohibited until the defect is resolved.
- `promotion_ready`: all mechanical requirements pass; human review is the only permitted remaining blocker.
- `verified_evidence`: all mechanical requirements pass, human review is approved, blocker list is empty, and the generated Provenance Receipt validates.

`filing_ready_assertion` is intentionally outside this gate and requires a separate current-evidence-and-authority review.

## Fail-closed requirements

For `verified_evidence`, the validator requires:

1. An approved source root and a canonical Resource Pointer.
2. Resource Pointer status `verified`, same-case scope, evidentiary source kind, and source-system identity.
3. Stable pointer classification (`stable_immutable` or `stable_versioned`).
4. Original filename and source version.
5. Exact-byte SHA-256, byte count, and MIME type.
6. Resource Pointer content hash equal to the exact-byte SHA-256.
7. Acquisition time, custodian, and acquisition method.
8. Original-vs-derived classification; derivatives link to a prior Provenance Receipt.
9. Duplicate resolution; exact duplicates identify a group and controlling-copy disposition.
10. Sensitivity classification.
11. Chain-of-custody state `preserved` or explicitly `not_required`.
12. Evidentiary claim class and `verified_record` partition.
13. Exact bytes preserved when accessible.
14. Restricted/privileged/minor-sensitive/medical/school/psychological/sealed material restricted to `no_projection` or `pointer_only`.
15. Human approval with reviewer and timestamp.
16. Empty blocker receipt and successful Provenance Receipt validation.

## Truth separation

`verified_evidence` means the artifact/provenance gate passed. It does **not** mean every statement inside the artifact is true. A party allegation or witness statement can be accepted as an authenticated evidentiary record while the generated provenance receipt remains `partially_verified` for the proposition class. Model inference and legal argument cannot be promoted as evidence through this gate.

## Blocker integrity

The semantic validator independently computes every blocker and requires `promotion.blockers` to match that set exactly. A caller cannot suppress a known defect to force promotion.

## Duplicate doctrine

- `unique`: no exact-byte duplicate found in the bounded comparison set.
- `exact_duplicate`: SHA-256 equality; duplicate group and controlling-copy disposition are mandatory.
- `version_related`: lineage may be related but byte hashes differ; never collapse automatically.
- `unknown`: promotion-blocking.

## Privacy boundary

No credentials, source bytes, protected-minor details, medical/school/psychological content, precise addresses, privileged narratives, or allegation-bearing narratives are copied into generalized memory, task, analytics, or GitHub receipt surfaces. Sensitive items remain pointer-only or unprojected.

## Legacy migration rule

Existing legacy evidence indexes remain `discovery_only`. They must be re-ingested through this gate from approved roots; index rows, filenames, or prior summaries are never grandfathered into verified evidence.
