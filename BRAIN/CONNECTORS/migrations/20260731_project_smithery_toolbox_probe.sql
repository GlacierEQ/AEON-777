-- MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51
-- Safe, metadata-only Smithery toolbox probe projection.
-- No setup URLs, tokens, account identifiers, connector payloads, or source bytes are persisted.

begin;

update public.connector_registry_v2
set lifecycle_state = 'connected',
    updated_at = greatest(updated_at, timestamptz '2026-08-01T04:04:04.7399Z')
where connector_key in (
  'dropbox',
  'github',
  'gmail',
  'google_drive',
  'notion',
  'outlook',
  'smithery'
);

update public.connector_registry_v2
set authentication_state = 'authenticated',
    last_successful_probe_at = timestamptz '2026-08-01T04:04:04.7399Z',
    last_successful_probe_receipt_ref =
      'smithery-toolbox-status:sha256:62098c0eee12e46a9bb84ae2a4e9654ffd3f63aa846bac6c545f1b942bacbdef',
    freshness_status = 'fresh',
    provenance_coverage = jsonb_build_object(
      'status', 'partial',
      'covered_fields', jsonb_build_array(
        'toolbox_total',
        'connection_state_counts',
        'probe_timestamp'
      ),
      'receipt_ref',
      'smithery-toolbox-status:sha256:62098c0eee12e46a9bb84ae2a4e9654ffd3f63aa846bac6c545f1b942bacbdef'
    ),
    error_state = jsonb_build_object(
      'status', 'none',
      'code', null,
      'observed_at', '2026-08-01T04:04:04.7399Z',
      'receipt_ref',
      'smithery-toolbox-status:sha256:62098c0eee12e46a9bb84ae2a4e9654ffd3f63aa846bac6c545f1b942bacbdef'
    ),
    next_human_gate = 'assign_owner_and_approve_execution_namespaces',
    updated_at = greatest(updated_at, timestamptz '2026-08-01T04:04:04.7399Z')
where connector_key = 'smithery';

do $$
begin
  if (select count(*) from public.connector_registry_v2
      where connector_key in ('dropbox','github','gmail','google_drive','notion','outlook','smithery')
        and lifecycle_state = 'connected') <> 7 then
    raise exception 'expected seven evidence-linked connected lifecycle records';
  end if;

  if not exists (
    select 1
    from public.connector_registry_v2
    where connector_key = 'smithery'
      and authentication_state = 'authenticated'
      and last_successful_probe_receipt_ref =
        'smithery-toolbox-status:sha256:62098c0eee12e46a9bb84ae2a4e9654ffd3f63aa846bac6c545f1b942bacbdef'
      and (connector_quality ->> 'score')::numeric = 0
      and (data_quality ->> 'score')::numeric = 0
  ) then
    raise exception 'Smithery probe receipt or conservative quality boundary missing';
  end if;

  if exists (
    select 1
    from public.connector_registry_v2
    where connector_key in ('dropbox','github','google_drive','notion','outlook')
      and authentication_state <> 'unknown'
  ) then
    raise exception 'downstream authentication must remain unknown without a tool-level probe';
  end if;
end
$$;

commit;
