# CASEBRAIN actor layer

This directory is the source-linked actor registry for case `1FDV-23-0001009`.
It is designed to keep identity, role, source pointers, file candidates,
relationships, open questions, and review state separate from substantive
allegations.

## Files

- `ACTOR_REGISTRY_SCHEMA.json` — strict JSON Schema contract.
- `ACTOR_REGISTRY.json` — 31 actor entries derived from 29 Notion source rows,
  plus two unresolved identity candidates.
- `ACTOR_FILE_LINK_MATRIX.csv` — flat quality-control projection; it contains
  no allegation text.
- `ACTOR_DATA_QUALITY_REPORT_2026-07-15.md` — measured baseline, conflicts,
  limitations, and recommended review order.
- `ACTOR_REPORT_ARTIFACT.json` — validated bounded report snapshot used by the
  private Sites reader.
- `package.json` and `validate_actor_registry.py` — strict JSON Schema and
  semantic validation, including a negative control for verified allegations.

## Safety contract

1. GitHub is canonical; Notion and CASEBRAIN are projections.
2. Work-product allegations remain allegations and are not copied as facts.
3. Identity is not `verified` without a hashed primary or official source.
4. Protected-minor material remains sealed/restricted and excludes DOB,
   contact information, and addresses.
5. Conflicting names, roles, assignments, or hash meanings remain explicit
   conflict records until a human resolves them.
6. A file link is only a candidate pointer until export, hash, authentication,
   and event-level review are complete.

## Validate

```bash
cd actor-build
npm install
npm test
```

The negative control mutates a copy in memory and confirms that a
`party_allegation` with `verification_status=verified` is rejected.
