
begin;

update public.connector_route_runtime_v3
set opened_at = null,
    half_open_after = null,
    half_open_probe_job_id = null,
    half_open_probe_lease_until = null,
    updated_at = now()
where circuit_state = 'closed'
  and (
    opened_at is not null
    or half_open_after is not null
    or half_open_probe_job_id is not null
    or half_open_probe_lease_until is not null
  );

update public.connector_route_runtime_v3
set opened_at = coalesce(opened_at, last_failure_at, updated_at, now()),
    half_open_after = coalesce(
      half_open_after,
      coalesce(opened_at, last_failure_at, updated_at, now())
        + make_interval(secs => circuit_cooldown_seconds)
    ),
    half_open_probe_job_id = null,
    half_open_probe_lease_until = null,
    updated_at = now()
where circuit_state = 'open'
  and (
    opened_at is null
    or half_open_after is null
    or half_open_probe_job_id is not null
    or half_open_probe_lease_until is not null
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.connector_route_runtime_v3'::regclass
      and conname='connector_route_runtime_v3_temporal_state_guard'
  ) then
    alter table public.connector_route_runtime_v3
      add constraint connector_route_runtime_v3_temporal_state_guard
      check (
        (
          circuit_state='closed'
          and opened_at is null
          and half_open_after is null
          and half_open_probe_job_id is null
          and half_open_probe_lease_until is null
        )
        or
        (
          circuit_state='open'
          and opened_at is not null
          and half_open_after is not null
          and half_open_after > opened_at
          and half_open_probe_job_id is null
          and half_open_probe_lease_until is null
        )
        or
        (
          circuit_state='half_open'
          and opened_at is not null
          and half_open_after is not null
          and half_open_after > opened_at
          and (
            (half_open_probe_job_id is null and half_open_probe_lease_until is null)
            or
            (half_open_probe_job_id is not null and half_open_probe_lease_until is not null)
          )
        )
      ) not valid;
  end if;
end
$$;

alter table public.connector_route_runtime_v3
  validate constraint connector_route_runtime_v3_temporal_state_guard;

commit;
