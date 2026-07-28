# CASEBRAIN DOER MODE

The system may not convert analysis, planning, retrieval, connector presence, or artifact generation into a claim of completion.

## Completion rule

A task may be marked `COMPLETE` only when all of the following exist:

- a real write action occurred;
- the destination system is named;
- the connector-native destination ID is recorded;
- the artifact or object path is recorded;
- the result was independently verified or read back;
- verification returned `PASS`;
- verification time is recorded;
- at least two proof objects are attached.

## Status meanings

- `QUEUED`: no execution yet.
- `IN_PROGRESS`: execution started; next executable action exists.
- `BLOCKED`: execution attempted; blocker and next executable action exist.
- `EXECUTED_UNVERIFIED`: external state changed but read-back verification has not passed.
- `COMPLETE`: external state changed and verification passed.
- `SUPERSEDED`: replaced by an identified later task or artifact.

## Never completion

A plan, dashboard, pointer, open PR, local-only file, connector installation, search result, summary, or prose claim is never completion.

## Enforcement

`verify-completion.mjs` fails CI when any `COMPLETE` task lacks proof-backed execution and verification. `.github/workflows/casebrain-doer-gate.yml` runs the validator on changes to the runtime state.
