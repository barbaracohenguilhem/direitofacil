-- OAB Engine core schema
-- Designed for Supabase/Postgres. The current app still uses localStorage;
-- this migration defines the backend target without coupling UI code to Supabase yet.

create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'admin', 'editor')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.is_oab_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'editor')
  );
$$;

revoke all on function public.is_oab_admin() from public;
grant execute on function public.is_oab_admin() to authenticated;

create table if not exists public.study_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exam_date date not null,
  timezone text not null default 'America/Sao_Paulo',
  session_minutes integer not null check (session_minutes between 10 and 240),
  calendar_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_availability (
  user_id uuid not null references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  available_minutes integer not null default 0 check (available_minutes between 0 and 720),
  preferred_start time,
  primary key (user_id, weekday)
);

create table if not exists public.fixed_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  weekdays smallint[] not null default '{}',
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table if not exists public.curriculum_concepts (
  id text primary key,
  subject text not null,
  label text not null,
  order_index integer not null check (order_index > 0),
  unlock_strength numeric(4,3) not null default 0.52 check (unlock_strength between 0 and 1),
  incidence_weight numeric(4,3) not null default 0.70 check (incidence_weight between 0 and 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curriculum_prerequisites (
  concept_id text not null references public.curriculum_concepts(id) on delete cascade,
  prerequisite_id text not null references public.curriculum_concepts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (concept_id, prerequisite_id),
  check (concept_id <> prerequisite_id)
);

create table if not exists public.questions (
  id text primary key,
  exam text,
  exam_year integer,
  question_number integer,
  subject text not null,
  topic text,
  subtopic text,
  concept_id text references public.curriculum_concepts(id) on delete set null,
  concept_label text not null,
  difficulty text not null default 'unknown' check (difficulty in ('easy', 'medium', 'hard', 'unknown')),
  source_url text,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  prompt text not null,
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  reasoning_keywords text[] not null default '{}',
  misconception_keywords text[] not null default '{}',
  opening_line text,
  nudge text,
  second_nudge text,
  takeaway text,
  fgv_pattern text,
  vade_article text,
  vade_instruction text,
  is_transfer boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  question_id text not null references public.questions(id) on delete cascade,
  option_id char(1) not null check (option_id in ('A', 'B', 'C', 'D')),
  option_text text not null,
  explanation text not null,
  primary key (question_id, option_id)
);

create table if not exists public.learner_concepts (
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id text not null references public.curriculum_concepts(id) on delete cascade,
  strength numeric(4,3) not null default 0.25 check (strength between 0 and 1),
  exposures integer not null default 0 check (exposures >= 0),
  last_seen_at timestamptz,
  next_review_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  concept_id text,
  subject text,
  selected_option char(1) not null check (selected_option in ('A', 'B', 'C', 'D')),
  correct boolean not null,
  reasoning_signal text not null check (reasoning_signal in ('solid', 'partial', 'lucky', 'confused', 'unknown')),
  hints_used smallint not null default 0 check (hints_used between 0 and 10),
  response_ms integer not null check (response_ms >= 0),
  created_at timestamptz not null default now()
);

-- Intentionally no raw reasoning_text column: the adaptive model can persist the derived
-- pedagogical signal without retaining every free-form explanation by default.

create table if not exists public.study_plan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_date date not null,
  generated_at timestamptz not null default now(),
  active boolean not null default true
);

create unique index if not exists study_plan_one_active_per_user
  on public.study_plan_runs(user_id)
  where active;

create table if not exists public.study_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plan_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  preferred_start time,
  base_minutes integer not null default 0 check (base_minutes >= 0),
  planned_minutes integer not null default 0 check (planned_minutes >= 0),
  carried_minutes integer not null default 0 check (carried_minutes >= 0),
  status text not null check (status in ('planned', 'done', 'missed', 'unavailable')),
  unique (plan_id, study_date)
);

create table if not exists public.study_blocks (
  id uuid primary key default gen_random_uuid(),
  study_day_id uuid not null references public.study_days(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null check (position > 0),
  question_id text references public.questions(id) on delete set null,
  adaptive_reason text check (adaptive_reason in ('new', 'reinforce', 'retention', 'transfer')),
  label text not null,
  subject text,
  minutes integer not null check (minutes > 0),
  kind text not null check (kind in ('learning', 'review', 'questions', 'calibration')),
  unique (study_day_id, position)
);

create table if not exists public.learning_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.calibration_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'started' check (status in ('started', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_questions integer check (total_questions >= 0),
  correct_answers integer check (correct_answers >= 0)
);

create table if not exists public.calibration_answers (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.calibration_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  selected_option char(1) not null check (selected_option in ('A', 'B', 'C', 'D')),
  correct boolean not null,
  created_at timestamptz not null default now(),
  unique (run_id, question_id)
);

create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  source text,
  primary key (user_id, badge_id)
);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  units numeric(10,2) not null,
  source_type text,
  source_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('general', 'doubt')),
  title text,
  body text not null,
  concept_id text references public.curriculum_concepts(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'resolved', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.community_answer_validations (
  message_id uuid primary key references public.community_messages(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'valid', 'invalid')),
  validated_by uuid references auth.users(id) on delete set null,
  validated_by_system boolean not null default false,
  validated_at timestamptz,
  rewarded_at timestamptz
);

