-- Memory federation runtime hardening and adapter routing.
-- Thread: MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51

create extension if not exists pgcrypto;

create table if not exists public.memory_federation_backends_v1 (
  backend_key text primary key,
  display_name text not null,
  backend_class text not null check (backend_class in ('canonical_relational','evidence_graph','human_notes','semantic_memory','episodic_memory','vector_index','portable_profile','source_store')),
  authority_rank smallint not null check (authority_rank between 1 and 100),
  lifecycle_state text not null default 'staging_only' check (lifecycle_state in ('connected','staging_only','blocked','projection_only','excluded','unknown')),
  authentication_state text not null default 'unknown' check (authentication_state in ('authenticated','auth_required','blocked','unknown')),
  write_mode text not null default 'blocked' check (write_mode in ('canonical','projection','portable_projection','read_only','blocked')),
  sensitivity_ceiling text not null default 'internal' check (sensitivity_ceiling in ('public','internal','confidential','restricted','sealed')),
  supports_delete boolean not null default false,
  supports_vector boolean not null default false,
  supports_metadata_filters boolean not null default false,
  rebuildable boolean not null default false,
  approved_namespaces jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_namespaces)='array'),
  owner text not null default 'unassigned',
  config_ref text,
  last_successful_probe_at timestamptz,
  freshness_status text not null default 'unknown' check (freshness_status in ('fresh','stale','expired','unknown')),
  error_state jsonb not null default '{"status":"unknown","code":null}'::jsonb check (jsonb_typeof(error_state)='object'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_federation_objects_v1 (
  memory_id uuid primary key default gen_random_uuid(),
  namespace text not null,
  memory_type text not null check (memory_type in ('profile','preference','episodic','semantic','document_pointer','claim','event','actor','relationship','work_product','system_control','tombstone')),
  safe_summary text,
  canonical_payload_ref text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  source_system text not null,
  source_object_id text not null,
  source_version text,
  source_hash text check (source_hash is null or source_hash ~ '^[0-9a-f]{64}$'),
  provenance_class text not null check (provenance_class in ('original_source','verified_extraction','documented_source_statement','party_allegation','third_party_statement','model_inference','operator_directive','system_observation','unresolved')),
  verification_status text not null default 'unverified' check (verification_status in ('verified','partially_verified','unverified','rejected','superseded')),
  confidence numeric check (confidence is null or confidence between 0 and 1),
  sensitivity text not null default 'internal' check (sensitivity in ('public','internal','confidential','restricted','sealed')),
  retention_policy text not null default 'retain_until_review',
  canonical_status text not null default 'active' check (canonical_status in ('active','superseded','tombstoned','quarantined')),
  supersedes uuid references public.memory_federation_objects_v1(memory_id),
  superseded_by uuid references public.memory_federation_objects_v1(memory_id),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(namespace, source_system, source_object_id, content_hash)
);

create table if not exists public.memory_federation_bindings_v1 (
  binding_id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memory_federation_objects_v1(memory_id) on delete restrict,
  backend_key text not null references public.memory_federation_backends_v1(backend_key) on delete restrict,
  external_object_id text not null,
  external_version text,
  external_hash text check (external_hash is null or external_hash ~ '^[0-9a-f]{64}$'),
  projection_status text not null default 'pending' check (projection_status in ('pending','synced','stale','failed','blocked','deleted','unknown')),
  last_synced_at timestamptz,
  last_verified_at timestamptz,
  last_error jsonb not null default '{"status":"none","code":null}'::jsonb check (jsonb_typeof(last_error)='object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(memory_id, backend_key),
  unique(backend_key, external_object_id)
);

create table if not exists public.memory_federation_sync_events_v1 (
  event_id bigint generated by default as identity primary key,
  idempotency_key text not null unique check (idempotency_key ~ '^[0-9a-f]{64}$'),
  memory_id uuid not null references public.memory_federation_objects_v1(memory_id) on delete restrict,
  source_backend_key text not null references public.memory_federation_backends_v1(backend_key) on delete restrict,
  target_backend_key text not null references public.memory_federation_backends_v1(backend_key) on delete restrict,
  operation text not null check (operation in ('create','update','supersede','tombstone','delete_request','delete_verify','reindex','reconcile')),
  status text not null default 'pending' check (status in ('pending','claimed','succeeded','failed','blocked','ambiguous')),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  run_after timestamptz not null default now(),
  lease_owner text,
  lease_expires_at timestamptz,
  result_hash text check (result_hash is null or result_hash ~ '^[0-9a-f]{64}$'),
  error_state jsonb not null default '{"status":"none","code":null}'::jsonb check (jsonb_typeof(error_state)='object'),
  receipt_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (source_backend_key <> target_backend_key)
);

create table if not exists public.memory_federation_conflicts_v1 (
  conflict_id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memory_federation_objects_v1(memory_id) on delete restrict,
  left_backend_key text not null references public.memory_federation_backends_v1(backend_key) on delete restrict,
  right_backend_key text not null references public.memory_federation_backends_v1(backend_key) on delete restrict,
  left_hash text not null check (left_hash ~ '^[0-9a-f]{64}$'),
  right_hash text not null check (right_hash ~ '^[0-9a-f]{64}$'),
  resolution_status text not null default 'open' check (resolution_status in ('open','resolved','quarantined','superseded')),
  winning_authority text,
  resolution_reason text,
  resolution_receipt_ref text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (left_backend_key <> right_backend_key)
);

create table if not exists public.memory_federation_tombstones_v1 (
  tombstone_id uuid primary key default gen_random_uuid(),
  memory_id uuid not null unique references public.memory_federation_objects_v1(memory_id) on delete restrict,
  namespace text not null,
  reason text not null,
  logical_tombstone_at timestamptz not null default now(),
  authorization_ref text,
  physical_delete_required boolean not null default false,
  physical_delete_status text not null default 'not_requested' check (physical_delete_status in ('not_requested','pending','partial','complete','blocked','failed')),
  backend_receipts jsonb not null default '[]'::jsonb check (jsonb_typeof(backend_receipts)='array'),
  negative_recall_verified_at timestamptz,
  closure_status text not null default 'open' check (closure_status in ('open','closed','blocked')),
  closed_at timestamptz
);

create index if not exists memory_federation_sync_claim_idx on public.memory_federation_sync_events_v1(status, run_after, event_id) where status in ('pending','failed','claimed');
create index if not exists memory_federation_binding_memory_idx on public.memory_federation_bindings_v1(memory_id, projection_status);
create index if not exists memory_federation_object_namespace_idx on public.memory_federation_objects_v1(namespace, canonical_status, updated_at desc);

alter table public.memory_federation_backends_v1 enable row level security;
alter table public.memory_federation_objects_v1 enable row level security;
alter table public.memory_federation_bindings_v1 enable row level security;
alter table public.memory_federation_sync_events_v1 enable row level security;
alter table public.memory_federation_conflicts_v1 enable row level security;
alter table public.memory_federation_tombstones_v1 enable row level security;

revoke all on public.memory_federation_backends_v1 from anon, authenticated;
revoke all on public.memory_federation_objects_v1 from anon, authenticated;
revoke all on public.memory_federation_bindings_v1 from anon, authenticated;
revoke all on public.memory_federation_sync_events_v1 from anon, authenticated;
revoke all on public.memory_federation_conflicts_v1 from anon, authenticated;
revoke all on public.memory_federation_tombstones_v1 from anon, authenticated;

insert into public.memory_federation_backends_v1
  (backend_key, display_name, backend_class, authority_rank, lifecycle_state, authentication_state, write_mode, sensitivity_ceiling, supports_delete, supports_vector, supports_metadata_filters, rebuildable, approved_namespaces, owner, config_ref, freshness_status, error_state, metadata)
values
  ('approved_source_bytes','Approved Source Bytes','source_store',1,'connected','authenticated','canonical','sealed',false,false,true,false,'[]'::jsonb,'casey','policy://approved-source-roots','unknown','{"status":"unknown","code":null}'::jsonb,'{"role":"highest_authority"}'::jsonb),
  ('github','GitHub Canonical Memory Architecture','canonical_relational',2,'connected','authenticated','canonical','internal',true,false,true,false,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','github://GlacierEQ/AEON-777','fresh','{"status":"none","code":null}'::jsonb,'{"role":"schemas_policies_validators_receipts"}'::jsonb),
  ('supabase','Supabase Memory Federation Control Plane','canonical_relational',3,'connected','authenticated','canonical','restricted',true,true,true,false,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','supabase://dyhprklicgewmrimecey','fresh','{"status":"none","code":null}'::jsonb,'{"role":"registry_identity_sync_conflicts_tombstones"}'::jsonb),
  ('casebrain','CASEBRAIN','evidence_graph',4,'blocked','authenticated','projection','restricted',true,true,true,false,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','adapter://casebrain-tool-bridge','unknown','{"status":"blocked","code":"bridge_url_unconfigured"}'::jsonb,'{"required_env":["CASEBRAIN_BRIDGE_URL","CASEBRAIN_BRIDGE_TOKEN"]}'::jsonb),
  ('mem','Mem','human_notes',5,'connected','authenticated','projection','confidential',true,true,true,false,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','mem://collection/3bbff416-1307-5add-9d07-ce4996d552c8','fresh','{"status":"none","code":null}'::jsonb,'{"role":"human_readable_notes_and_semantic_retrieval","required_env":["MEM_BRIDGE_URL","MEM_BRIDGE_TOKEN"]}'::jsonb),
  ('supermemory','Supermemory','semantic_memory',6,'staging_only','auth_required','projection','internal',true,true,true,false,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','adapter://supermemory-v3','unknown','{"status":"blocked","code":"credential_required"}'::jsonb,'{"base_url":"https://api.supermemory.ai/v3","required_env":["SUPERMEMORY_API_KEY"]}'::jsonb),
  ('mem0','Mem0','episodic_memory',7,'staging_only','auth_required','projection','internal',true,true,true,false,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','adapter://mem0-v3','unknown','{"status":"blocked","code":"credential_required"}'::jsonb,'{"base_url":"https://api.mem0.ai/v3","required_env":["MEM0_API_KEY","MEM0_USER_ID"]}'::jsonb),
  ('pinecone','Pinecone','vector_index',8,'projection_only','auth_required','projection','confidential',true,true,true,true,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','adapter://pinecone-2026-04','unknown','{"status":"blocked","code":"credential_and_index_host_required"}'::jsonb,'{"required_env":["PINECONE_API_KEY","PINECONE_INDEX_HOST"],"api_version":"2026-04","truth_authority":false}'::jsonb),
  ('qdrant','Qdrant','vector_index',8,'projection_only','auth_required','projection','restricted',true,true,true,true,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','adapter://qdrant-rest','unknown','{"status":"blocked","code":"url_and_collection_required"}'::jsonb,'{"required_env":["QDRANT_URL","QDRANT_COLLECTION"],"optional_env":["QDRANT_API_KEY"],"truth_authority":false}'::jsonb),
  ('memoryplugin','MemoryPlugin','portable_profile',9,'connected','authenticated','portable_projection','internal',true,false,false,true,'["MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51"]'::jsonb,'casey','memoryplugin://visible-response-pattern','fresh','{"status":"none","code":null}'::jsonb,'{"role":"compact_portable_profile_only","manual_projection":true}'::jsonb)
on conflict (backend_key) do update set
  display_name=excluded.display_name, backend_class=excluded.backend_class, authority_rank=excluded.authority_rank,
  lifecycle_state=excluded.lifecycle_state, authentication_state=excluded.authentication_state,
  write_mode=excluded.write_mode, sensitivity_ceiling=excluded.sensitivity_ceiling,
  supports_delete=excluded.supports_delete, supports_vector=excluded.supports_vector,
  supports_metadata_filters=excluded.supports_metadata_filters, rebuildable=excluded.rebuildable,
  approved_namespaces=excluded.approved_namespaces, owner=excluded.owner, config_ref=excluded.config_ref,
  freshness_status=excluded.freshness_status, error_state=excluded.error_state, metadata=excluded.metadata, updated_at=now();

create or replace function public.claim_memory_federation_event_v1(p_event_id bigint,p_worker_id text,p_lease_seconds integer default 60)
returns setof public.memory_federation_sync_events_v1 language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_worker_id is null or btrim(p_worker_id)='' then raise exception 'worker_id_required'; end if;
  if p_lease_seconds<10 or p_lease_seconds>900 then raise exception 'lease_seconds_out_of_range'; end if;
  return query update public.memory_federation_sync_events_v1 e
    set status='claimed',lease_owner=p_worker_id,lease_expires_at=now()+make_interval(secs=>p_lease_seconds),attempt_count=e.attempt_count+1,updated_at=now(),error_state='{"status":"none","code":null}'::jsonb
    where e.event_id=p_event_id and e.attempt_count<e.max_attempts and e.run_after<=now()
      and (e.status in ('pending','failed') or (e.status='claimed' and e.lease_expires_at<now()))
    returning e.*;
end; $$;

create or replace function public.finalize_memory_federation_event_v1(
  p_event_id bigint,p_worker_id text,p_status text,p_external_object_id text default null,p_external_version text default null,
  p_external_hash text default null,p_result_hash text default null,p_receipt_ref text default null,
  p_error_state jsonb default '{"status":"none","code":null}'::jsonb,p_binding_metadata jsonb default '{}'::jsonb)
returns setof public.memory_federation_sync_events_v1 language plpgsql security definer set search_path=public,pg_temp as $$
declare v_event public.memory_federation_sync_events_v1%rowtype;
begin
  if p_status not in ('succeeded','failed','blocked','ambiguous') then raise exception 'invalid_terminal_status'; end if;
  if jsonb_typeof(coalesce(p_error_state,'{}'::jsonb))<>'object' then raise exception 'error_state_must_be_object'; end if;
  if jsonb_typeof(coalesce(p_binding_metadata,'{}'::jsonb))<>'object' then raise exception 'binding_metadata_must_be_object'; end if;
  select * into v_event from public.memory_federation_sync_events_v1 where event_id=p_event_id for update;
  if not found then raise exception 'event_not_found'; end if;
  if v_event.status<>'claimed' then raise exception 'event_not_claimed'; end if;
  if v_event.lease_owner is distinct from p_worker_id then raise exception 'lease_owner_mismatch'; end if;
  if p_status='succeeded' then
    if p_external_object_id is null or btrim(p_external_object_id)='' then raise exception 'external_object_id_required'; end if;
    if p_external_hash is null or p_external_hash!~'^[0-9a-f]{64}$' then raise exception 'external_hash_required'; end if;
    insert into public.memory_federation_bindings_v1(memory_id,backend_key,external_object_id,external_version,external_hash,projection_status,last_synced_at,last_verified_at,last_error,metadata,updated_at)
    values(v_event.memory_id,v_event.target_backend_key,p_external_object_id,p_external_version,p_external_hash,'synced',now(),now(),'{"status":"none","code":null}'::jsonb,coalesce(p_binding_metadata,'{}'::jsonb),now())
    on conflict(memory_id,backend_key) do update set external_object_id=excluded.external_object_id,external_version=excluded.external_version,external_hash=excluded.external_hash,
      projection_status='synced',last_synced_at=now(),last_verified_at=now(),last_error='{"status":"none","code":null}'::jsonb,metadata=excluded.metadata,updated_at=now();
  end if;
  return query update public.memory_federation_sync_events_v1 e set status=p_status,lease_owner=null,lease_expires_at=null,result_hash=p_result_hash,
    error_state=coalesce(p_error_state,'{}'::jsonb),receipt_ref=p_receipt_ref,completed_at=now(),updated_at=now() where e.event_id=p_event_id returning e.*;
end; $$;

revoke all on function public.claim_memory_federation_event_v1(bigint,text,integer) from public,anon,authenticated;
revoke all on function public.finalize_memory_federation_event_v1(bigint,text,text,text,text,text,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.claim_memory_federation_event_v1(bigint,text,integer) to service_role;
grant execute on function public.finalize_memory_federation_event_v1(bigint,text,text,text,text,text,text,text,jsonb,jsonb) to service_role;

do $$ begin
  if exists(select 1 from public.memory_federation_backends_v1 where backend_key='memoryplugin' and sensitivity_ceiling not in ('public','internal')) then raise exception 'memoryplugin_sensitivity_ceiling_invalid'; end if;
  if exists(select 1 from public.memory_federation_backends_v1 where backend_key in ('pinecone','qdrant') and (rebuildable is not true or write_mode='canonical')) then raise exception 'vector_backend_authority_invalid'; end if;
end $$;
