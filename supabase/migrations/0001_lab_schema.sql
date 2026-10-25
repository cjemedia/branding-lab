-- =====================================================================
-- The Branding Lab: database schema
-- Runs in the CJE Hub's Supabase project, inside its own `lab` schema.
-- Nothing in this file touches the Hub's `public` tables.
--
-- After running, add `lab` to Exposed schemas:
--   Supabase dashboard > Project Settings > Data API > Exposed schemas
-- =====================================================================

create schema if not exists lab;

grant usage on schema lab to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Shared helper: keep updated_at current
-- ---------------------------------------------------------------------
create or replace function lab.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profiles: one row per Lab user (students and Lab admins)
-- A Hub client who joins the Lab gets a row here; Hub data stays in public.
-- ---------------------------------------------------------------------
create table lab.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  brand_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_key on lab.profiles (lower(email));

create trigger profiles_updated_at
before update on lab.profiles
for each row execute function lab.set_updated_at();

-- ---------------------------------------------------------------------
-- Memberships: access to the Lab, mirrored from Skool
-- ---------------------------------------------------------------------
create table lab.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references lab.profiles (id) on delete cascade,
  tier text not null default 'branding_lab' check (tier in ('branding_lab', 'agency_lab')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'cancelled', 'expired')),
  source text not null default 'admin' check (source in ('zapier', 'admin')),
  activated_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger memberships_updated_at
before update on lab.memberships
for each row execute function lab.set_updated_at();

-- ---------------------------------------------------------------------
-- Experiments: the curriculum, editable by admins (never hard-coded)
--   is_published: the card shows on the dashboard
--   is_open:      the tool itself is built and can be used
-- ---------------------------------------------------------------------
create table lab.experiments (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  estimated_time text,
  lesson_url text,
  tier_required text not null default 'branding_lab' check (tier_required in ('branding_lab', 'agency_lab')),
  sort_order int not null,
  prerequisite_id uuid references lab.experiments (id) on delete set null,
  requires_knowledge_check boolean not null default true,
  brand_profile_section text,
  is_published boolean not null default true,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger experiments_updated_at
before update on lab.experiments
for each row execute function lab.set_updated_at();

-- ---------------------------------------------------------------------
-- Knowledge checks: questions per experiment (answers never sent to browser)
-- ---------------------------------------------------------------------
create table lab.knowledge_check_questions (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references lab.experiments (id) on delete cascade,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_index int not null,
  explanation text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_check_questions_experiment_idx on lab.knowledge_check_questions (experiment_id);

create trigger knowledge_check_questions_updated_at
before update on lab.knowledge_check_questions
for each row execute function lab.set_updated_at();

create table lab.knowledge_check_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lab.profiles (id) on delete cascade,
  experiment_id uuid not null references lab.experiments (id) on delete cascade,
  answers jsonb not null,
  score int not null,
  total int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index knowledge_check_attempts_user_idx on lab.knowledge_check_attempts (user_id, experiment_id);

-- ---------------------------------------------------------------------
-- Experiment progress: one row per student per unlocked experiment
--   No row = locked or ready to unlock (worked out by lab.experiment_access)
-- ---------------------------------------------------------------------
create table lab.experiment_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lab.profiles (id) on delete cascade,
  experiment_id uuid not null references lab.experiments (id) on delete cascade,
  status text not null default 'unlocked' check (status in ('unlocked', 'in_progress', 'completed')),
  current_step int not null default 0,
  answers jsonb not null default '{}'::jsonb,
  draft_result jsonb,
  approved_result jsonb,
  needs_refresh boolean not null default false,
  unlocked_by text not null default 'knowledge_check' check (unlocked_by in ('knowledge_check', 'admin', 'no_check_required')),
  unlocked_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, experiment_id)
);

create trigger experiment_progress_updated_at
before update on lab.experiment_progress
for each row execute function lab.set_updated_at();

-- ---------------------------------------------------------------------
-- Brand Profile: one section per experiment, reused by later experiments
-- ---------------------------------------------------------------------
create table lab.brand_profile_sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lab.profiles (id) on delete cascade,
  section text not null check (section in ('identity', 'purpose', 'audience', 'visual', 'voice', 'profile_audit', 'content')),
  source_experiment_id uuid references lab.experiments (id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, section)
);

