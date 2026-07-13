# 🔗 FLEXIBLE RESOURCE POINTERS
## AKOS Case Brain — Source-of-Truth Layer

The case brain is a living system. Anything that can change must remain replaceable without breaking the Brain/Brawn structure.

## Core rule

**Structure is stable. Resources are flexible. The source of truth wins.**

The Brain stores meaning, relationships, routes, and pointers. It does not become the authoritative copy of changing evidence, dates, service status, connector state, or external records.

## Resource classes

| Resource | What AKOS stores | What remains authoritative |
|---|---|---|
| Court record | docket/file pointer, date, relationship | court/J EFS record or original court document |
| Evidence | exhibit ID, path, hash, provenance | original evidence file and custody record |
| Motion or draft | route, version, source list, status | approved saved artifact |
| Deadline | event pointer and verification time | court notice, order, or confirmed calendar record |
| Connector/service state | endpoint/account pointer and last check | connected service |
| Strategy | working route and assumptions | current Brain review and source-backed analysis |

## Pointer rules

1. **Do not duplicate a changing source just to make navigation easier.**
2. **Use a relative repository path when the source lives in this repo.**
3. **Use a canonical URL, record ID, or folder ID when the source lives elsewhere.**
4. **Record `last_verified` whenever a changing resource is checked.**
5. **If a source moves, update the pointer—not every document that refers to it.**
6. **A derivative may be created for work, but it must identify its source and never replace it.**
7. **A symlink may be used only as a convenience view when the underlying platform preserves it reliably. The symlink is never the source of truth. If reliability is uncertain, use an explicit pointer.**
8. **Never treat a status claim as a completed action without a source pointer or execution record.**

## Minimum pointer record

```yaml
id: stable-resource-name
kind: evidence | filing | deadline | service | strategy | index
source_of_truth: canonical path, URL, docket entry, or service record ID
working_view: optional derived path or package
status: current state
last_verified: YYYY-MM-DD or timestamp
replaced_by: optional successor pointer
notes: provenance, limits, or review gate
```

## Change handling

- **Stable:** preserve the route and identifier.
- **Moved:** update the pointer and record the old location.
- **Replaced:** point to the successor and preserve provenance.
- **Unverified:** mark it pending; do not promote it to Brain truth.
- **Unavailable:** keep the pointer, mark the blocker, and do not invent a substitute.

This is the flexible layer between the living case record and the stable AKOS architecture.