-- High-value indexes for the adaptive access patterns.
create index if not exists questions_published_concept_idx on public.questions(concept_id) where status = 'published';
create index if not exists questions_published_subject_idx on public.questions(subject) where status = 'published';
create index if not exists questions_exam_idx on public.questions(exam_year desc, exam, question_number);
create index if not exists learner_concepts_review_idx on public.learner_concepts(user_id, next_review_at);
create index if not exists attempts_user_created_idx on public.question_attempts(user_id, created_at desc);
create index if not exists attempts_user_concept_idx on public.question_attempts(user_id, concept_id, created_at desc);
create index if not exists study_days_user_date_idx on public.study_days(user_id, study_date);
create index if not exists learning_events_user_created_idx on public.learning_events(user_id, created_at desc);
create index if not exists learning_events_user_type_idx on public.learning_events(user_id, event_type, created_at desc);
create index if not exists calibration_runs_user_idx on public.calibration_runs(user_id, started_at desc);
create index if not exists community_threads_created_idx on public.community_threads(created_at desc);
create index if not exists community_messages_thread_idx on public.community_messages(thread_id, created_at);

-- RLS
alter table public.user_roles enable row level security;
alter table public.study_profiles enable row level security;
alter table public.study_availability enable row level security;
alter table public.fixed_commitments enable row level security;
alter table public.curriculum_concepts enable row level security;
alter table public.curriculum_prerequisites enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.learner_concepts enable row level security;
alter table public.question_attempts enable row level security;
alter table public.study_plan_runs enable row level security;
alter table public.study_days enable row level security;
alter table public.study_blocks enable row level security;
alter table public.learning_events enable row level security;
alter table public.calibration_runs enable row level security;
alter table public.calibration_answers enable row level security;
alter table public.user_badges enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_answer_validations enable row level security;

create policy "roles_read_own_or_admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_oab_admin());
create policy "roles_admin_write" on public.user_roles for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());

create policy "profiles_own" on public.study_profiles for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "availability_own" on public.study_availability for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "commitments_own" on public.fixed_commitments for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());

create policy "curriculum_read" on public.curriculum_concepts for select to authenticated using (active or public.is_oab_admin());
create policy "curriculum_admin_write" on public.curriculum_concepts for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());
create policy "prerequisites_read" on public.curriculum_prerequisites for select to authenticated using (true);
create policy "prerequisites_admin_write" on public.curriculum_prerequisites for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());

create policy "questions_read_published" on public.questions for select to authenticated using (status = 'published' or public.is_oab_admin());
create policy "questions_admin_write" on public.questions for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());
create policy "options_read_published" on public.question_options for select to authenticated using (
  exists (select 1 from public.questions q where q.id = question_id and (q.status = 'published' or public.is_oab_admin()))
);
create policy "options_admin_write" on public.question_options for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());

create policy "learner_concepts_own" on public.learner_concepts for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "attempts_own" on public.question_attempts for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "plan_runs_own" on public.study_plan_runs for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "study_days_own" on public.study_days for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "study_blocks_own" on public.study_blocks for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "events_own" on public.learning_events for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "calibration_runs_own" on public.calibration_runs for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "calibration_answers_own" on public.calibration_answers for all to authenticated using (user_id = auth.uid() or public.is_oab_admin()) with check (user_id = auth.uid() or public.is_oab_admin());
create policy "badges_own_read" on public.user_badges for select to authenticated using (user_id = auth.uid() or public.is_oab_admin());
create policy "badges_admin_write" on public.user_badges for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());
create policy "rewards_own_read" on public.reward_ledger for select to authenticated using (user_id = auth.uid() or public.is_oab_admin());
create policy "rewards_admin_write" on public.reward_ledger for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());

-- Praça: authenticated students can read community content and create their own posts/messages.
create policy "community_threads_read" on public.community_threads for select to authenticated using (true);
create policy "community_threads_insert_own" on public.community_threads for insert to authenticated with check (author_id = auth.uid());
create policy "community_threads_update_own_or_admin" on public.community_threads for update to authenticated using (author_id = auth.uid() or public.is_oab_admin()) with check (author_id = auth.uid() or public.is_oab_admin());
create policy "community_messages_read" on public.community_messages for select to authenticated using (true);
create policy "community_messages_insert_own" on public.community_messages for insert to authenticated with check (author_id = auth.uid());
create policy "community_messages_update_own_or_admin" on public.community_messages for update to authenticated using (author_id = auth.uid() or public.is_oab_admin()) with check (author_id = auth.uid() or public.is_oab_admin());
create policy "community_validations_read" on public.community_answer_validations for select to authenticated using (true);
create policy "community_validations_admin_write" on public.community_answer_validations for all to authenticated using (public.is_oab_admin()) with check (public.is_oab_admin());
