# 🔗 FLEXIBLE RESOURCE POINTERS
## AKOS Case Brain — Source-of-Truth Layer

The case brain is a living system. Anything that can change must remain replaceable without breaking the Brain/Brawn structure.

## Core rule

**Structure is stable. Resources are flexible. The source of truth wins.**

The Brain stores meaning, relationships, routes, and pointers. It does not become the authoritative copy of changing evidence, dates, service status, connector state, or external records.

For resources represented in several places, use the [Source-of-Truth Mesh](./SOURCE_OF_TRUTH_MESH.md): one stable resource identity, one declared canonical source, and many linked projections.

## Resource classes

| Resource | What AKOS stores | What remains authoritative |
|---|---|---|
| Court record | docket/file pointer, date, relationship | court/JEFS record or original court document |
| Evidence | exhibit ID, path, hash, provenance | original evidence file and custody record |
| Motion or draft | route, version, source list, status | approved saved artifact |
| Deadline | event pointer and verification time | court notice, order, or confirmed calendar record |
| Connector/service state | endpoint/account pointer and last check | connected service |
| Strategy | working route and assumptions | current Brain review and source-backed analysis |

## Pointer rules

1. **Do not duplicate a changing source just to make navigation easier.**
2. **Use a relative repository path when the source lives in this repo.**
3. **Use a canonical URL, record ID, or folder ID when the source lives elsewhere.**
4. **Record `last_verified` or the canonical contract's `last_checked_at` whenever a changing resource is checked.**
5. **If a source moves, update the pointer—not every document that refers to it.**
6. **A derivative may be created for work, but it must identify its source and never replace it.**
7. **A symlink may be used only as a convenience view when the underlying platform preserves it reliably. The symlink is never the source of truth. If reliability is uncertain, use an explicit pointer.**
8. **Never treat a status claim as a completed action without a source pointer or execution record.**
9. **If the resource has multiple views, link them through the mesh rather than treating each view as an independent authority.**
10. **Pointer resolution health is independent from factual truth, authenticity, admissibility, and legal validity.**

## Minimum pointer record

The reusable machine contract is [`RESOURCE_POINTER_SCHEMA.json`](./RESOURCE_POINTER_SCHEMA.json). New structured pointers should use its canonical field names:

```yaml
resource_id: stable-resource-name
canonical_uri: canonical path, URL, docket route, or source-system locator
source_kind: court_record | evidence | communication | filing | index | connector | system | other
locator: optional human-readable route description
content_hash: optional SHA-256 when exact bytes are materialized and known
last_checked_at: timestamp
case_id: optional case scope
source_system: optional owning source/service
native_id: optional source-native object identifier
aliases: optional retrieval aliases
resolution_status: verified | unverified | stale | moved | blocked | unavailable | superseded | conflicting
replaced_by: optional successor resource_id
notes: provenance, limits, or review gate
```

Legacy registries may retain established field names such as `id`, `kind`, `source_of_truth`, `status`, and `last_verified`. They are not rewritten merely for naming uniformity. New memory records and new pointer-producing code use the reusable contract while the resolver reads the existing registries in place.

## Canonical contract and resolver

The estate does **not** create a second Library-of-Links or shadow resource index.

- `BRAIN/RESOURCE_POINTER_SCHEMA.json` is the reusable pointer shape.
- `BRAIN/resource_pointer_resolver.py` is a read-only resolver over existing registries.
- `shared/casebrain/<case>/RESOURCE_REGISTRY.json`, source-object registries, release registries, and connector bindings remain the owning registry surfaces.
- `MEMORY_RECORD_SCHEMA.json` binds every `source_pointers[*]` entry to the same pointer contract.
- A memory record stores enough routing metadata to return to the source; it does not become a substitute copy of the source.
- Reuse an existing stable `resource_id` whenever identity is already established. Do not create a parallel identity because a new alias, path, backend, or derivative appears.
- If several records share the same content hash, preserve the ambiguity unless source-specific evidence establishes which identity controls.

Examples:

```bash
python BRAIN/resource_pointer_resolver.py D225-JIMS-RAW-001 --json --require-unique
python BRAIN/resource_pointer_resolver.py 26201dc2a2b4849b2a578267b57f840240fd141dea5ff4d87f9b668444ffffd8 --json
```

The first query exercises stable source-object identity. The second intentionally demonstrates that byte identity can resolve to more than one preserved object identity; the resolver does not silently collapse them.

## Change handling

- **Stable:** preserve the route and identifier.
- **Moved:** update the pointer and record the old location.
- **Replaced:** point to the successor and preserve provenance.
- **Unverified:** mark it pending; do not promote it to Brain truth.
- **Unavailable:** keep the pointer, mark the blocker, and do not invent a substitute.
- **Multi-location:** retain one canonical source and link every working view to it.
- **Conflicting:** preserve every candidate and the conflict until source-specific proof resolves it.

This is the flexible layer between the living case record and the stable AKOS architecture.
