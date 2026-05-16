create or replace function public.get_site_leaderboard(target_game_id text)
returns table (
  entry_kind text,
  game_id text,
  rank bigint,
  score integer,
  achieved_at timestamptz,
  player_label text,
  is_current_player boolean
)
language sql
security definer
set search_path = public
as $$
  with ranked_scores as (
    select
      pgs.player_id,
      pgs.game_id,
      pgs.high_score as score,
      pgs.high_score_achieved_at as achieved_at,
      coalesce(nullif(trim(pp.display_name), ''), left(pp.local_player_id, 8) || '...') as player_label,
      pgs.player_id = auth.uid() as is_current_player,
      row_number() over (
        order by
          pgs.high_score desc,
          pgs.high_score_achieved_at asc,
          pgs.player_id asc
      ) as rank
    from public.player_game_stats pgs
    join public.player_profiles pp on pp.id = pgs.player_id
    where
      pgs.game_id = target_game_id
      and pgs.high_score is not null
      and pgs.high_score_achieved_at is not null
  )
  select
    'leaderboard'::text as entry_kind,
    ranked_scores.game_id,
    ranked_scores.rank,
    ranked_scores.score,
    ranked_scores.achieved_at,
    ranked_scores.player_label,
    ranked_scores.is_current_player
  from ranked_scores
  where ranked_scores.rank <= 5
  union all
  select
    'player-rank'::text as entry_kind,
    ranked_scores.game_id,
    ranked_scores.rank,
    ranked_scores.score,
    ranked_scores.achieved_at,
    ranked_scores.player_label,
    ranked_scores.is_current_player
  from ranked_scores
  where ranked_scores.is_current_player and ranked_scores.rank > 5
  order by rank asc, entry_kind asc;
$$;

grant execute on function public.get_site_leaderboard(text) to authenticated;
