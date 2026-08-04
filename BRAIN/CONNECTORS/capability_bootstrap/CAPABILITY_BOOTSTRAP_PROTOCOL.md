# Live Capability Bootstrap — No False Unavailable Claims

**Thread anchor:** `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`  
**Status:** Binding execution guard  
**Purpose:** Prevent a worker from claiming a connected tool, repository, connector, or route is unavailable before performing live discovery and a real probe.

## Failure this guard prevents

A worker must not answer from assumed capability state when the runtime exposes connector discovery or invokable actions. In particular, a connector embedded in the active runtime cannot be described as unavailable merely because it was not surfaced in the model's initial tool view.

## Mandatory bootstrap sequence

For every request whose completion materially depends on connected data or an external action:

```text
1. identify likely connector families
2. inspect the live connector registry/tool namespace
3. load the relevant action schemas
4. perform a bounded read or health probe
5. reuse returned identifiers for deeper reads or writes
6. classify the connector from current-run evidence
7. continue every executable slice
8. report only receipt-backed state
```

Discovery alone is not completion. A successful action schema lookup must be followed by the actual read, probe, or mutation required by the task.

## Connector state model

```yaml
connector_key:
tool_surface:
  discovered: true|false
  discovered_at:
  discovery_receipt:
authentication:
  state: authenticated|auth_required|blocked|unknown
  evidence_ref:
probe:
  attempted: true|false
  operation:
  success: true|false
  receipt_ref:
  error_code:
classification:
  availability: connected|partial|blocked|unavailable|unknown
  freshness: fresh|stale|expired|unknown
  source_linked: true|false
execution:
  system_side_executable_remaining: true|false
  next_action:
  operator_action_required: true|false
```

Tool visibility and authentication are separate. A tool may be discoverable while downstream authentication remains unknown. Conversely, a connector previously used successfully must not be downgraded to unavailable without a current failed probe or an explicit revocation receipt.

## Claim rules

### `connected`

Allowed only when a current-run invocation succeeds and returns usable data or a verified mutation receipt.

### `partial`

Allowed when discovery and some actions succeed, but a required sub-route fails. The failed slice must be isolated while unaffected work continues.

### `blocked`

Allowed when the connector is found but execution is prevented by a specific current error such as missing scope, credential, route, approval, budget, or circuit state.

### `unavailable`

Allowed only when all of the following are true:

- relevant connector discovery was attempted;
- no matching connector/action was found, or a matching action returned a definitive unavailable result;
- alternate in-scope routes were checked;
- the exact discovery/probe receipt is recorded; and
- no system-side executable step remains.

### `unknown`

Required when evidence is insufficient. `Unknown` is preferable to a fabricated unavailable claim.

## Prohibited behaviors

- Claiming a connector is unavailable without calling connector discovery.
- Treating an omitted top-level tool as proof that the account connector does not exist.
- Asking the operator to paste data that an available connector can read.
- Answering from conversation history when the answer depends on connected current state.
- Stopping after schema discovery without invoking the discovered action.
- Repeating a prior blocker after the runtime or connector surface changes.
- Treating a failed action on one connector as failure of the entire evidence field.
- Using broad platform-limit language without the exact current-run error receipt.

## Current observed GitHub receipt

On `2026-08-03`, the live GitHub connector successfully:

- enumerated accessible `GlacierEQ` repositories;
- returned administrative, push, pull, maintain, and triage permissions on multiple repositories;
- located canonical AEON-777 memory-federation artifacts through code search; and
- fetched the operative Execution-First protocol and connector package from `main`.

Therefore GitHub is classified as `connected` for this runtime. Any unavailable claim made without a newer contradictory probe is invalid.

## Completion receipt requirement

Every capability-dependent run must record:

```yaml
work_item:
connector_key:
discovery_attempted:
probe_attempted:
probe_operation:
probe_result:
evidence_reference:
availability_classification:
partial_failures:
system_side_executable_remaining:
next_executable_step:
operator_action_required:
```

`operator_action_required` may be true only when the connector bootstrap has exhausted all available system-side routes and the remaining gate genuinely requires a human-only action.
