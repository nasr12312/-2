-- Explicit grants and scoped policies; existing student records remain intact.
create table public.student_guardian_contacts (
 student_id text primary key references public.students(id),
 guardian_name text not null default '' check(length(guardian_name)<=150),
 phone text not null default '' check(phone='' or phone ~ '^[1-9][0-9]{7,14}$'),
 resource_url text not null default '' check(length(resource_url)<=2000 and (resource_url='' or resource_url like 'https://%')),
 resource_label text not null default '' check(length(resource_label)<=150),
 updated_at timestamptz not null default now()
);
alter table public.student_guardian_contacts enable row level security;
revoke all on public.student_guardian_contacts from public,anon,authenticated;
grant select,insert,update on public.student_guardian_contacts to authenticated;
grant select,insert,update,delete on public.student_guardian_contacts to service_role;
create policy guardian_contact_read on public.student_guardian_contacts for select to authenticated using(exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create policy guardian_contact_add on public.student_guardian_contacts for insert to authenticated with check(exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create policy guardian_contact_edit on public.student_guardian_contacts for update to authenticated using(exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id))) with check(exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
alter table public.student_report_drafts add column academic_notes text not null default '' check(length(academic_notes)<=3000), add column behavioral_notes text not null default '' check(length(behavioral_notes)<=3000);
create table public.guardian_report_handoffs (
 id uuid primary key default gen_random_uuid(), student_id text not null references public.students(id),
 teacher_id uuid not null default auth.uid() references public.profiles(user_id),
 status text not null check(status in ('opened','teacher_confirmed_sent')),
 created_at timestamptz not null default now()
);
alter table public.guardian_report_handoffs enable row level security;
revoke all on public.guardian_report_handoffs from public,anon,authenticated;
grant select,insert on public.guardian_report_handoffs to authenticated;
grant select,insert,update,delete on public.guardian_report_handoffs to service_role;
create policy guardian_handoff_read on public.guardian_report_handoffs for select to authenticated using(teacher_id=(select auth.uid()) and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create policy guardian_handoff_add on public.guardian_report_handoffs for insert to authenticated with check(teacher_id=(select auth.uid()) and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create index guardian_report_handoffs_student on public.guardian_report_handoffs(student_id,teacher_id,created_at desc);
