alter table public.evaluations add column if not exists written_feedback text not null default '', add column if not exists encouragement text not null default '', add column if not exists next_step text not null default '';
alter table public.platform_settings add column if not exists term_start_date date not null default '2026-08-23';
grant update(term_start_date) on public.platform_settings to authenticated;
create table public.evaluation_followups(evaluation_id uuid references public.evaluations(id) on delete cascade,parent_id uuid references public.profiles(user_id),evaluation_version timestamptz not null,followed_at timestamptz not null default now(),primary key(evaluation_id,parent_id));
alter table public.evaluation_followups enable row level security;
grant select on public.evaluation_followups to authenticated;
create policy followups_read on public.evaluation_followups for select to authenticated using(exists(select 1 from public.evaluations e where e.id=evaluation_id and private.can_view_student(e.student_id)) and (parent_id=auth.uid() or private.current_role()<>'family'));
create function private.follow_evaluation(target uuid) returns void language plpgsql security definer set search_path='' as $$
declare v public.evaluations; begin
 select * into v from public.evaluations where id=target;
 if private.current_role()<>'family' or not exists(select 1 from public.family_students where user_id=auth.uid() and student_id=v.student_id) then raise exception 'غير مسموح'; end if;
 insert into public.evaluation_followups(evaluation_id,parent_id,evaluation_version) values(v.id,auth.uid(),v.evaluated_at) on conflict(evaluation_id,parent_id) do update set evaluation_version=excluded.evaluation_version,followed_at=now();
end $$;
create function public.follow_evaluation(target uuid) returns void language sql security invoker set search_path='' as $$select private.follow_evaluation(target)$$;
revoke all on function private.follow_evaluation(uuid),public.follow_evaluation(uuid) from public,anon;
grant execute on function private.follow_evaluation(uuid),public.follow_evaluation(uuid) to authenticated;
create function private.visible_evaluations() returns table(id uuid,client_key text,student_id text,grade text,score smallint,scores jsonb,notes text,teacher_id uuid,evaluated_at timestamptz,plan_entry_id text,written_feedback text,encouragement text,next_step text,teacher_name text) language sql stable security definer set search_path='' as $$
select e.id,e.client_key,e.student_id,e.grade,e.score,e.scores,e.notes,e.teacher_id,e.evaluated_at,e.plan_entry_id,e.written_feedback,e.encouragement,e.next_step,p.full_name from public.evaluations e left join public.profiles p on p.user_id=e.teacher_id where auth.uid() is not null and private.can_view_student(e.student_id) order by e.evaluated_at desc$$;
create function public.visible_evaluations() returns table(id uuid,client_key text,student_id text,grade text,score smallint,scores jsonb,notes text,teacher_id uuid,evaluated_at timestamptz,plan_entry_id text,written_feedback text,encouragement text,next_step text,teacher_name text) language sql stable security invoker set search_path='' as $$select * from private.visible_evaluations()$$;
revoke all on function private.visible_evaluations(),public.visible_evaluations() from public,anon;
grant execute on function private.visible_evaluations(),public.visible_evaluations() to authenticated;
create table public.quran_homework(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.profiles(user_id),class_id text not null references public.classes(id),student_id text references public.students(id),kind text not null check(kind in('مقرأة','حفظ','تلاوة','مراجعة','تثبيت','استماع')),title text not null check(length(title) between 1 and 2000),instructions text not null default '' check(length(instructions)<=2000),due_date date not null,created_at timestamptz not null default now());
alter table public.quran_homework enable row level security;
grant select,insert on public.quran_homework to authenticated;
create policy homework_read on public.quran_homework for select to authenticated using (exists(select 1 from public.students s where s.class_id=quran_homework.class_id and (quran_homework.student_id is null or s.id=quran_homework.student_id) and private.can_view_student(s.id)));
create policy homework_add on public.quran_homework for insert to authenticated with check(teacher_id=auth.uid() and private.current_role() in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') and (private.is_leadership() or exists(select 1 from public.teacher_class_assignments a where a.teacher_id=auth.uid() and a.class_id=quran_homework.class_id)) and (student_id is null or exists(select 1 from public.students s where s.id=quran_homework.student_id and s.class_id=quran_homework.class_id)));
create index homework_class_due on public.quran_homework(class_id,due_date);
create table public.homework_followups(homework_id uuid references public.quran_homework(id) on delete cascade,student_id text references public.students(id),parent_id uuid references public.profiles(user_id),followed_at timestamptz not null default now(),primary key(homework_id,student_id,parent_id));
alter table public.homework_followups enable row level security;
grant select,insert on public.homework_followups to authenticated;
create policy homework_followups_read on public.homework_followups for select to authenticated using(private.can_view_student(student_id) and (parent_id=auth.uid() or private.current_role()<>'family'));
create policy homework_followups_add on public.homework_followups for insert to authenticated with check(parent_id=auth.uid() and private.current_role()='family' and exists(select 1 from public.family_students f where f.user_id=auth.uid() and f.student_id=homework_followups.student_id) and exists(select 1 from public.quran_homework h join public.students s on s.class_id=h.class_id where h.id=homework_id and s.id=homework_followups.student_id and (h.student_id is null or h.student_id=s.id)));
create function private.homework_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
insert into public.notifications(recipient_id,student_id,title,body,page) select distinct f.user_id,s.id,'واجب جديد • '||new.kind,new.title||E'\n'||new.instructions||E'\nموعد المتابعة: '||new.due_date,'homework' from public.students s join public.family_students f on f.student_id=s.id where s.class_id=new.class_id and (new.student_id is null or new.student_id=s.id); return new;end $$;
revoke all on function private.homework_notice() from public,anon,authenticated;
create trigger homework_notice after insert on public.quran_homework for each row execute function private.homework_notice();
create or replace function private.notify_family_evaluation() returns trigger language plpgsql security definer set search_path='' as $$begin
if new.grade is not null and new.grade<>'' then
insert into public.notifications(recipient_id,student_id,title,body,page) select f.user_id,new.student_id,'تقييم جديد: '||new.grade,concat_ws(E'\n',nullif(new.written_feedback,''),nullif(new.notes,''),nullif(new.encouragement,''),nullif(new.next_step,'')),'quran' from public.family_students f where f.student_id=new.student_id;end if;return new;end $$;