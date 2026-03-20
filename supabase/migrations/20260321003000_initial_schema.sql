create extension if not exists pgcrypto;

create type public.workout_session_status as enum ('active', 'completed', 'abandoned');
create type public.xp_ledger_reason as enum ('session_start', 'session_tick', 'bonus', 'manual_adjustment');

create or replace function public.calculate_level(p_xp_total integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor(sqrt(greatest(p_xp_total, 0) / 25.0))::integer + 1);
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_seed text not null,
  level integer not null default 1,
  xp_total integer not null default 0 check (xp_total >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz
);

create table public.workout_rituals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ritual_id uuid not null references public.workout_rituals(id),
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  status public.workout_session_status not null default 'active',
  base_xp_awarded integer not null default 10 check (base_xp_awarded >= 0),
  duration_seconds_confirmed integer not null default 0 check (duration_seconds_confirmed >= 0),
  xp_earned_confirmed integer not null default 0 check (xp_earned_confirmed >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index workout_sessions_one_active_per_user_idx
on public.workout_sessions(user_id)
where status = 'active';

create index workout_sessions_user_started_at_idx
on public.workout_sessions(user_id, started_at desc);

create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.workout_sessions(id) on delete set null,
  reason public.xp_ledger_reason not null,
  xp_delta integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index xp_ledger_user_created_at_idx
on public.xp_ledger(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb;
  seed text;
  display_name_value text;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  seed := coalesce(metadata->>'avatar_seed', substr(replace(new.id::text, '-', ''), 1, 8));
  display_name_value := coalesce(metadata->>'display_name', 'Ritual ' || upper(substr(seed, 1, 4)));

  insert into public.profiles (id, username, display_name, avatar_seed, level, xp_total)
  values (
    new.id,
    null,
    display_name_value,
    seed,
    1,
    0
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_seen_at = timezone('utc', now())
  where id = auth.uid();
end;
$$;

create or replace function public.get_profile_snapshot()
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid();
$$;

create or replace view public.daily_xp_stats as
select
  xl.user_id,
  coalesce(sum(xl.xp_delta), 0)::integer as xp_window
from public.xp_ledger xl
where xl.created_at >= date_trunc('day', timezone('utc', now()))
group by xl.user_id;

create or replace view public.weekly_xp_stats as
select
  xl.user_id,
  coalesce(sum(xl.xp_delta), 0)::integer as xp_window
from public.xp_ledger xl
where xl.created_at >= date_trunc('week', timezone('utc', now()))
group by xl.user_id;

create or replace function public.fetch_leaderboard(p_window text)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  username text,
  avatar_seed text,
  level integer,
  xp_total integer,
  xp_window integer
)
language sql
security definer
set search_path = public
as $$
  with selected_window as (
    select
      p.id as user_id,
      p.display_name,
      p.username,
      p.avatar_seed,
      p.level,
      p.xp_total,
      case
        when p_window = 'week' then coalesce(w.xp_window, 0)
        else coalesce(d.xp_window, 0)
      end as xp_window
    from public.profiles p
    left join public.daily_xp_stats d on d.user_id = p.id
    left join public.weekly_xp_stats w on w.user_id = p.id
  )
  select
    rank() over (order by sw.xp_window desc, sw.xp_total desc, sw.display_name asc) as rank,
    sw.user_id,
    sw.display_name,
    sw.username,
    sw.avatar_seed,
    sw.level,
    sw.xp_total,
    sw.xp_window
  from selected_window sw
  order by rank, sw.display_name
  limit 100;
$$;

create or replace function public.private_start_workout_session(p_user_id uuid, p_ritual_id uuid)
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
declare
  ritual_record public.workout_rituals;
  active_session_id uuid;
  updated_profile public.profiles;
  created_session public.workout_sessions;
begin
  select *
  into ritual_record
  from public.workout_rituals
  where id = p_ritual_id and is_active = true;

  if ritual_record.id is null then
    raise exception 'ritual_not_found';
  end if;

  select id
  into active_session_id
  from public.workout_sessions
  where user_id = p_user_id and status = 'active'
  limit 1;

  if active_session_id is not null then
    raise exception 'active_session_exists';
  end if;

  insert into public.workout_sessions (user_id, ritual_id, base_xp_awarded)
  values (p_user_id, p_ritual_id, 10)
  returning * into created_session;

  insert into public.xp_ledger (user_id, session_id, reason, xp_delta)
  values (p_user_id, created_session.id, 'session_start', 10);

  update public.profiles
  set
    xp_total = xp_total + 10,
    level = public.calculate_level(xp_total + 10),
    last_seen_at = timezone('utc', now())
  where id = p_user_id
  returning * into updated_profile;

  return query
  select
    created_session.id,
    created_session.started_at,
    10,
    updated_profile.xp_total,
    updated_profile.level;
end;
$$;

create or replace function public.private_finish_workout_session(
  p_user_id uuid,
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
declare
  session_record public.workout_sessions;
  ritual_record public.workout_rituals;
  duration_cap integer;
  final_seconds integer;
  tick_xp integer;
  updated_profile public.profiles;
  finished_at timestamptz := timezone('utc', now());
begin
  select *
  into session_record
  from public.workout_sessions
  where id = p_session_id
    and user_id = p_user_id
    and status = 'active'
  limit 1;

  if session_record.id is null then
    raise exception 'active_session_not_found';
  end if;

  select *
  into ritual_record
  from public.workout_rituals
  where id = session_record.ritual_id;

  duration_cap := ritual_record.duration_seconds + 30;
  final_seconds := greatest(0, least(coalesce(p_client_duration_seconds, 0), duration_cap));
  tick_xp := final_seconds;

  update public.workout_sessions
  set
    ended_at = finished_at,
    status = 'completed',
    duration_seconds_confirmed = final_seconds,
    xp_earned_confirmed = session_record.base_xp_awarded + tick_xp
  where id = session_record.id;

  if tick_xp > 0 then
    insert into public.xp_ledger (user_id, session_id, reason, xp_delta)
    values (p_user_id, session_record.id, 'session_tick', tick_xp);
  end if;

  update public.profiles
  set
    xp_total = xp_total + tick_xp,
    level = public.calculate_level(xp_total + tick_xp),
    last_seen_at = finished_at
  where id = p_user_id
  returning * into updated_profile;

  return query
  with day_ranked as (
    select user_id, rank() over (order by xp_window desc, xp_total desc, display_name asc) as current_rank
    from (
      select p.id as user_id, p.display_name, p.xp_total, coalesce(d.xp_window, 0) as xp_window
      from public.profiles p
      left join public.daily_xp_stats d on d.user_id = p.id
    ) q
  ),
  week_ranked as (
    select user_id, rank() over (order by xp_window desc, xp_total desc, display_name asc) as current_rank
    from (
      select p.id as user_id, p.display_name, p.xp_total, coalesce(w.xp_window, 0) as xp_window
      from public.profiles p
      left join public.weekly_xp_stats w on w.user_id = p.id
    ) q
  )
  select
    session_record.id,
    session_record.base_xp_awarded + tick_xp,
    final_seconds,
    updated_profile.xp_total,
    updated_profile.level,
    (select current_rank from day_ranked where user_id = p_user_id),
    (select current_rank from week_ranked where user_id = p_user_id),
    finished_at;
end;
$$;

alter table public.profiles enable row level security;
alter table public.workout_rituals enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.xp_ledger enable row level security;

create policy "profiles readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "rituals readable by authenticated users"
on public.workout_rituals
for select
to authenticated
using (is_active = true);

create policy "sessions readable by owner"
on public.workout_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "ledger readable by owner"
on public.xp_ledger
for select
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to authenticated;
grant select on public.workout_rituals to authenticated;
grant select on public.workout_sessions to authenticated;
grant select on public.xp_ledger to authenticated;
grant select on public.daily_xp_stats to authenticated;
grant select on public.weekly_xp_stats to authenticated;
grant execute on function public.fetch_leaderboard(text) to authenticated;
grant execute on function public.get_profile_snapshot() to authenticated;
grant execute on function public.touch_last_seen() to authenticated;
grant execute on function public.private_start_workout_session(uuid, uuid) to service_role;
grant execute on function public.private_finish_workout_session(uuid, uuid, integer) to service_role;

insert into public.workout_rituals (id, title, duration_seconds, is_active)
values ('2b736b44-4444-4a4e-9aa9-0f134b66e701', '7 минут зарядки', 420, true)
on conflict (id) do nothing;
