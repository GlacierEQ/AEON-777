# CASEBRAIN DOER MODE

The system is not permitted to convert analysis, planning, retrieval, connector presence, or artifact generation into a claim of completion.

## Completion rule

A task may be marked `COMPLETE` only when all of the following exist:

- a real write action occurred;
- the destination system is named;
- the connector-native destination ID is recorded;
- the artifact or object path is recorded;
- the result was read back or otherwise independently verified;
- verification returned `PASS`;
- verification time is recorded;
- at least two proof objects are attached.

## Status meanings

- `QUEUED`: no execution yet.
- `IN_PROGRESS`: execution has started and a next executable action exists.
- `BLOCKED`: execution attempted; blocker and next executable action exist.
- `EXECUTED_UNVERIFIED`: external state changed, but read-back verification has not passed.
- `COMPLETE`: external state changed and the result passed verification.
- `SUPERSEDED`: replaced by a specifically identified later task or artifact.

## Forbidden substitutions

The following never satisfy completion:

- a plan;
- a dashboard;
- a pointer;
- an open PR;
- a generated local file with no durable storage;
- a connector being installed or authenticated;
- a search result;
- a summary;
- a statement that work is live, aligned, deployed, registered, or operational without proof.

## Enforcement

`verify-completion.mjs` fails CI when any `COMPLETE` task lacks proof-backed external execution and verification.

The workflow `.github/workflows/casebrain-doer-gate.yml` runs this validation for pull requests and changes merged to `main`.
