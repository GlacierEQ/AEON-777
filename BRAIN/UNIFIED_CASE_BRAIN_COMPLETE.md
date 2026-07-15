# Unified CASEBRAIN Operating Contract

## Status

Architecture foundation in active development. Runtime orchestration is not yet proven end to end.

This document replaces prior language that treated predictions, threat scores, automated triggers, or litigation outcomes as established operational facts.

## Mission

CASEBRAIN is the source-linked intelligence layer for case `1FDV-23-0001009`. It preserves originals, distinguishes facts from allegations and inferences, tracks contradictions, recommends reversible next steps, and stages review-ready work through ECHO.

It does not replace the court record, authenticate evidence by itself, make legal findings, file documents, serve parties, contact courts, publish evidence, or authorize escalation.

## Operating stack

| Layer | Responsibility | Authority boundary |
|---|---|---|
| Source-of-Truth Mesh | Stable identity, canonical pointer, version, provenance, freshness | Original source remains authoritative |
| AKOS / Brain | Retrieval, comparison, timeline, contradiction analysis, recommendation | No external action |
| CASEBRAIN memory | Structured recall and actor-scoped context | No unsupported fact promotion |
| ECHO / Brawn | Assemble, check, hash, package, and stage derivatives | No filing, service, publication, or court contact |
| Human review | Approve, reject, revise, or authorize external action | Final gate |

## Four chambers

### 1. Timeline

Stores source-linked events, deadlines, service status, hearings, orders, and phase gates using `CASE_EVENT_SCHEMA.json`.

A deadline is not accepted without its source, time zone, calculation basis, and confirmation state.

### 2. Threat and anomaly review

Stores observations and alternative explanations using `THREAT_SIGNAL_SCHEMA.json`.

A signal is not a finding of motive, misconduct, corruption, criminal conduct, conspiracy, or civil liability. Legal characterizations remain explicitly staged as `hypothesis`, `research_needed`, `supported_argument`, `attorney_reviewed`, or `court_determined`.

### 3. Decision engine

Produces recommendations with triggering event IDs, source pointers, assumptions, uncertainty, reversible first step, human approver, and review expiration.

Priority order:

1. Preserve evidence and prevent irreversible loss.
2. Protect source-confirmed deadlines and service records.
3. Resolve source conflicts.
4. Prepare the smallest useful review package.
5. Optimize sequencing only after the record is trustworthy.

### 4. Orchestrator

Routes a source event through preservation, identity, validation, memory, retrieval, recommendation, ECHO staging, human review, and audit.

## Container registry

Canonical generic containers:

- `shared` — cross-actor timeline, evidence, and orchestration
- `shaw`
- `naso`
- `yamatani`
- `brower`
- `hpd`
- `csea`
- `other`

Every record carries `case_id`. Generic container names do not authorize cross-case blending.

Legacy sources are mapped in `CONTAINER_REGISTRY.json`. Migration is non-destructive until schema validation, recall comparison, and count reconciliation succeed.

## Truth model

Every memory uses both a claim class and a verification status.

Claim classes:

- source fact
- procedural record
- court finding
- party allegation
- witness statement
- model inference
- legal argument

Verification states:

- unverified
- partially verified
- verified
- contradicted
- superseded
- stale
- blocked
- pending review

An allegation, witness statement, inference, or legal argument cannot be stored as verified. A source can verify that an allegation was made without proving the allegation true.

## Event loop

`receive -> preserve -> identify -> hash -> classify -> validate -> deduplicate -> route -> write -> recall-check -> reason -> recommend -> human gate -> stage -> verify -> audit`

If a source is unavailable, stale, conflicting, or unverified, stop the affected output and preserve the gap. Never substitute a convenient derivative for the canonical source.

## Actor analysis rule

Actor nodes organize evidence; they do not pre-judge an actor. Each incident must retain:

- the exact observation;
- the reporting source;
- alternative explanations;
- contradictions;
- legal authority pointers, if any;
- review status;
- the requested next verification step.

Labels such as fraud, conspiracy, RICO predicate, constitutional violation, retaliation, or judicial misconduct are legal characterizations and may not be emitted as established facts without verified evidence and appropriate legal review.

## Runtime truth

See `RUNTIME_INTEGRATION_STATUS.md` for the last verified inventory. Documentation, configuration, a successful API call, or a generated score is not proof that an automation is live.

## Security

- No credentials, tokens, private keys, or signed URLs in repository documents or memory content.
- Exposed credentials must be revoked and rotated; replacing them with environment-variable names is insufficient.
- Original evidence remains immutable.
- Derivatives receive their own identity, hash, provenance, and access level.
- External actions require explicit human approval.

## Definition of operational

CASEBRAIN is operational only when all of the following are demonstrated with a real source event:

1. Canonical source preserved.
2. Stable resource identity assigned.
3. Hash and version recorded when applicable.
4. Applicable JSON Schema validation passed.
5. Duplicate and conflict checks completed.
6. Record routed to the intended canonical container.
7. Recall reproduces the source-linked structured record.
8. Recommendation shows assumptions and uncertainty.
9. Human gate is enforced.
10. Complete audit event is recorded.
