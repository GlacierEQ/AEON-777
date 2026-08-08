# MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51

## Append-only evidence-intake delta — 2026-08-08 05:07 HST

### Completed

- Promoted the previously green connector-restoration documentation through PR #82.
- Enumerated only approved Supabase evidence roots and inspected metadata schemas and aggregate completeness; no source bytes or row narratives were opened.
- Confirmed that the audited `documents` and `court_documents` tables are empty.
- Classified 112 `apex_legal_documents` rows and 16 `legal_documents` rows as discovery signals only.
- Blocked canonical promotion because all 128 legacy rows lack an evidence-grade hash and immutable source linkage.
- Kept duplicate status unknown: duplicate clearance is impossible until exact-byte hashes exist.
- Preserved separate verified-record, hypothesis/discovery, private-work-product, and filing-ready partitions.

### Execution-ready remediation object

For each legacy row, resolve one approved original-byte pointer, acquire exact bytes without changing them, calculate SHA-256, record acquisition time and custodian, classify original versus derived, assign sensitivity and chain-of-custody requirements, group duplicates by hash, select the controlling copy, and only then consider promotion.

No filing, public sharing, factual promotion, or external messaging was authorized or performed.
