# CASEBRAIN Connector Sync Policy — 1FDV-23-0001009

## Principle

The system synchronizes **identity, provenance, status, hashes, source pointers, indexes, and approved work product**. It does not blindly synchronize evidence bytes between every platform.

## Allowed flows

| From | To | Allowed payload |
|---|---|---|
| Dropbox | FILEBOSS manifest | Names, paths, sizes, modified times, hashes, classifications, duplicates, custody fields |
| Google Drive | GitHub | Source pointers, document identities, generated indexes, schemas, redacted/public work product |
| GitHub | Notion | PR status, branch, commit, manifest summary, runbook links, decisions, blocked gates |
| Notion | ClickUp | Approved tasks, priorities, owners, review gates, deadlines |
| Gmail | Evidence manifest | Raw-message identity, thread ID, attachment identity, dates, participants, hash after preservation |
| All sources | Supabase | Connector state, audit events, hashes, provenance, idempotency keys, workflow state |
| All sources | Memory mesh | Redacted summaries and pointers only |

## Blocked flows

- `rclone sync` or equivalent destructive mirroring against any evidence root.
- Direct writes to GitHub `main` for sensitive case material.
- Copying protected-minor medical, school, psychological, credential, or sealed content into GitHub, general Notion pages, ClickUp, analytics stores, or memory summaries.
- Treating filenames, search snippets, email subjects, model summaries, or connector metadata as proof.
- Renaming, flattening, moving, deleting, deduplicating, or reorganizing original evidence before a dry-run manifest and explicit approval.
- Storing API keys, bearer tokens, OAuth secrets, private keys, or raw credentials in GitHub or Notion.
- Using a memory-system summary as the sole source for a filing, complaint, accusation, timeline fact, or evidentiary claim.

## Conflict rules

1. **Original evidence bytes:** authenticated source with preserved bytes, hash, custodian, acquisition time, and chain-of-custody record.
2. **Court record:** certified or official court copy, with later versions retained and compared rather than overwritten.
3. **Workflow/schema truth:** merged GitHub `main` after review.
4. **Control status:** canonical Notion dashboard, linked to the controlling GitHub artifact or source.
5. **Operational state:** Supabase audit ledger when live and case-scoped RLS is verified.
6. **Task state:** ClickUp.
7. **Memory:** retrieval aid only.

## Actor investigation workbook

Current artifact:

- Filename: `1FDV-23-0001009_OSINT_ACTOR_INVESTIGATION_WORKBENCH_BATCH01.xlsx`
- SHA-256: `508c6666f148ab97977467171474fc232e0a11e6671056c7ea947947b40cac7d`
- Size: `482808` bytes
- Status: `active_pass_1`

The workbook remains the active acquisition surface. GitHub controls its schema, provenance, routing, and run history. Notion shows status and decisions. Drive or Dropbox holds the controlled binary artifact and later immutable exports.

## Required write envelope

Every new indexed object should carry:

```json
{
  "case_id": "1FDV-23-0001009",
  "object_id": "stable-id",
  "object_type": "actor|event|evidence|source|claim|task|artifact|connector_run",
  "source_pointer": "connector-native-id-or-path",
  "source_system": "github|notion|google_drive|dropbox|gmail|court|other",
  "claim_class": "fact|allegation|inference|authority|procedure|generated_work_product",
  "verification_status": "raw|located|supported|corroborated|primary_source_verified|contradicted|disproved_specific_theory",
  "access_class": "public|case_confidential|restricted|sealed_minor|credential_restricted",
  "content_hash": "sha256-or-null",
  "idempotency_key": "case_id:object_type:stable-id:version",
  "created_at": "RFC3339",
  "updated_at": "RFC3339"
}
```

## Review gates

- **Gate 1 — identity:** correct person, entity, file, docket, account, and name variant.
- **Gate 2 — provenance:** source, custodian, date, path/ID, and acquisition method captured.
- **Gate 3 — integrity:** exact bytes preserved where required; SHA-256 captured.
- **Gate 4 — classification:** access class, claim class, verification state, and actor/event edges assigned.
- **Gate 5 — contradiction:** contrary sources and alternative explanations linked rather than suppressed.
- **Gate 6 — deployment:** forum, purpose, admissibility/foundation, sealing/redaction, and human review satisfied.

No artifact advances to filing, public distribution, discipline submission, or external communication without Gate 6.
