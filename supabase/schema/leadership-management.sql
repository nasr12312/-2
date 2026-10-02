create or replace function private.is_leadership() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(private.current_role() in ('admin','principal','supervisor','supervisor_teacher'),false); $$;
create or replace function private.can_view_student(target_student_id text) returns boolean language sql stable security definer set search_path=public as $$
 select private.current_role() is not null and (private.is_leadership() or exists(select 1 from public.family_students where user_id=auth.uid() and student_id=target_student_id) or exists(select 1 from public.students s join public.teacher_class_assignments t on t.class_id=s.class_id where s.id=target_student_id and t.teacher_id=auth.uid()));
$$;
revoke all on function private.is_leadership(),private.can_view_student(text) from public,anon;
grant execute on function private.is_leadership(),private.can_view_student(text) to authenticated;
create table if not exists public.supervisor_notes(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.profiles(user_id),author_id uuid not null references public.profiles(user_id),note_type text not null check(note_type in ('إشادة','توجيه','متابعة','إجراء مطلوب')),body text not null check(length(body) between 1 and 4000),created_at timestamptz not null default now());
alter table public.supervisor_notes enable row level security;
revoke all on public.supervisor_notes from anon,authenticated;
grant select,insert on public.supervisor_notes to authenticated;
grant all on public.supervisor_notes to service_role;
create policy "leadership or addressed teacher reads notes" on public.supervisor_notes for select to authenticated using (private.is_leadership() or (teacher_id=auth.uid() and private.current_role() is not null));
create policy "leadership writes supervision notes" on public.supervisor_notes for insert to authenticated with check(private.is_leadership() and author_id=auth.uid() and exists(select 1 from public.profiles p where p.user_id=teacher_id and p.role in ('teacher','head_teacher','supervisor_teacher','supervisor')));
create table if not exists public.platform_settings(id boolean primary key default true check(id),school text not null,term text not null,year text not null,updated_at timestamptz not null default now());
insert into public.platform_settings(id,school,term,year) values(true,'مدارس غراس الأخلاق الأهلية','الفصل الدراسي الأول','1448') on conflict(id) do nothing;
alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon,authenticated;
grant select on public.platform_settings to authenticated;
grant update(school,term,year,updated_at) on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
create policy "active accounts read school identity" on public.platform_settings for select to authenticated using(private.current_role() is not null);
create policy "administrator updates school identity" on public.platform_settings for update to authenticated using(private.current_role() in ('admin','principal')) with check(private.current_role() in ('admin','principal'));
grant update(assignment_text,day_name,week_label,assignment_type) on public.quran_plan_entries to authenticated;
create policy "leadership updates curriculum" on public.quran_plan_entries for update to authenticated using(private.is_leadership()) with check(private.is_leadership());
create or replace function public.school_staff() returns table(user_id uuid,full_name text,role public.app_role,active boolean,setup_complete boolean) language plpgsql stable security definer set search_path=public as $$
begin
 if not private.is_leadership() then raise exception 'Leadership only' using errcode='42501'; end if;
 return query select p.user_id,p.full_name,p.role,p.active,p.setup_complete from public.profiles p where p.role<>'family' order by p.full_name;
end; $$;
create or replace function public.set_teacher_classes(target_teacher uuid,selected_classes text[]) returns void language plpgsql security definer set search_path=public as $$
declare label text;
begin
 if not private.is_leadership() then raise exception 'Leadership only' using errcode='42501'; end if;
 select full_name into label from public.profiles where user_id=target_teacher and role in ('teacher','head_teacher','supervisor_teacher') and active for update;
 if label is null then raise exception 'Invalid teacher'; end if;
 if selected_classes is null or cardinality(selected_classes)>50 or exists(select 1 from unnest(selected_classes) x where not exists(select 1 from public.classes c where c.id=x and c.active)) then raise exception 'Invalid classes'; end if;
 delete from public.teacher_class_assignments where teacher_id=target_teacher;
 insert into public.teacher_class_assignments(teacher_id,class_id) select target_teacher,x from (select distinct unnest(selected_classes) x) items;
 update public.profiles set setup_complete=true where user_id=target_teacher;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'تحديث شعب المعلم: '||label,'teacher_assignments',target_teacher::text);
end; $$;
create or replace function public.move_student_class(target_student text,target_class text) returns void language plpgsql security definer set search_path=public as $$
declare old_class text; student_program text;old_stage text;old_grade text;
begin
 if not private.is_leadership() then raise exception 'Leadership only' using errcode='42501'; end if;
 select s.class_id,s.program_id into old_class,student_program from public.students s where s.id=target_student and s.active for update;
 select c.stage,c.grade into old_stage,old_grade from public.classes c where c.id=old_class;
 if not exists(select 1 from public.classes c where c.id=target_class and c.program_id=student_program and c.stage=old_stage and c.grade=old_grade and c.active) then raise exception 'Class must match program, stage and grade'; end if;
 update public.students set class_id=target_class where id=target_student;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'نقل طالب إلى شعبة من نفس الصف والبرنامج','student_class',target_student);
end; $$;
create or replace function public.save_school_class(program text,stage_name text,grade_name text,section_name text) returns text language plpgsql security definer set search_path=public as $$
declare new_id text;
begin
 if not private.is_leadership() then raise exception 'Leadership only' using errcode='42501'; end if;
 if program not in ('diploma','bilingual') or length(trim(stage_name)) not between 1 and 60 or length(trim(grade_name)) not between 1 and 60 or length(trim(section_name)) not between 1 and 30 or section_name='غير موزع' then raise exception 'Invalid class'; end if;
 if not exists(select 1 from public.classes c where c.active and c.program_id=program and c.stage=trim(stage_name) and c.grade=trim(grade_name)) then raise exception 'Unknown grade'; end if;
 insert into public.classes(id,program_id,name,stage,grade,section) values(gen_random_uuid()::text,program,trim(grade_name)||' - '||trim(section_name),trim(stage_name),trim(grade_name),trim(section_name)) on conflict(program_id,stage,grade,section) do update set active=true returning id into new_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'إضافة أو تفعيل شعبة: '||grade_name||' - '||section_name,'class',new_id);
 return new_id;
end; $$;
create or replace function private.note_notice() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.notifications(recipient_id,title,body,page) values(new.teacher_id,'متابعة إشرافية: '||new.note_type,new.body,'notifications');
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(new.author_id,'إضافة ملاحظة إشرافية','supervisor_note',new.id::text);
 return new;
end; $$;
revoke all on function private.note_notice() from public,anon,authenticated;
create trigger supervisor_note_notice after insert on public.supervisor_notes for each row execute function private.note_notice();
revoke all on function public.school_staff(),public.set_teacher_classes(uuid,text[]),public.move_student_class(text,text),public.save_school_class(text,text,text,text) from public,anon;
grant execute on function public.school_staff(),public.set_teacher_classes(uuid,text[]),public.move_student_class(text,text),public.save_school_class(text,text,text,text) to authenticated;
update public.profiles set setup_complete=true where role in ('supervisor','supervisor_teacher');
