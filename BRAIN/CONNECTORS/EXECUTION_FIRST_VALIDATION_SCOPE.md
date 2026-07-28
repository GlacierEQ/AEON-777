# Execution-First Hosted Validation Scope

This branch exists to force exact-head hosted execution of the canonical connector package after the execution-first control was added to `main`.

The hosted run must execute `npm test` from `BRAIN/CONNECTORS/`, including `validate_execution_first_protocol.mjs`, and must reject:

- routine internal work returned as `ready_for_review` while system-side work remains;
- premature operator handoff;
- whole-lane abort after a partial connector failure;
- completion without the required receipt fields;
- unsupported blocker states.

The branch adds no production activation and performs no external action.
