create or replace function public.start_workout_session(p_ritual_id uuid)
returns table (
  session_id uuid,
  started_at timestamptz,
  initial_xp integer,
  xp_total integer,
  level integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  return query
  select *
  from public.private_start_workout_session(auth.uid(), p_ritual_id);
end;
$$;

create or replace function public.finish_workout_session(
  p_session_id uuid,
  p_client_duration_seconds integer
)
returns table (
  session_id uuid,
  confirmed_xp integer,
  confirmed_seconds integer,
  xp_total integer,
  level integer,
  daily_rank bigint,
  weekly_rank bigint,
  ended_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  return query
  select *
  from public.private_finish_workout_session(auth.uid(), p_session_id, p_client_duration_seconds);
end;
$$;

grant execute on function public.start_workout_session(uuid) to authenticated;
grant execute on function public.finish_workout_session(uuid, integer) to authenticated;
