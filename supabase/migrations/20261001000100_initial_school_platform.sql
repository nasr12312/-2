begin;

create schema if not exists private;

create table public.programs (
  id text primary key,
  name text not null unique check (name in ('دبلومة', 'ثنائي اللغة'))
);

create table public.classes (
  id text primary key,
  program_id text not null references public.programs(id) on delete restrict,
  name text not null,
  stage text not null,
  grade text not null,
  section text not null,
  active boolean not null default true,
  unique (program_id, stage, grade, section)
);

create type public.app_role as enum (
  'admin', 'principal', 'head_teacher', 'supervisor_teacher',
  'supervisor', 'teacher', 'family'
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null,
  access_code text not null unique,
  active boolean not null default true,
  setup_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.students (
  id text primary key,
  full_name text not null,
  national_id text unique,
  program_id text not null references public.programs(id) on delete restrict,
  class_id text not null references public.classes(id) on delete restrict,
  account_status text not null default 'waiting_national_id'
    check (account_status in ('active', 'waiting_national_id', 'disabled')),
  enrollment_status text not null default 'مستمر',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.family_students (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  primary key (user_id, student_id)
);

create table public.teacher_class_assignments (
  teacher_id uuid not null references public.profiles(user_id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, class_id)
);

create table public.quran_plan_entries (
  id text primary key,
  program_id text not null references public.programs(id) on delete restrict,
  stage text not null,
  grade text not null,
  week_label text not null,
  day_name text not null,
  assignment_type text not null check (assignment_type in ('حفظ', 'تلاوة', 'مراجعة')),
  assignment_text text not null,
  source_form text not null,
  sort_order integer not null default 0
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  client_key text not null unique,
  student_id text not null references public.students(id) on delete cascade,
  plan_entry_id text references public.quran_plan_entries(id) on delete set null,
  grade text not null,
  score smallint check (score between 1 and 5),
  scores jsonb not null default '[]',
  notes text not null default '',
  teacher_id uuid not null references public.profiles(user_id) on delete restrict,
  evaluated_at timestamptz not null default now(),
  unique (student_id, plan_entry_id)
);

create table public.recitation_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete cascade,
  plan_entry_id text references public.quran_plan_entries(id) on delete set null,
  storage_path text not null unique,
  assignment jsonb not null default '{}',
  file_name text not null default '',
  mime_type text not null default '',
  file_size bigint not null default 0,
  media_type text not null check (media_type in ('audio', 'video')),
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  submitted_by uuid not null references public.profiles(user_id) on delete restrict,
  submitted_at timestamptz not null default now(),
  grade text,
  teacher_notes text not null default '',
  evaluated_by uuid references public.profiles(user_id) on delete set null,
  evaluated_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(user_id) on delete cascade,
  student_id text references public.students(id) on delete cascade,
  title text not null,
  body text not null default '',
  page text not null default 'dashboard',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create index students_class_id_idx on public.students(class_id);
create index family_students_student_id_idx on public.family_students(student_id);
create index teacher_assignments_class_id_idx on public.teacher_class_assignments(class_id);
create index plan_lookup_idx on public.quran_plan_entries(program_id, stage, grade, week_label);
create index evaluations_student_date_idx on public.evaluations(student_id, evaluated_at desc);
create index recitations_student_date_idx on public.recitation_submissions(student_id, submitted_at desc);
create index notifications_recipient_date_idx on public.notifications(recipient_id, created_at desc);

create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() and active;
$$;

create or replace function private.is_leadership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(private.current_role() in ('admin','principal','head_teacher','supervisor_teacher','supervisor'), false);
$$;

create or replace function private.can_view_student(target_student_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    private.is_leadership()
    or exists (
      select 1 from public.family_students fs
      where fs.user_id = auth.uid() and fs.student_id = target_student_id
    )
    or exists (
      select 1
      from public.students s
      join public.teacher_class_assignments tca on tca.class_id = s.class_id
      where s.id = target_student_id and tca.teacher_id = auth.uid()
    );
$$;

revoke all on function private.current_role() from public;
revoke all on function private.is_leadership() from public;
revoke all on function private.can_view_student(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_leadership() to authenticated;
grant execute on function private.can_view_student(text) to authenticated;

alter table public.programs enable row level security;
alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.family_students enable row level security;
alter table public.teacher_class_assignments enable row level security;
alter table public.quran_plan_entries enable row level security;
alter table public.evaluations enable row level security;
alter table public.recitation_submissions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "authenticated can view programs" on public.programs for select to authenticated using (true);
create policy "authenticated can view classes" on public.classes for select to authenticated using (true);
create policy "view own or staff profiles" on public.profiles for select to authenticated
  using (user_id = auth.uid() or private.current_role() <> 'family');
create policy "view linked students" on public.students for select to authenticated
  using (private.can_view_student(id));
create policy "view own family links" on public.family_students for select to authenticated
  using (user_id = auth.uid() or private.is_leadership());
create policy "view relevant teacher assignments" on public.teacher_class_assignments for select to authenticated
  using (teacher_id = auth.uid() or private.is_leadership());
create policy "teacher chooses classes" on public.teacher_class_assignments for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and private.current_role() in ('teacher','head_teacher','supervisor_teacher')
    and exists (select 1 from public.profiles p where p.user_id = auth.uid() and not p.setup_complete)
  );
create policy "teacher removes own class before setup" on public.teacher_class_assignments for delete to authenticated
  using (teacher_id = auth.uid() and exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and not p.setup_complete
  ));
create policy "complete own setup" on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "authenticated can view plans" on public.quran_plan_entries for select to authenticated using (true);

create policy "view student evaluations" on public.evaluations for select to authenticated
  using (private.can_view_student(student_id));
create policy "assigned staff creates evaluations" on public.evaluations for insert to authenticated
  with check (teacher_id = auth.uid() and private.can_view_student(student_id) and private.current_role() <> 'family');
create policy "assigned staff updates evaluations" on public.evaluations for update to authenticated
  using (private.can_view_student(student_id) and private.current_role() <> 'family')
  with check (private.can_view_student(student_id) and private.current_role() <> 'family');

create policy "view student submissions" on public.recitation_submissions for select to authenticated
  using (private.can_view_student(student_id));
create policy "family uploads student submission" on public.recitation_submissions for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and exists (select 1 from public.family_students fs where fs.user_id = auth.uid() and fs.student_id = student_id)
  );
create policy "staff evaluates submission" on public.recitation_submissions for update to authenticated
  using (private.can_view_student(student_id) and private.current_role() <> 'family')
  with check (private.can_view_student(student_id) and private.current_role() <> 'family');

create policy "view own notifications" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "staff creates visible notifications" on public.notifications for insert to authenticated
  with check (private.current_role() <> 'family' and (student_id is null or private.can_view_student(student_id)));
create policy "leadership views audit" on public.audit_logs for select to authenticated using (private.is_leadership());
create policy "authenticated writes own audit" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());

revoke all on all tables in schema public from anon, authenticated;
grant select on public.programs, public.classes, public.quran_plan_entries to authenticated;
grant select (user_id, full_name, role, active, setup_complete) on public.profiles to authenticated;
grant select on public.students, public.family_students, public.teacher_class_assignments to authenticated;
grant update (setup_complete) on public.profiles to authenticated;
grant insert, delete on public.teacher_class_assignments to authenticated;
grant select, insert, update on public.evaluations, public.recitation_submissions, public.notifications to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recitations', 'recitations', false, 26214400, array['audio/mpeg','audio/mp4','audio/wav','audio/webm','video/mp4','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "family uploads linked recitation media" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recitations'
    and exists (
      select 1 from public.family_students fs
      where fs.user_id = auth.uid() and fs.student_id = (storage.foldername(name))[1]
    )
  );
create policy "linked users read recitation media" on storage.objects for select to authenticated
  using (bucket_id = 'recitations' and private.can_view_student((storage.foldername(name))[1]));

commit;
