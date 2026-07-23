# 🧠 CASE BRAIN MASTER INDEX
## AKOS Brain Spiral — Case 1FDV-23-0001009

This is the navigation layer for the case brain inside AEON-777. It organizes the existing case material without moving, duplicating, or altering the underlying files.

---

## 1. THE CASE BRAIN IN ONE VIEW

```text
SOURCE MATERIAL
  court records · filings · exhibits · recordings · declarations · metadata
        ↓
BRAIN / AKOS
  index · timeline · contradictions · legal tracks · memory · next-action routing
        ↓
BRAWN / ECHO
  assemble · format · hash · package · stage · monitor · report
        ↓
HUMAN REVIEW
  approve · serve · file · publish · escalate
```

**Brain** decides what the material means and what path is next.  
**Brawn** turns an approved path into a clean, traceable package.  
**Human review** remains the final gate for legal filing, service, evidence release, and external escalation.

---

## 2. CASE CORE

| Field | Pointer |
|---|---|
| Case | `1FDV-23-0001009` |
| Primary repository | `GlacierEQ/AEON-777` |
| State track | `JEFS_FILING_READY/`, `MOTIONS/`, `1FDV-23-0001009/` |
| Evidence track | `EVIDENCE_VAULT/`, `TRANSCRIBED_EVIDENCE/`, `EXHIBIT_MANIFEST_1FDV-23-0001009.txt` |
| Federal track | `FEDERAL_COMPLAINT_MASTER_INDEX.md`, `FEDERAL_FILING_BRIEF/`, `FEDERAL_WARFARE_PHASE/` |
| Cross-repo map | `LEGAL_REPOS_MASTER_INDEX.md` |
| Execution handoff | `BRAWN/` |

The case identity, party names, dates, docket numbers, and legal theories must be taken from the underlying source files and rechecked before use in a filing.

---

## 3. BRAIN MODULES

### A. Source and evidence map

- `LOCAL_EVIDENCE_MANIFEST.json` — indexed file list and categories
- `EVIDENCE_VAULT/` — evidence storage pointer
- `TRANSCRIBED_EVIDENCE/` — transcript pointer
- `EXHIBIT_MANIFEST_1FDV-23-0001009.txt` — exhibit register
- `PROOF_OF_AUTHENTICITY_1FDV-23-0001009.txt` — authenticity material
- `hashes/` and `manifests/` — integrity paths

### A2. Source-linked actor layer

- `ACTORS/ACTOR_REGISTRY.json` — 32 stable actor entries, including separate unresolved identity candidates
- `ACTORS/ACTOR_FILE_LINK_MATRIX.csv` — allegation-free actor/file coverage projection
- `ACTORS/ACTOR_DATA_QUALITY_REPORT_2026-07-15.md` — measured completeness and conflict baseline
- `ACTORS/ACTOR_REGISTRY_SCHEMA.json` — strict actor/source/conflict contract
- `ACTORS/validate_actor_registry.py` — relationship, identity, claim-class, protected-minor, and summary checks

The actor layer stores source pointers and review state. A linked file remains a candidate until its bytes are exported, hashed, authenticated, and tied to a dated event. No actor allegation is promoted into a fact.

### B. State-court track

- `PHASE_1_MAXIMUM_MOTION_PACKAGE.md`
- `KALUA_PHASE_2.1_COMPLETE_STACK.md`
- `MAXIMUM_MOTION_SEQUENCE.md`
- `JEFS_FILING_READY/`
- `MOTIONS/` — canonical motion path; do not create a case-variant lowercase path
- `JEFS_PRESERVATION_EMERGENCY.md`

### C. Federal and oversight track

- `FEDERAL_COMPLAINT_MASTER_INDEX.md`
- `FEDERAL_COMPLAINT_COMPLETE_EVIDENCE_PACK.md`
- `FEDERAL_COMPLAINT_FILING_ENGINE.md`
- `FEDERAL_COMPLAINT_FINAL_EXECUTION.md`
- `FEDERAL_WARFARE_PHASE/`
- `FEDERAL_OVERSIGHT_REQUEST_DOJ.md`

### D. Comparison and reasoning track

- `CONTRADICTION_MATRIX_MASTER.md`
- `DOCKETS_ANALYSIS_BRIEFING.md`
- `FACT_CHECK_PLAN.md`
- `JUDICIAL_OSINT_EXHAUSTIVE_REPORT.md`
- `MASTER_LITIGATION_ROADMAP.md`
- `IMMEDIATE_ACTION_MAP.md`

### E. Memory and routing track

- `SUPERMEMORY_RECON.json`
- `MEM0_DIRECTIVES.json`
- `MEM0_INTELLIGENCE_DUMP.json`
- `UNIFIED_MEMORY_REPORT.md`
- `ORCHESTRATION/`
- `SYSTEM_INTEGRATION/`
- `ASPEN_INTEGRATION/` — reference-only integration path (the Aspen Grove family); not an ECHO execution root

Memory and connector status are operating references. They are not substitutes for checking the actual source file or service result.

---

## 4. BRAIN DECISION ROUTER

| Signal | Brain action | Brawn handoff | Human gate |
|---|---|---|---|
| New court document | Add pointer, date, docket entry, and relationship | Format/index package | Review before use |
| New exhibit or recording | Add exhibit pointer and integrity record | Hash, label, and package | Review chain and release |
| Contradiction found | Add both source pointers and issue entry | Build comparison table | Review legal significance |
| Deadline or court response | Update timeline and open gate | Prepare checklist/package | User approves action |
| Motion ready | Check sources, citations, exhibits, and format | Stage filing set | **User files/reviews JEFS** |
| External escalation | Map prerequisites and source package | Assemble non-filed draft | User decides whether to send |

No row authorizes autonomous filing or service.

---

## 5. SOURCE-TO-ACTION LOOP

Use the standing pipeline:

**Draft → Check → Verify → Finalize → Save → Push**

1. **Draft** from the source pointers.
2. **Check** structure, dates, names, citations, exhibits, and internal conflicts.
3. **Verify** against the underlying record.
4. **Finalize** only after the review gate is satisfied.
5. **Save** the durable artifact in the correct repo or secured storage path.
6. **Push** with a traceable commit or pull request.

---

## 6. CURRENT BUILD GATES

These are the next structural gates for the case brain:

- [ ] Merge or manually review AKOS architecture PRs #49 and #50.
- [ ] Confirm that `BRAWN/` exists on the merged base branch.
- [ ] Treat `MOTIONS/` as canonical; inventory and migrate any legacy lowercase path through a reviewed, collision-safe change before deletion.
- [ ] Revalidate service status and all calendar dates before relying on the timeline.
- [ ] Confirm the actual source files behind every JEFS-ready index entry.
- [ ] Build or recover mapped exhibit packages and transcription inputs.
- [ ] Verify connector and trigger claims with a real result; documentation alone is not runtime proof.
- [ ] Keep credentials, tokens, and private repository pointers out of ordinary case documents.

---

## 7. CASE-BRAIN STATUS

**Structure:** Brain map present; Brawn home added by the companion PR.  
**Evidence:** Existing vaults, manifests, exhibits, and source documents remain the authority.  
**Execution:** Routed through `BRAWN/`; legal and external actions remain human-reviewed.  
**Next move:** Merge the structural PRs, then populate the open gates from actual files and verified service results.

This index is a map, not a filing, legal opinion, or proof of any fact by itself.
