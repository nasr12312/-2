create table public.student_report_drafts (
student_id text not null references public.students(id) on delete cascade,
teacher_id uuid not null default auth.uid() references public.profiles(user_id),
title text not null check(length(btrim(title)) between 1 and 150),
summary text not null default '' check(length(summary)<=3000),
recommendation text not null default '' check(length(recommendation)<=3000),
primary key(student_id,teacher_id));
alter table public.student_report_drafts enable row level security;
revoke all on public.student_report_drafts from anon,authenticated;
grant select,insert,update on public.student_report_drafts to authenticated;
create policy report_draft_read on public.student_report_drafts for select to authenticated using(teacher_id=auth.uid() and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create policy report_draft_insert on public.student_report_drafts for insert to authenticated with check(teacher_id=auth.uid() and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
create policy report_draft_update on public.student_report_drafts for update to authenticated using(teacher_id=auth.uid() and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id))) with check(teacher_id=auth.uid() and exists(select 1 from public.students s where s.id=student_id and private.manage_class(s.class_id)));
