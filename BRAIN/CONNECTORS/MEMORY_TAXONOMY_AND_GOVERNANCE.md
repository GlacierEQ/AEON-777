# CASEBRAIN Memory Taxonomy and Governance

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

## Authority order

1. Approved original bytes and source-system metadata.
2. Immutable provenance receipt tied to the exact bytes.
3. GitHub schemas, validators, decisions, resource registries, and migration maps.
4. Validated derived artifacts tied to their original receipt.
5. Notion control-plane projections.
6. ClickUp, Linear, and Jira tasks or run receipts.
7. General memory summaries and pointer-backed recall projections.

Lower layers never promote or overwrite claims in higher layers.

## Pointer-backed organization

Externally grounded memory follows this route:

`memory record -> source_pointers[*] -> stable resource_id -> existing resource/source-object registry -> canonical source`

- `RESOURCE_POINTER_SCHEMA.json` is the reusable shape for memory source pointers.
- Resource registries remain the identity/route control surfaces; memory backends are recall and projection surfaces, not evidence authority.
- One source object may have many aliases, working views, backend projections, and derived memories without creating parallel canonical identities.
- Aliases improve retrieval only. They never create a second source of truth.
- Raw source bytes are not copied into general memory merely to improve navigation.
- Pointer health and claim verification remain separate state dimensions.
- Namespace controls, quarantine, retrieval guards, and tombstones continue to govern memory even when a valid source pointer exists.
- Conflicting resource identities, hash-equivalent objects with different provenance, stale routes, and unresolved source relationships remain explicit until source-specific review resolves them.

## Memory classes

| Class | Purpose | Promotion rule |
|---|---|---|
| source fact | Directly represented by an identified source | May become verified only after source and scope review |
| procedural record | Docket, filing, hearing, service, or order metadata | Requires authoritative record pointer |
| court finding | A finding actually stated in an order or transcript | Requires exact location and controlling/superseded status |
| party allegation | A party's assertion | Never auto-promoted to verified |
| witness statement | A witness's assertion | Never auto-promoted to verified |
| model inference | Machine-generated interpretation | Never auto-promoted to verified |
| legal argument | Proposed application of authority | Requires human legal review; not a fact |
| system state | Connector, deployment, or automation observation | Requires timestamped source-linked receipt |
| control decision | Human-approved governance or routing decision | Canonical in GitHub; projected elsewhere |

## Bucket separation

| Bucket | Contents | Allowed systems |
|---|---|---|
| `original_evidence` | Exact approved source bytes | Approved cloud/source roots only |
| `sealed_evidence` | Privileged, medical, credential-bearing, protected-minor, or specially restricted material | Sealed approved source root only |
| `derived_work` | OCR, transcript, normalized copy, thumbnail, analysis | Approved derivative root; always links to original receipt |
| `canonical_control` | Schemas, validators, decisions, registry, migration maps | GitHub |
| `projection_receipt` | Status, owner, gate, safe pointer, score, exception | Notion and task systems |
| `quarantine` | Unknown scope, duplicate, malware risk, missing provenance, or sensitivity conflict | Isolated staging only |

Originals and derivatives are never co-mingled. Notion, task systems, analytics, and general memory never receive privileged bytes, raw protected-minor identifiers, credentials, medical content, or allegation prose.

## Connector state model

`advertised → tool_available_unassessed → authenticated → root_approved → probe_verified → receipt_verified → ingestion_eligible`

Every transition requires its own evidence. Tool availability does not prove authentication. Authentication does not prove root authorization. A successful metadata probe does not authorize content ingestion.

## Provenance minimum

Every artifact entering an approved queue must carry:

- connector ID, canonical source URI, source version, acquisition time, and custodian;
- exact original filename, MIME type, byte count, and SHA-256;
- stable resource ID and source-native ID when available;
- original/derivative class and parent receipt when derivative;
- sensitivity, privilege/protected-minor gates, claim class, and verification state;
- approved bucket, human-review state, idempotency key, and immutable run receipt.

## Audit discipline

- Append observations; do not overwrite prior states.
- A state change records old value, new value, timestamp, actor, reason, and receipt URI.
- Unknown values remain explicit and score zero.
- Connector quality and data quality are calculated independently.
- Positive connector-score components require field-level evidence.
- Stale probes cannot support current-state claims.
- Duplicate handling is compare-and-link; originals are not deleted automatically.
- Hash-equivalent resources are not automatically identity-equivalent when custody, native ID, filing relationship, or source provenance differs.
- Every write is followed by schema validation, semantic validation, read-back, and receipt verification.
- External legal action, filing, service, publication, sharing, deletion, and access expansion remain human-only gates.

## Promotion gates

`discovered → metadata_indexed → quarantined → reviewed → canonical_linked`

Promotion stops on missing root authorization, missing hash where bytes are materialized and hash is required, unresolved duplicate, sensitivity ambiguity, protected-content leakage, unverifiable identity, claim-class conflict, schema drift, or absent human approval.

A resolver hit is not a promotion gate by itself. Resolution answers “which registered route or identity matches?”; evidentiary verification answers a different question.

## Next integration slice

Implement one end-to-end, metadata-only pilot against a single approved root:

1. Record exact root URI and owner.
2. Resolve or assign the stable resource ID before memory projection.
3. Perform a bounded successful probe and preserve the timestamped receipt.
4. Create a provenance receipt for one non-privileged test artifact.
5. Derive the deterministic idempotency key and prove replay safety.
6. Project only safe status fields and source pointers to memory/Notion and one task receipt.
7. Read back all writes and reconcile the audit log.

No production ingestion is enabled by this document.
