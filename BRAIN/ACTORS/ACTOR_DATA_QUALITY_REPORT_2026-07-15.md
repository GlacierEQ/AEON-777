# CASEBRAIN actor data-quality report

**Case:** 1FDV-23-0001009  
**Snapshot:** 2026-07-15  
**Audience:** Casebuilder operators, reviewers, and counsel  
**Scope:** Actor-index work product and linked file candidates. This is not a
court finding, evidentiary authentication report, or legal conclusion.

## Executive finding

The actor layer is structurally usable but not yet evidentiary-grade. It now
contains 31 stable actor entries, 19 with external file candidates, and five
preserved identity/authority conflicts. The source Notion database contains
allegation text in 26 of 29 rows, lacks a numeric evidence count in 25 rows, and
lacks review status in nine rows. Those fields are therefore treated as
work-product signals, not facts or reliable completeness measures.

## Measured baseline

| Measure | Count | Denominator | Interpretation |
|---|---:|---:|---|
| Source actor rows | 29 | 29 | All source rows were mapped |
| Canonical actor entries | 31 | n/a | Includes two separate unresolved candidates |
| Rows containing allegation text | 26 | 29 | Allegations were not promoted |
| Rows missing numeric evidence count | 25 | 29 | Legacy evidence counts are not trusted |
| Rows missing review status | 9 | 29 | Review-state completion is 69.0% |
| Actors with external file candidates | 19 | 31 | File-link coverage is 61.3% |
| Open conflicts | 5 | n/a | Must be resolved through authoritative sources |
| Verified live claims | 0 | n/a | Deliberate safety posture |

Percentages are computed from the frozen 2026-07-15 snapshot. Counts reflect
index metadata, not the number of underlying files or admissible exhibits.

## Data lineage and method

1. The Notion actor database supplied 29 actor rows and legacy workflow fields.
2. Google Drive searches supplied candidate file and folder pointers for named
   actors; content was not assumed authentic from titles alone.
3. The exhibit manifest supplied five populated exhibit rows, including a
   stored-text hash for EX-0005.
4. The AEON-777 truth contract supplied the allowed container tags and rules
   for claim classification, source pointers, conflicts, and human review.
5. Names were normalized only for stable keys. Any ambiguous identity was
   split into a separate actor candidate rather than silently merged.

## Open conflicts

| Conflict | Affected actor(s) | Control |
|---|---|---|
| Shaw role label | Judge Natasha Shaw | Obtain dated official assignment record |
| Yamatani identity | Micky/Miki Yamatani, Michelle Schatz, Kristin Yamatani candidate | Compare filed appearances and authoritative identity records |
| Protected-minor spelling | Kekoa / Keko | Keep sealed; resolve from authoritative case record |
| Judicial assignment | Shaw / Naso | Reconcile against dated docket or assignment order |
| EX-0005 hash meaning | Unknown scheduling clerk / transcript | Document byte streams; obtain original audio and call log |

## File-link controls

A linked candidate does not establish what a file proves. Before any claim is
upgraded, the operator should:

1. export the exact source bytes;
2. calculate and store SHA-256;
3. record acquisition time and custodian;
4. separate original, OCR text, normalized transcript, and derivative work;
5. authenticate identity and role;
6. tie the file to a dated event;
7. classify the resulting statement as source fact, procedural record, court
   finding, party allegation, witness statement, inference, or legal argument;
8. require human review for any status change.

## Priority review queue

| Priority | Actor group | Next source action |
|---|---|---|
| P0 | Casey, Teresa, protected minor, core counsel, Shaw, Naso | Hash filed pleadings/orders and resolve identity/assignment conflicts |
| P1 | Murakami, clerks, HPD, CSEA/DHS/DOE/CWS, PACT, OFW, Kids First | Obtain official/service records and confirm role/date boundaries |
| P2 | Third parties and secondary organizations | Confirm case relevance before expanding collection |

## Limitations

- Source titles and links were reviewed as index metadata; most underlying
  bytes were not exported or authenticated in this pass.
- Legacy allegation and review-note prose is intentionally excluded from the
  canonical actor facts.
- Evidence-count fields are incomplete and mix unknown counting rules.
- No actor identity is marked verified in this snapshot.
- The registry is a control-plane artifact and requires human legal review
  before use in a filing or external representation.

## Recommended acceptance criteria for the next pass

- Resolve all five conflict records or mark each blocked with a specific reason.
- Hash at least one primary or official source for every P0 actor.
- Reach 100% review-status coverage.
- Replace free-form evidence counts with counts derived from the file-link
  matrix and manifest.
- Add event-level links only after source authentication and claim
  classification.
