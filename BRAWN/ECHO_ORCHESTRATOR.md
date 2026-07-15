# ECHO Orchestrator Contract

ECHO is the universal Brawn engine. This repository supplies the case configuration; ECHO itself remains reusable for other domains.

## Pipeline
`receive AKOS recommendation -> resolve source pointers -> assemble working package -> run checks -> show gaps -> stage output -> human approval -> record delivery`

## Checks
- source pointer resolves;
- canonical source is unchanged;
- versions and hashes agree where available;
- every assertion has support or is marked uncertain;
- deadlines are source-linked;
- exhibits and attachments map correctly;
- no credentials or private tokens are included;
- JEFS and external-action gates remain visible.

## Outputs
ECHO may produce indexes, comparison tables, draft packets, checklists, manifests, and review-ready packages. It may not file, serve, publish, or contact a court autonomously.

## Failure behavior
If a pointer is stale, unavailable, conflicting, or unverified: stop the affected package, preserve the prior version, mark the gap, and route it back to AKOS for resolution. Never silently substitute a copy.

## Case specialization
The active case configuration is `BRAWN/ECHO_CONFIG.json`. Integrations and webhook credentials are runtime resources, not repository content. A listener is considered active only after a real event is received, processed, and recorded in the audit trail.