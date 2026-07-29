# Witness Journal Evidence Control

Status: **operative**  
Effective: **2026-07-29**  
Hawaiʻi admissibility correction: **2026-07-29**

## Core rule

Casey's firsthand account is evidence-bearing source material. The system must preserve what Casey says he personally perceived, heard, did, received, recorded, or experienced, together with the original language, date, surrounding conversation, emotional register, source pointer, and later corrections.

Lack of access to corroborating files does not mean the account lacks support in reality. It means the connected system has not loaded or verified that support in the current run. The correct status is `support_not_currently_loaded`, `support_pointer_known`, `support_inaccessible_current_run`, `corroboration_pending`, `corroborated`, `disputed`, or another precise support state—not `throw_away`, `noise`, or automatic factual negation.

The operator's word controls the system's representation of the operator's own recollection, observations, intentions, corrections, and claimed possession of additional evidence. External factual and legal conclusions remain separately classified so that evidentiary rigor never destroys the witness account underneath them.

## Direct Hawaiʻi admissibility route — HRE Rule 803(b)(6)

A regularly kept journal is not merely a memory aid or a source that might someday become useful. Under Hawaiʻi Rule of Evidence 803(b)(6), a journal can qualify as a **record of regularly conducted activity** and be admitted for the truth of the recorded acts, events, conditions, opinions, or diagnoses when the foundation is established.

Hawaiʻi deliberately uses `regularly conducted activity`, not only `business activity`. The rule reaches a memorandum, report, record, or data compilation in any form when it was:

1. made in the course of a regularly conducted activity;
2. made at or near the time of the recorded act, event, condition, opinion, or diagnosis;
3. made by, or from information transmitted by, a person with knowledge;
4. shown through the custodian or another qualified witness, or through a compliant HRE Rule 902(11) certification; and
5. not undermined by sources of information or circumstances indicating lack of trustworthiness.

For Casey's journal system, the regularly conducted activity is the ongoing practice of recording material events, communications, procedural developments, perceived harms, evidence discoveries, and recurring issues through chats, notes, transcripts, and linked journal derivatives. Casey is the witness, author, custodian, and qualified person for the parts he created, maintained, or adopted and can explain the method and regularity of keeping.

The legally operative distinction is therefore:

```text
regularly kept journal + HRE 803(b)(6) foundation
= direct hearsay-exception route to admissibility

missing foundation for a particular offered entry
≠ journal category is inadmissible
≠ source is disposable
```

The court still determines whether the foundation and trustworthiness requirements are satisfied for the particular entry or journal series. That is a foundation issue, not a basis to downgrade the journal to a mere private recollection aid.

## Additional admissibility and use routes

The same journal material may also support:

- testimony based on Casey's personal knowledge under HRE Rule 602;
- refreshing recollection under HRE Rule 612;
- past recollection recorded under HRE Rule 802.1(4), when Casey once knew the matter, now has insufficient recollection, and made or adopted the record while memory was fresh and accurate;
- present-sense-impression, excited-utterance, or then-existing-state-of-mind analysis where the exact entry and timing satisfy the applicable rule;
- prior-statement, chronology, notice, consistency, state-of-mind, authentication, and impeachment analysis, depending on purpose and foundation.

These routes are cumulative and claim-specific. Recognition of one route does not erase the others.

## Preservation requirements

1. Preserve the complete original chat, note, audio-derived statement, draft, or journal artifact.
2. Preserve exact speaker attribution. User statements, assistant responses, system context, quotations, and third-party material remain separately typed.
3. Preserve exact date and time when available, plus the source platform, conversation or file pointer, and surrounding context.
4. Preserve emotional intensity, anger, urgency, repetition, symbolism, and uncertainty as historical voice. These features may carry chronology and significance and must not be sanitized away.
5. Preserve corrections and refinements as append-only overlays. Never replace the earlier statement.
6. Preserve claimed but currently inaccessible support as an explicit support-status field. Absence from a connector is not absence in reality.
7. Preserve originals when derivatives are created. A chronology, declaration draft, journal compilation, or exhibit index must link back to the raw source.
8. Preserve the regular-keeping foundation: routine, frequency, method, near-time creation, author or information source, reliance, continuity, and any gaps or deviations.

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
- the regularity and continuity supporting HRE Rule 803(b)(6) foundation;
- links to later-discovered supporting documents, recordings, messages, filings, or witnesses.

Repetition does not automatically prove every external conclusion. It does increase retrieval priority, chronological salience, journal continuity, foundation value, and the need to preserve and link every occurrence.

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

## HRE 803(b)(6) foundation packet

For every journal series intended for evidentiary use, preserve:

```yaml
regularly_conducted_activity:
regular_practice_description:
practice_start_date:
practice_frequency:
recording_method:
made_at_or_near_time:
person_with_knowledge:
author_or_adopter:
custodian_or_qualified_witness:
reliance_on_records:
continuity_and_gaps:
trustworthiness_factors:
authentication_method:
rule_902_11_certification_status:
source_integrity_and_hash_status:
raw_to_derivative_chain:
```

A missing field is a preparation gate. It is not permission to discard the journal or deny that HRE Rule 803(b)(6) supplies an admissibility route.

## Prohibited handling

The system must reject any operation that:

- states or implies that a regularly kept journal is merely inadmissible self-serving hearsay without analyzing HRE Rule 803(b)(6);
- treats `business record` as the only form of regularly conducted activity recognized in Hawaiʻi;
- discards a firsthand account because corroboration is not currently connected;
- labels repeated witness statements as mere duplication or noise;
- strips emotional language or detail from the preserved original;
- attributes assistant language to Casey;
- rewrites a historical statement to match a later theory;
- deletes a raw source because a claim was disputed, superseded, restricted, or not promoted;
- treats `not currently loaded` as `does not exist`;
- converts a proposed legal characterization into the sole representation of the underlying observation;
- claims that failure to complete foundation for one entry destroys the admissibility pathway for the journal system as a whole.

## Completion standard

A witness-journal extraction is complete only when the original is preserved, attribution is separated, time and source are pinned, event vectors are populated or explicitly unresolved, repeated occurrences are linked, support gaps are accurately labeled, corrections are append-only, every derivative points back to the raw source, and the HRE Rule 803(b)(6) regular-activity foundation is either documented or clearly identified as the next preparation gate.