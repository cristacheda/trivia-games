create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.player_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  local_player_id text not null unique,
  display_name text,
  sound_enabled boolean not null default true,
  tracking_consent text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_game_stats (
  player_id uuid not null references public.player_profiles (id) on delete cascade,
  game_id text not null,
  last_difficulty text,
  high_score integer,
  high_score_achieved_at timestamptz,
  high_score_difficulty_id text,
  recent_total_score integer,
  recent_correct_answers integer,
  recent_total_questions integer,
  recent_completed_at timestamptz,
  recent_difficulty_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (player_id, game_id)
);

create table if not exists public.round_results (
  id uuid primary key,
  player_id uuid not null references public.player_profiles (id) on delete cascade,
  game_id text not null,
  difficulty_id text not null,
  total_score integer not null,
  correct_answers integer not null,
  total_questions integer not null,
  completed_at timestamptz not null,
  previous_best_score integer,
  beat_high_score boolean not null,
  round_duration_seconds integer,
  timeouts_count integer,
  created_at timestamptz not null default now()
);

create index if not exists player_game_stats_game_idx
  on public.player_game_stats (game_id);

create index if not exists round_results_player_game_completed_idx
  on public.round_results (player_id, game_id, completed_at desc);

create index if not exists round_results_game_score_idx
  on public.round_results (game_id, total_score desc, completed_at asc);

drop trigger if exists player_profiles_set_updated_at on public.player_profiles;
create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists player_game_stats_set_updated_at on public.player_game_stats;
create trigger player_game_stats_set_updated_at
before update on public.player_game_stats
for each row
execute function public.set_updated_at();

alter table public.player_profiles enable row level security;
alter table public.player_game_stats enable row level security;
alter table public.round_results enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.player_profiles to authenticated;
grant select, insert, update on public.player_game_stats to authenticated;
grant select, insert, update on public.round_results to authenticated;

drop policy if exists "player_profiles_select_own" on public.player_profiles;
create policy "player_profiles_select_own"
on public.player_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "player_profiles_insert_own" on public.player_profiles;
create policy "player_profiles_insert_own"
on public.player_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "player_profiles_update_own" on public.player_profiles;
create policy "player_profiles_update_own"
on public.player_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "player_game_stats_select_own" on public.player_game_stats;
create policy "player_game_stats_select_own"
on public.player_game_stats
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "player_game_stats_insert_own" on public.player_game_stats;
create policy "player_game_stats_insert_own"
on public.player_game_stats
for insert
to authenticated
with check (auth.uid() = player_id);

drop policy if exists "player_game_stats_update_own" on public.player_game_stats;
create policy "player_game_stats_update_own"
on public.player_game_stats
for update
to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

drop policy if exists "round_results_select_own" on public.round_results;
create policy "round_results_select_own"
on public.round_results
for select
to authenticated
using (auth.uid() = player_id);

drop policy if exists "round_results_insert_own" on public.round_results;
create policy "round_results_insert_own"
on public.round_results
for insert
to authenticated
with check (auth.uid() = player_id);

drop policy if exists "round_results_update_own" on public.round_results;
create policy "round_results_update_own"
on public.round_results
for update
to authenticated
using (auth.uid() = player_id)
with check (auth.uid() = player_id);

create or replace function public.get_site_high_score(target_game_id text)
returns table (
  game_id text,
  score integer,
  achieved_at timestamptz,
  player_label text
)
language sql
security definer
set search_path = public
as $$
  select
    rr.game_id,
    rr.total_score as score,
    rr.completed_at as achieved_at,
    coalesce(pp.display_name, left(pp.local_player_id, 8) || '...') as player_label
  from public.round_results rr
  join public.player_profiles pp on pp.id = rr.player_id
  where rr.game_id = target_game_id
  order by rr.total_score desc, rr.completed_at asc
  limit 1;
$$;

grant execute on function public.get_site_high_score(text) to authenticated;
