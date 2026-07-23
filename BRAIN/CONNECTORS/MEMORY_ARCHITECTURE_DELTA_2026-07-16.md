# MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51

## Delta — 2026-07-16

### Completed improvements

- Applied five bounded correction overlays to the live memory backend for Yamatani role classification, CSEA legal conclusions, Brower allegations, Shaw disputed claims, and HPD/cyber attribution.
- Recall-verified every correction using a topic-specific container.
- Detected and documented a container-isolation failure: one shared correction tag returned unrelated correction topics across nominal project scopes.
- Replaced the shared routing design with five unique correction containers. Topic-scoped read-back then returned only the intended correction document and its derived memories.
- Added a strict machine-readable quarantine registry, schema, semantic validator, duplicate-container negative control, and sensitive-pattern guard.
- Corrected the CASEBRAIN master index actor count from 31 to the registry-backed count of 32.
- Preserved the actor schema's `verified_live_claims=false` and `evidence_count_trusted=false` invariants; both are deliberate frozen-snapshot safety controls, not general-purpose toggles.

### Runtime evidence

- Five correction writes returned stable memory IDs.
- Five unique-container recall tests succeeded.
- Attempts to forget the first shared-container copies returned `No matching memory found`; the backend exposed them as document chunks rather than exactly forgettable memory records.
- GitHub Actions run 152 failed before any step, exposed no steps and no log URL, and therefore supplies no validator receipt. This remains an infrastructure/account gate, not a validator result.

### Open gaps

- The five first-pass shared-container correction documents remain as duplicate history and cannot currently be removed through exact-memory forget.
- Unique container tags provide retrieval isolation, but backend project isolation is not independently demonstrated.
- Legacy source documents still contain unqualified assertions; correction overlays change retrieval guidance but do not mutate source bytes.
- The quarantine adapter needs an automated recall regression suite against broader, non-container-scoped queries.
- GitHub-hosted validation still needs a run that reaches the first step and uploads a receipt.

### Next moves

1. Add a recall regression manifest with expected correction precedence and forbidden unqualified outputs.
2. Resolve the GitHub Actions account/runner gate or execute the documented governed public-runner dispatch with a signed receipt.
3. Keep production ingestion disabled until one approved-root provenance/replay pilot succeeds.

### No-action boundary

No source evidence bytes were changed, no legacy allegations were deleted, no identity was promoted, and no legal or external action was performed.
