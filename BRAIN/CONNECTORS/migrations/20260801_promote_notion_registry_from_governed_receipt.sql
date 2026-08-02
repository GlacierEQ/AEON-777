-- MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51
-- Evidence-backed Notion connector registry promotion.
-- This migration awards no connector-quality or data-quality points and approves no roots.

begin;

update public.connector_registry_v2
set lifecycle_state = 'connected',
    authentication_state = 'authenticated',
    canonical_source_ref = 'github://GlacierEQ/AEON-777@b7e30fb3259f08a8da3b0f7a39c8043eebf68873/BRAIN/CONNECTORS/receipts/GOVERNED_NOTION_READ_2026-08-01.json',
    last_successful_probe_at = timestamptz '2026-08-02T04:05:23.818190Z',
    last_successful_probe_receipt_ref = 'connector-read:sha256:7da98b94ec0ff3a305f9c151774cc8613dcc9ba8e22f16fe630eef21ff11246a',
    freshness_status = 'fresh',
    provenance_coverage = jsonb_build_object(
      'status', 'partial',
      'covered_fields', jsonb_build_array(
        'job_id',
        'route_key',
        'request_sha256',
        'response_sha256',
        'rpc_units',
        'projection_state',
        'notion_sync_state'
      ),
      'receipt_ref',
      'github://GlacierEQ/AEON-777@b7e30fb3259f08a8da3b0f7a39c8043eebf68873/BRAIN/CONNECTORS/receipts/GOVERNED_NOTION_READ_2026-08-01.json'
    ),
    error_state = jsonb_build_object(
      'status', 'none',
      'code', null,
      'observed_at', '2026-08-02T04:05:23.818190Z',
      'receipt_ref',
      'connector-read:sha256:7da98b94ec0ff3a305f9c151774cc8613dcc9ba8e22f16fe630eef21ff11246a'
    ),
    next_human_gate = 'assign_owner_and_approve_exact_notion_roots',
    updated_at = greatest(updated_at, timestamptz '2026-08-02T04:05:23.818190Z')
where connector_key = 'notion';

do $$
begin
  if not exists (
    select 1 from public.connector_registry_v2
    where connector_key = 'notion'
      and lifecycle_state = 'connected'
      and authentication_state = 'authenticated'
      and canonical_source_ref like 'github://GlacierEQ/AEON-777@b7e30fb%'
      and last_successful_probe_receipt_ref =
        'connector-read:sha256:7da98b94ec0ff3a305f9c151774cc8613dcc9ba8e22f16fe630eef21ff11246a'
      and jsonb_array_length(approved_roots) = 0
      and owner = 'unassigned'
      and (connector_quality ->> 'score')::numeric = 0
      and (data_quality ->> 'score')::numeric = 0
  ) then
    raise exception 'Notion governance promotion or conservative boundary missing';
  end if;
end
$$;

commit;
