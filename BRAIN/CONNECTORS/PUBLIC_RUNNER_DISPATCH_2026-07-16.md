# CASEBRAIN Public Runner Dispatch

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

Execution route:

`GlacierEQ/AEON-777` → Pillar C metadata envelope → `GlacierEQ/public-actions-runner-host` → GitHub-hosted `ubuntu-latest` → governed result returned through `GlacierEQ/llm-runner-teams`.

Catalog action: `casebrain-validation`

Source branch: `casebrain-actor-registry-v1`

The public runner may check out this private workload only through the approved read-only bridge token. It runs the repository root `npm test`, which invokes actor-registry schema/semantic/negative-control validation, connector-fabric schema/semantic/negative-control validation, and strict provenance-receipt schema compilation.

No evidence bytes, allegation prose, protected-minor identifiers, credentials, or production writes are included in the public job envelope or public status output.
