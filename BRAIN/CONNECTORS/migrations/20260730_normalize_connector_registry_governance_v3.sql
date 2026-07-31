
begin;

alter table public.connector_registry_v2
  add column if not exists lifecycle_state text not null default 'staging_only',
  add column if not exists authentication_state text not null default 'unknown',
  add column if not exists canonical_source_ref text,
  add column if not exists approved_roots jsonb not null default '[]'::jsonb,
  add column if not exists sensitivity_ceiling text not null default 'unknown',
  add column if not exists read_write_mode text generated always as (
    case
      when read_enabled and write_enabled then 'read_write'
      when read_enabled then 'read_only'
      when write_enabled then 'write_only'
      else 'none'
    end
  ) stored,
  add column if not exists last_successful_probe_at timestamptz,
  add column if not exists last_successful_probe_receipt_ref text,
  add column if not exists freshness_status text not null default 'unknown',
  add column if not exists freshness_sla_seconds integer,
  add column if not exists provenance_coverage jsonb not null default
    '{"status":"unknown","covered_fields":[],"receipt_ref":null}'::jsonb,
  add column if not exists idempotency_strategy jsonb not null default
    '{"status":"unknown","expression":null,"receipt_ref":null}'::jsonb,
  add column if not exists error_state jsonb not null default
    '{"status":"unknown","code":null,"observed_at":null,"receipt_ref":null}'::jsonb,
  add column if not exists owner text not null default 'unassigned',
  add column if not exists next_human_gate text not null default
    'classify_connector_assign_owner_and_approve_roots',
  add column if not exists connector_quality jsonb not null default
    '{"score":0,"status":"unknown","evidence":[]}'::jsonb,
  add column if not exists data_quality jsonb not null default
    '{"score":0,"status":"unknown","dimensions":{"completeness":null,"uniqueness":null,"validity":null,"consistency":null,"lineage":null,"timeliness":null,"duplicate_risk":null},"evidence":[]}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_lifecycle_state_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_lifecycle_state_check
      check (lifecycle_state in ('advertised','connected','blocked','staging_only','projection_only','excluded')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_authentication_state_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_authentication_state_check
      check (authentication_state in ('unknown','unauthenticated','auth_required','configuring','authenticated','error')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_sensitivity_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_sensitivity_check
      check (sensitivity_ceiling in ('unknown','public','internal','confidential','privileged','sealed')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_freshness_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_freshness_check
      check (
        freshness_status in ('unknown','fresh','stale','expired','not_applicable')
        and (freshness_sla_seconds is null or freshness_sla_seconds > 0)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_governance_json_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_governance_json_check
      check (
        jsonb_typeof(approved_roots)='array'
        and jsonb_typeof(provenance_coverage)='object'
        and jsonb_typeof(idempotency_strategy)='object'
        and jsonb_typeof(error_state)='object'
        and jsonb_typeof(connector_quality)='object'
        and jsonb_typeof(data_quality)='object'
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_quality_score_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_quality_score_check
      check (
        jsonb_typeof(connector_quality->'score')='number'
        and (connector_quality->>'score')::numeric between 0 and 100
        and jsonb_typeof(data_quality->'score')='number'
        and (data_quality->>'score')::numeric between 0 and 100
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_registry_v2'::regclass
      and conname='connector_registry_v2_accountability_check'
  ) then
    alter table public.connector_registry_v2 add constraint connector_registry_v2_accountability_check
      check (btrim(owner)<>'' and btrim(next_human_gate)<>'') not valid;
  end if;
end
$$;

alter table public.connector_registry_v2 validate constraint connector_registry_v2_lifecycle_state_check;
alter table public.connector_registry_v2 validate constraint connector_registry_v2_authentication_state_check;
alter table public.connector_registry_v2 validate constraint connector_registry_v2_sensitivity_check;
alter table public.connector_registry_v2 validate constraint connector_registry_v2_freshness_check;
alter table public.connector_registry_v2 validate constraint connector_registry_v2_governance_json_check;
alter table public.connector_registry_v2 validate constraint connector_registry_v2_quality_score_check;
alter table public.connector_registry_v2 validate constraint connector_registry_v2_accountability_check;

alter table public.connector_registry_v2 enable row level security;
drop policy if exists authenticated_all on public.connector_registry_v2;
drop policy if exists connector_registry_v2_client_deny_all on public.connector_registry_v2;
create policy connector_registry_v2_client_deny_all
  on public.connector_registry_v2
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.connector_registry_v2 from anon, authenticated;

comment on table public.connector_registry_v2 is
  'Canonical runtime projection of connector governance. GitHub remains canonical for schemas and decisions. Unknown values receive no inferred quality or authentication credit.';

commit;
