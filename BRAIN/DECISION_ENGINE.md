# Autonomous Decision Engine

## Job
Turn current mesh events into transparent recommendations. It is a recommendation engine, not an autonomous legal actor.

## Inputs
- current case stage and phase;
- verified or clearly marked reported events;
- source-linked deadlines and service state;
- threat signals with alternatives;
- open tasks and prior decisions;
- ECHO readiness and human-gate state.

## Output
Every recommendation must include:
- `recommendation_id`;
- proposed next action;
- triggering event IDs;
- source pointers;
- deadline or urgency;
- assumptions and uncertainty;
- reversible first step;
- human approver;
- expiration/review time;
- outcome record.

## Priority order
1. Preserve evidence and prevent irreversible loss.
2. Protect confirmed deadlines and service records.
3. Resolve source conflicts.
4. Prepare the smallest useful human-review package.
5. Only then optimize sequencing or escalation.

## Examples
- New court filing: ingest, link to docket timeline, compare against prior orders, prepare a review packet.
- Deadline approaching: surface source, calculate remaining time, flag missing service proof, recommend human action.
- Threat signal: preserve source, list observations and alternatives, recommend review; do not declare motive or guilt.
- Conflicting copies: freeze the derivative, identify canonical candidates, request source comparison.

## Prohibited autonomous actions
No filing, service, court communication, legal conclusion, public release, evidence destruction, or irreversible escalation without explicit human approval.