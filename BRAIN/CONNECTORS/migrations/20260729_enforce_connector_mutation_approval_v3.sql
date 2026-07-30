-- Enforce approval for every mutation-capable connector route.
-- Canonical database: supabase-backend-ops
-- Applied and validated: 2026-07-29 HST
--
-- This migration is idempotent. It does not enable any connector,
-- grant authentication, or authorize an external mutation.

begin;

update public.connector_route_policy_v3
set approval_required = true,
    updated_at = now()
where enabled
  and mutation_class in ('write', 'destructive')
  and approval_required = false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.connector_route_policy_v3'::regclass
      and conname = 'connector_route_policy_v3_mutation_approval_guard'
  ) then
    alter table public.connector_route_policy_v3
      add constraint connector_route_policy_v3_mutation_approval_guard
      check (mutation_class = 'read' or approval_required)
      not valid;
  end if;
end
$$;

alter table public.connector_route_policy_v3
  validate constraint connector_route_policy_v3_mutation_approval_guard;

commit;

-- Verification:
-- select count(*) from public.connector_route_policy_v3
-- where enabled
--   and mutation_class in ('write', 'destructive')
--   and not approval_required;
-- Expected: 0