create trigger brand_profile_sections_updated_at
before update on lab.brand_profile_sections
for each row execute function lab.set_updated_at();

-- ---------------------------------------------------------------------
-- Editable content (headlines, instructions, buttons, examples), versioned
-- ---------------------------------------------------------------------
create table lab.content_items (
  key text primary key,
  label text not null,
  area text not null,
  help_text text,
  created_at timestamptz not null default now()
);

create table lab.content_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null references lab.content_items (key) on delete cascade,
  value text not null,
  version int not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references lab.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (key, version)
);

create unique index content_versions_one_published
on lab.content_versions (key) where status = 'published';

-- ---------------------------------------------------------------------
-- AI instructions, versioned from day one
--   layer 'technical':        developer only (never founder-editable)
--   layer 'experience_voice': CJE Experience Voice (founder editor in Phase 4)
--   experiment_id null = shared across all experiments
-- ---------------------------------------------------------------------
create table lab.ai_instruction_versions (
  id uuid primary key default gen_random_uuid(),
  layer text not null check (layer in ('technical', 'experience_voice')),
  experiment_id uuid references lab.experiments (id) on delete cascade,
  name text not null,
  body text not null,
  version int not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  change_note text,
  created_by uuid references lab.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index ai_instruction_versions_number
on lab.ai_instruction_versions (layer, coalesce(experiment_id, '00000000-0000-0000-0000-000000000000'::uuid), version);

create unique index ai_instruction_versions_one_published
on lab.ai_instruction_versions (layer, coalesce(experiment_id, '00000000-0000-0000-0000-000000000000'::uuid))
where status = 'published';

-- Every AI call records exactly which instruction versions produced it
create table lab.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references lab.profiles (id) on delete cascade,
  experiment_id uuid not null references lab.experiments (id) on delete cascade,
  kind text not null check (kind in ('result', 'regenerate', 'rewrite')),
  instruction_version_ids uuid[] not null default '{}',
  model text,
  input_tokens int,
  output_tokens int,
  output jsonb,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index ai_generations_user_idx on lab.ai_generations (user_id, experiment_id, created_at desc);

-- ---------------------------------------------------------------------
-- Audit log and integration events
-- ---------------------------------------------------------------------
create table lab.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references lab.profiles (id) on delete set null,
  action text not null,
  target_user_id uuid references lab.profiles (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on lab.audit_log (created_at desc);

create table lab.integration_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'zapier',
  event_type text not null,
  email text,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index integration_events_created_idx on lab.integration_events (created_at desc);

-- =====================================================================
-- Access functions
-- =====================================================================

create or replace function lab.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from lab.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Decides whether a user may open an experiment. Used by the dashboard
-- and by every experiment request on the server.
-- reason values:
--   ok | not_signed_in | no_profile | inactive_membership | not_published
--   tier | prerequisite | ready_to_unlock | not_open
create or replace function lab.experiment_access(p_experiment_id uuid, p_user_id uuid default null)
returns table (allowed boolean, reason text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := coalesce(p_user_id, auth.uid());
  v_membership lab.memberships%rowtype;
  v_experiment lab.experiments%rowtype;
  v_has_progress boolean;
  v_prereq_done boolean;
begin
  -- Only the service role may check on behalf of another user
  if p_user_id is not null and p_user_id is distinct from auth.uid()
     and coalesce(auth.role(), '') <> 'service_role' then
    return query select false, 'not_signed_in';
    return;
  end if;

  if v_user is null then
    return query select false, 'not_signed_in';
    return;
  end if;

  if not exists (select 1 from lab.profiles where id = v_user) then
    return query select false, 'no_profile';
    return;
  end if;

  select * into v_membership from lab.memberships where user_id = v_user;
  if not found or v_membership.status <> 'active' then
    return query select false, 'inactive_membership';
    return;
  end if;

  select * into v_experiment from lab.experiments where id = p_experiment_id;
  if not found or not v_experiment.is_published then
    return query select false, 'not_published';
    return;
  end if;

  if v_experiment.tier_required = 'agency_lab' and v_membership.tier <> 'agency_lab' then
    return query select false, 'tier';
    return;
  end if;

  select exists (
    select 1 from lab.experiment_progress
    where user_id = v_user and experiment_id = p_experiment_id
  ) into v_has_progress;

  if v_has_progress then
    if not v_experiment.is_open then
      return query select false, 'not_open';
    else
      return query select true, 'ok';
    end if;
    return;
  end if;

  if v_experiment.prerequisite_id is not null then
    select exists (
      select 1 from lab.experiment_progress
      where user_id = v_user
        and experiment_id = v_experiment.prerequisite_id
        and status = 'completed'
    ) into v_prereq_done;

    if not v_prereq_done then
      return query select false, 'prerequisite';
      return;
    end if;
  end if;

  return query select false, 'ready_to_unlock';
end;
$$;

revoke all on function lab.experiment_access(uuid, uuid) from public;
grant execute on function lab.experiment_access(uuid, uuid) to authenticated, service_role;
grant execute on function lab.is_admin() to authenticated, service_role;

-- Finds an existing auth account by email (for Hub clients joining the Lab).
-- Service role only.
create or replace function lab.find_auth_user_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function lab.find_auth_user_id(text) from public, anon, authenticated;
grant execute on function lab.find_auth_user_id(text) to service_role;

-- =====================================================================
-- Row Level Security
-- Students can READ their own data. All writes go through the server,
-- which checks access first and uses the service role.
-- =====================================================================

alter table lab.profiles enable row level security;
alter table lab.memberships enable row level security;
alter table lab.experiments enable row level security;
alter table lab.knowledge_check_questions enable row level security;
alter table lab.knowledge_check_attempts enable row level security;
alter table lab.experiment_progress enable row level security;
alter table lab.brand_profile_sections enable row level security;
alter table lab.content_items enable row level security;
alter table lab.content_versions enable row level security;
alter table lab.ai_instruction_versions enable row level security;
alter table lab.ai_generations enable row level security;
alter table lab.audit_log enable row level security;
alter table lab.integration_events enable row level security;

-- Profiles
create policy "Own profile or admin" on lab.profiles
for select to authenticated
using (id = auth.uid() or lab.is_admin());

-- Memberships
create policy "Own membership or admin" on lab.memberships
for select to authenticated
using (user_id = auth.uid() or lab.is_admin());

-- Experiments: published cards are visible to signed-in Lab users
create policy "Published experiments" on lab.experiments
for select to authenticated
using (is_published or lab.is_admin());

-- Knowledge check questions: admins only (students get questions without answers from the server)
create policy "Admins read questions" on lab.knowledge_check_questions
for select to authenticated
using (lab.is_admin());

create policy "Own attempts or admin" on lab.knowledge_check_attempts
for select to authenticated
using (user_id = auth.uid() or lab.is_admin());

create policy "Own progress or admin" on lab.experiment_progress
for select to authenticated
using (user_id = auth.uid() or lab.is_admin());

create policy "Own brand profile or admin" on lab.brand_profile_sections
for select to authenticated
using (user_id = auth.uid() or lab.is_admin());

-- Content: published copy is readable by anyone (login page uses it)
create policy "Content items readable" on lab.content_items
for select to anon, authenticated
using (true);

create policy "Published content or admin" on lab.content_versions
for select to anon, authenticated
using (status = 'published' or lab.is_admin());

-- Admin-only reads
create policy "Admins read AI instructions" on lab.ai_instruction_versions
for select to authenticated
using (lab.is_admin());

create policy "Own generations or admin" on lab.ai_generations
for select to authenticated
using (user_id = auth.uid() or lab.is_admin());

create policy "Admins read audit log" on lab.audit_log
for select to authenticated
using (lab.is_admin());

create policy "Admins read integration events" on lab.integration_events
for select to authenticated
using (lab.is_admin());

-- Table privileges (RLS still applies to anon and authenticated)
grant select on all tables in schema lab to anon, authenticated;
grant all on all tables in schema lab to service_role;
alter default privileges in schema lab grant select on tables to anon, authenticated;
alter default privileges in schema lab grant all on tables to service_role;
