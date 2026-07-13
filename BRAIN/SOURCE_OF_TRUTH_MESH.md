# 🕸️ SOURCE-OF-TRUTH MESH
## AKOS Case Brain — One Living Truth, Many Linked Views

The case brain may write the same resource into different places without creating different truths.

**One resource identity. Many projections. One update trail.**

## What the mesh is

The Source-of-Truth Mesh is a linked network of resource records across the places AKOS works:

- case-brain indexes and reasoning
- evidence vault and original files
- filing-ready packages
- GitHub repository views
- Google Drive or other connected repositories
- transcripts, exhibits, and working derivatives
- Aspen Grove pointer and orchestration layers

Each mesh node can hold a useful representation of the resource. The nodes are interlinked by a stable resource ID, provenance, content hash when applicable, location pointer, and update record.

The mesh is **not** permission to keep competing copies. It is a way to keep multiple working views synchronized to the same source-backed resource.

## Mesh record

```yaml
resource_id: stable-case-resource-id
kind: evidence | filing | deadline | transcript | index | strategy | service
source_of_truth: canonical path, URL, docket entry, or service record
projections:
  - location: repository or service pointer
    role: original | working_view | filing_package | index | backup
    status: linked | stale | blocked | retired
    last_checked: timestamp
content_hash: optional hash of the represented artifact
version: source version or event number
updated_at: timestamp
updated_by: actor or process
provenance: how this node was created or refreshed
review_gate: none | user_review | attorney_review | filing_review
supersedes: optional prior resource ID or version
notes: limits, conflicts, or unresolved questions
```

## Mesh laws

1. **Stable identity:** every important resource gets one stable `resource_id`.
2. **Canonical authority:** each resource has one declared `source_of_truth`.
3. **Linked projections:** other locations identify their role and point back to the resource ID.
4. **No silent overwrites:** a changed projection creates an event, comparison, or new version.
5. **Provenance travels with the resource:** every derivative records what it came from.
6. **Hashes prove sameness, not truth:** a matching hash shows content identity; it does not prove legal authenticity.
7. **Freshness is visible:** every node carries a last-checked time and a linked/stale/blocked state.
8. **Conflicts are preserved:** disagreement becomes a contradiction or review item; it is not silently merged away.
9. **Source changes propagate:** when the source changes, refresh affected projections and mark untouched ones stale.
10. **Human gates remain real:** a mesh can prepare and interlink filing material, but it cannot approve, serve, or file on the user's behalf.

## Update loop

```text
source changes
    ↓
record new version + provenance + hash when applicable
    ↓
update the mesh record
    ↓
mark dependent projections stale
    ↓
refresh or rebuild each projection
    ↓
check links, identity, completeness, and review gates
    ↓
return one linked status to AKOS
```

The mesh may be updated from any authorized node, but the update must resolve back to the canonical source. If synchronization cannot be verified, the node is marked **stale** or **blocked**, not “current.”

## Mesh roles in the Double Helix

- **AKOS Brain:** owns identity, relationships, provenance, freshness, contradictions, and routing.
- **ECHO Brawn:** creates, checks, refreshes, packages, and reports projections.
- **Aspen Grove:** carries pointers and orchestration between locations.
- **Human review:** controls legal approval, service, filing, evidence release, and escalation.

This lets the case brain write in different places while remaining one connected living system.
