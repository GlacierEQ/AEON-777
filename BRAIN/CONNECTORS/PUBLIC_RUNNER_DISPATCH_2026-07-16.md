# CASEBRAIN Public Runner Dispatch

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

Execution route (documented design; not runtime-verified):

`GlacierEQ/AEON-777` → Pillar C metadata envelope → `GlacierEQ/public-actions-runner-host` → GitHub-hosted `ubuntu-latest` → governed result returned through `GlacierEQ/llm-runner-teams`.

Catalog action: `casebrain-validation`

Source branch: `casebrain-actor-registry-v1`

The public runner may check out this private workload only after a separately verified read-only bridge credential and repository allowlist exist. This document does not establish credential existence, authentication, successful dispatch, or private-repository checkout. A compliant run would execute the repository root `npm test`, covering actor-registry, connector-fabric, provenance-receipt, and memory-quarantine validation.

No evidence bytes, allegation prose, protected-minor identifiers, credentials, or production writes are included in the public job envelope or public status output.

No public-runner validation receipt has been produced for the current branch head. GitHub Actions run 152 also failed before any step and exposed neither step records nor a log URL.
