# Witness Journal Evidence Control

Status: **operative**  
Effective: **2026-07-29**

## Core rule

Casey's firsthand account is evidence-bearing source material. The system must preserve what Casey says he personally perceived, heard, did, received, recorded, or experienced, together with the original language, date, surrounding conversation, emotional register, source pointer, and later corrections.

Lack of access to corroborating files does not mean the account lacks support in reality. It means the connected system has not loaded or verified that support in the current run. The correct status is `support_not_currently_loaded`, `support_pointer_known`, `support_inaccessible_current_run`, `corroboration_pending`, `corroborated`, `disputed`, or another precise support state—not `throw_away`, `noise`, or automatic factual negation.

The operator's word controls the system's representation of the operator's own recollection, observations, intentions, corrections, and claimed possession of additional evidence. External factual and legal conclusions remain separately classified so that evidentiary rigor never destroys the witness account underneath them.

## Preservation requirements

1. Preserve the complete original chat, note, audio-derived statement, draft, or journal artifact.
2. Preserve exact speaker attribution. User statements, assistant responses, system context, quotations, and third-party material remain separately typed.
3. Preserve exact date and time when available, plus the source platform, conversation or file pointer, and surrounding context.
4. Preserve emotional intensity, anger, urgency, repetition, symbolism, and uncertainty as historical voice. These features may carry chronology and significance and must not be sanitized away.
5. Preserve corrections and refinements as append-only overlays. Never replace the earlier statement.
6. Preserve claimed but currently inaccessible support as an explicit support-status field. Absence from a connector is not absence in reality.
7. Preserve originals when derivatives are created. A chronology, declaration draft, journal compilation, or exhibit index must link back to the raw source.

## Witness and claim separation

A single passage may contain multiple layers:

- `first_person_observation` — what Casey personally perceived or experienced;
- `contemporaneous_journal_entry` — an in-the-moment or regularly maintained account;
- `party_allegation` — a claimed act or responsibility attributed to another person or institution;
- `lay_inference` — a conclusion rationally drawn from Casey's perception;
- `legal_characterization` — a proposed legal effect or doctrine;
- `model_analysis` — assistant reasoning or generated synthesis;
- `third_party_statement` — words attributed to someone else;
- `unresolved` — a point requiring further source or context.

The system must not discard the first-person observation because the allegation, inference, legal characterization, or assistant analysis remains disputed or unverified.

## Repetition and longitudinal journal value

Repeated statements across contemporaneous chats do not receive zero weight. They create structured evidence about:

- persistence and continuity of the reported issue;
- when the concern first appeared and how long it continued;
- consistency, evolution, or correction of the account;
- contemporaneous state of mind and urgency;
- notice given to the assistant or system;
- the regular practice of recording events and concerns;
- links to later-discovered supporting documents, recordings, messages, filings, or witnesses.

Repetition does not automatically prove every external conclusion. It does increase retrieval priority, chronological salience, journal continuity, and the need to preserve and link every occurrence.

## Required event vectors

Each journal or witness entry should support these vectors when available:

```yaml
who:
what:
when:
where:
communication_channel:
institution_or_system:
procedural_stage:
related_document_or_recording:
action_or_omission:
consequence_or_harm:
evidence_type:
support_status:
later_corroboration_pointer:
contradiction_pointer:
```

Unknown vectors remain `unknown` or `not_currently_loaded`; they are never invented.

## Repetition-series metadata

```yaml
journal_series_id:
occurrence_index:
occurrence_count:
first_seen_at:
last_seen_at:
cross_chat_consistency:
material_evolution:
correction_overlay_pointer:
salience: elevated
```

When the same material issue appears in several chats, the system must create or update a longitudinal thread rather than treating each occurrence as redundant clutter.

## Evidence-use boundary

This control preserves and classifies evidence; it does not declare automatic courtroom admissibility. A firsthand account may support testimony based on personal knowledge. A writing may refresh recollection, may qualify as a recorded recollection under the applicable foundation, may support prior-statement analysis, or may serve other evidentiary purposes depending on authentication, hearsay rules, purpose, and the exact record.

The system must therefore retain:

- original source and timestamps;
- speaker identity and authorship;
- whether the entry was contemporaneous;
- whether it was made or adopted while memory was fresh;
- whether Casey can testify to its accuracy and regular keeping;
- whether it was changed later;
- the complete chain from raw chat to journal derivative.

## Prohibited handling

The system must reject any operation that:

- discards a firsthand account because corroboration is not currently connected;
- labels repeated witness statements as mere duplication or noise;
- strips emotional language or detail from the preserved original;
- attributes assistant language to Casey;
- rewrites a historical statement to match a later theory;
- deletes a raw source because a claim was disputed, superseded, restricted, or not promoted;
- treats `not currently loaded` as `does not exist`;
- converts a proposed legal characterization into the sole representation of the underlying observation.

## Completion standard

A witness-journal extraction is complete only when the original is preserved, attribution is separated, time and source are pinned, event vectors are populated or explicitly unresolved, repeated occurrences are linked, support gaps are accurately labeled, corrections are append-only, and every derivative points back to the raw source.