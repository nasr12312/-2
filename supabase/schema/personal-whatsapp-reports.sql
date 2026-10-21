create table public.teacher_contact_settings (
 user_id uuid primary key default auth.uid() references public.profiles(user_id),
 whatsapp_phone text not null check(whatsapp_phone='' or whatsapp_phone ~ '^[1-9][0-9]{7,14}$')
);
alter table public.teacher_contact_settings enable row level security;
revoke all on public.teacher_contact_settings from public,anon,authenticated;
grant select,insert,update on public.teacher_contact_settings to authenticated;
grant select,insert,update,delete on public.teacher_contact_settings to service_role;
create policy own_teacher_contact_read on public.teacher_contact_settings for select to authenticated using(user_id=(select auth.uid()) and private.current_role() in ('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal'));
create policy own_teacher_contact_add on public.teacher_contact_settings for insert to authenticated with check(user_id=(select auth.uid()) and private.current_role() in ('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal'));
create policy own_teacher_contact_update on public.teacher_contact_settings for update to authenticated using(user_id=(select auth.uid()) and private.current_role() in ('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal')) with check(user_id=(select auth.uid()) and private.current_role() in ('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal'));
create table public.shared_student_reports (
 id uuid primary key default gen_random_uuid(), student_id text not null references public.students(id),
 teacher_id uuid not null default auth.uid() references public.profiles(user_id),
 title text not null check(length(title) between 1 and 150),
 html text not null check(length(html) between 1 and 500000), created_at timestamptz not null default now()
);
alter table public.shared_student_reports enable row level security;
revoke all on public.shared_student_reports from public,anon,authenticated;
grant select,insert on public.shared_student_reports to authenticated;
grant select,insert,update,delete on public.shared_student_reports to service_role;
create policy shared_report_read on public.shared_student_reports for select to authenticated using(
 (teacher_id=(select auth.uid()) and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)))
 or (private.current_role()='family' and exists(select 1 from public.family_students f where f.student_id=shared_student_reports.student_id and f.user_id=(select auth.uid())))
);
create policy shared_report_add on public.shared_student_reports for insert to authenticated with check(teacher_id=(select auth.uid()) and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create index shared_student_reports_student on public.shared_student_reports(student_id,created_at desc);
