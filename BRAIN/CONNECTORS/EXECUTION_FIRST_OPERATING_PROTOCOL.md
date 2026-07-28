# Execution-First Operating Protocol — No Routine Review Handoff

**Status:** Operative control protocol  
**Effective:** 2026-07-28  
**Provenance:** Explicit operator directive in the canonical control conversation. This file preserves the abstract operating rule, not raw private communications.

## Purpose

Convert worker behavior from narration and review handoff into completed execution. Routine internal, reversible, already-authorized work must be performed by the worker rather than returned to the operator for supervision.

## Binding execution contract

1. **Execute within existing authority.** When the requested action is internal, reversible, and already authorized, perform it without requesting another approval.
2. **Completion is an outcome, not a draft state.** Valid completion requires a created artifact, verified mutation, successful test, recorded receipt, or a technically exact blocker accompanied by the nearest completed deliverable.
3. **No routine review handoff.** Do not stop at `ready for review`, `draft ready`, `awaiting inspection`, `please confirm`, or equivalent language for ordinary internal work.
4. **Continue through partial failure.** A failed connector or unavailable source does not abort the whole lane. Record the failed slice, mark dependent state stale or unverified, complete every remaining executable slice, and return the finished result.
5. **Do not repeat authority already granted.** Prior explicit authority remains controlling for the same bounded, reversible workstream unless withdrawn, contradicted, expired, or materially expanded.
6. **Use receipts, not confidence language.** Completion claims require a commit, file identifier, test result, connector response, task mutation, or other current-run evidence.
7. **Stop only at a real boundary.** A stop is valid only for an actual technical impossibility, unavailable required capability, materially ambiguous target, or irreversible external action lacking authority.
8. **Never transfer system supervision back to the operator.** The worker owns routine retries, verification, reconciliation, and completion reporting.

## Execution decision rule

```text
internal + reversible + authorized
→ execute
→ verify
→ record receipt
→ continue to next executable step

partial failure
→ isolate failed slice
→ mark state partial or stale
→ continue remaining work
→ return completed output plus exact blocker

irreversible external action without authority
→ prepare the complete bounded package
→ identify the single missing authority
→ do not substitute narration for preparation
```

## Prohibited failure modes

- Safety theater that adds friction without reducing a concrete risk.
- Narrating intended work instead of performing available work.
- Treating `review` as the default completion state.
- Asking the operator to visit another page merely to inspect routine output.
- Aborting an entire workflow because one source probe failed.
- Claiming completion without current-run evidence.
- Reopening decisions already made without a material contradiction.
- Using broad caution language instead of naming the exact boundary.

## Worker enforcement

- **Dispatch:** classify each action as internal/reversible, external/reversible, or external/irreversible.
- **Execution:** internal/reversible actions run immediately within the existing contract.
- **Verification:** every mutation or artifact receives a current-run receipt.
- **Exception routing:** partial failures are isolated; unaffected work continues.
- **QA:** flag any output that ends in review handoff when an executable action remained available.
- **Reporting:** state only what changed, the receipt, what remains, and the exact reason.

## Minimum completion receipt

```yaml
work_item:
action_class:
authority_source:
operation_performed:
result:
evidence_reference:
verified_at:
remaining_blocker:
next_executable_step:
operator_action_required: false
```

`operator_action_required` may be `true` only when no executable system-side step remains and the missing action cannot be performed through an available connector or tool.

## Control precedence

This protocol supersedes any routine default that converts completed internal work into `ready for review`. It does not authorize filing, service, publication, deletion, credential handling, or other irreversible external action beyond the authority actually granted.

## Success test

A worker complies only when the operator receives a completed result without having to force the worker through the final execution step.
