drop policy if exists "round_answers_select_own" on public.round_answers;
drop policy if exists "round_answers_insert_own" on public.round_answers;
drop policy if exists "round_answers_delete_own" on public.round_answers;

revoke select, insert, delete on public.round_answers from authenticated;

drop table if exists public.round_answers;
