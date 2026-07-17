# CASEBRAIN Legacy Memory Quarantine Manifest

Thread anchor: `MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51`

Status: active control decision; correction overlays applied and recall-verified; legacy document-chunk mutation remains pending.

## Purpose

Prevent legacy summaries, actor nodes, dashboards, and imported memory records from being treated as evidence or established facts when they contain unsupported identity roles, misconduct conclusions, criminal labels, motive claims, threat scores, or legal conclusions.

This manifest is a control-plane decision. It does not establish or disprove the underlying allegations.

## Authority rule

Until a proposition is tied to an identified source locator and reviewed under CASEBRAIN V3, any conflicting legacy memory is subordinate to:

1. approved original bytes and source-system metadata;
2. exact-byte provenance receipts;
3. current GitHub schemas, validators, and governance decisions;
4. source-linked reviewed derivatives.

General memory, Notion projections, generated dashboards, task records, and prior AI summaries are non-evidentiary projections.

## Quarantined legacy classes

| Legacy assertion class | Required classification | Replacement rule |
|---|---|---|
| Incorrect actor-role assignment | `superseded` | Use the current source-linked role; preserve the old value only in audit history. |
| Judicial, attorney, agency, or party misconduct conclusion | `party_allegation`, `source_summary`, `model_inference`, or `legal_hypothesis` | Never present as an established fact without an operative source and exact locator. |
| Constitutional violation, civil-rights violation, fraud, obstruction, kidnapping, retaliation, collusion, or RICO predicate conclusion | `legal_hypothesis` or `party_allegation` | Require independent legal research and source review before filing or fact promotion. |
| Cyber attribution or named-person infrastructure attribution | `quarantined_hypothesis` | No identity attribution without independently authenticated technical evidence. |
| Threat, bias, escalation, or victory score | `model_inference` | Exclude from stable profiles and factual timelines. |
| Motive or intent claim | `inference` | Preserve as disputed unless directly established by admissible evidence. |

## Specific superseding decisions

### Yamatani role

Legacy memory assigning Yamatani as a judicial or agency actor is superseded. Current control rule: treat Miki/Micky Yamatani as Casey's former counsel unless a direct source establishes another role. Do not classify Yamatani as a judge, guardian ad litem, agency actor, or court officer beyond the role shown in the operative source.

### CSEA conclusions

Statements that a CSEA action definitively violated constitutional provisions or constituted a RICO predicate are legal hypotheses or party allegations, not established facts. The underlying dated agency action may be recorded as a procedural event only when tied to an authoritative notice, order, ledger, or service record.

### HPD conclusions

Statements asserting retaliation, collusion, evidence destruction, false reporting, or failure to investigate by HPD remain allegations, risk hypotheses, or unresolved verification tasks. They must not appear in a stable profile as established agency conduct.

### Brower conclusions

Statements asserting that opposing counsel orchestrated blank judicial orders, engaged in ex parte communication, committed fraud, or participated in a RICO enterprise remain party allegations, inferences, or legal hypotheses unless independently corroborated by operative records.

### Shaw and other judicial conclusions

Statements asserting a pattern of defaults, bias, procedural obstruction, or judicial misconduct remain disputed allegations or legal hypotheses until each dated event is tied to an operative order, minutes, transcript, docket metadata, and controlling procedural authority.

### Cyber attribution

Statements attributing network activity, infrastructure, compromise, evidence tampering, or intrusion to a named legal actor are quarantined hypotheses unless supported by authenticated technical artifacts, documented chain of custody, independent expert analysis, and a non-speculative attribution method.

## Runtime behavior

- Stable-profile generation must exclude quarantined claims.
- Retrieval may return the original memory only with an explicit `superseded`, `disputed`, `unverified`, or `legal_hypothesis` label.
- New summaries must prefer the replacement statement over the legacy statement.
- No legacy allegation may be promoted because it appears repeatedly across generated documents.
- Corrections are append-only; source history is preserved unless deletion is required for secrets, credentials, protected-minor identifiers, or privacy obligations.

## Adapter action pending

When the CASEBRAIN memory adapter is available, execute the following bounded sequence:

1. locate the exact legacy memory IDs;
2. mark each as superseded or quarantined;
3. save the replacement statements from this manifest;
4. run exact-topic recall tests;
5. confirm the stable profile no longer presents the legacy conclusions as facts;
6. preserve a dated correction receipt.

On 2026-07-16, five correction overlays were written and recall-verified through topic-specific containers. A first pass using one shared container tag failed isolation by returning unrelated correction topics; the design now forbids shared correction tags. Exact forget attempts could not remove the first-pass copies because the backend exposed them as document chunks rather than exactly forgettable memory records. GitHub remains canonical for this decision and `MEMORY_QUARANTINE_REGISTRY.json` records the runtime receipts and remaining cleanup gate.
