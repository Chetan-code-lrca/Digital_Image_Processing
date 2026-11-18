-- Each authenticated learner gets one private progress record.
-- Apply this migration in the Supabase SQL Editor before enabling Google sign-in.

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default
    '{"completed":[],"tasks":[],"hours":2,"goal":"GATE + university exams"}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "Learners can read their own progress" on public.user_progress;
create policy "Learners can read their own progress"
  on public.user_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Learners can create their own progress" on public.user_progress;
create policy "Learners can create their own progress"
  on public.user_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Learners can update their own progress" on public.user_progress;
create policy "Learners can update their own progress"
  on public.user_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_progress to authenticated;
