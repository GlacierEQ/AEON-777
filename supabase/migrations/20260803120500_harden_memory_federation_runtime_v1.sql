-- Explicit client deny policies and complete federation FK indexing.
-- Thread: MEMORY_ARCHITECTURE__CASEBUILDER_4000__APEX_MEMORY_NEXUS__PR_51

do $$
declare t text;
begin
  foreach t in array array[
    'memory_federation_backends_v1','memory_federation_objects_v1','memory_federation_bindings_v1',
    'memory_federation_sync_events_v1','memory_federation_conflicts_v1','memory_federation_tombstones_v1'
  ] loop
    execute format('drop policy if exists memory_federation_client_deny_all on public.%I',t);
    execute format('create policy memory_federation_client_deny_all on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',t);
  end loop;
end $$;

drop index if exists public.memory_federation_binding_memory_idx;
drop index if exists public.memory_federation_object_namespace_idx;

create index if not exists memory_federation_conflicts_v1_left_backend_idx on public.memory_federation_conflicts_v1(left_backend_key);
create index if not exists memory_federation_conflicts_v1_right_backend_idx on public.memory_federation_conflicts_v1(right_backend_key);
create index if not exists memory_federation_objects_v1_supersedes_idx on public.memory_federation_objects_v1(supersedes) where supersedes is not null;
create index if not exists memory_federation_objects_v1_superseded_by_idx on public.memory_federation_objects_v1(superseded_by) where superseded_by is not null;
create index if not exists memory_federation_sync_events_v1_memory_idx on public.memory_federation_sync_events_v1(memory_id,event_id);
create index if not exists memory_federation_sync_events_v1_source_backend_idx on public.memory_federation_sync_events_v1(source_backend_key,event_id);
create index if not exists memory_federation_sync_events_v1_target_backend_idx on public.memory_federation_sync_events_v1(target_backend_key,event_id);

do $$
begin
  if exists(select 1 from information_schema.role_table_grants where table_schema='public' and table_name like 'memory_federation_%_v1' and grantee in ('anon','authenticated'))
  then raise exception 'memory_federation_client_grant_detected'; end if;
  if (select count(*) from pg_policies where schemaname='public' and tablename like 'memory_federation_%_v1' and policyname='memory_federation_client_deny_all')<>6
  then raise exception 'memory_federation_deny_policy_count_invalid'; end if;
end $$;
