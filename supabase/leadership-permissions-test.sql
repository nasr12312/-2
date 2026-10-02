begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.profiles where full_name='باسم مرزوق' and role='supervisor'),true);
set local role authenticated;
do $$
declare t uuid; assigned text[]; sid text;cid text;p text;st text;g text;sec text; rows_changed integer;
begin
 if (select count(*) from public.students where active)<>340 then raise exception 'Supervisor school scope test failed'; end if;
 select user_id into t from public.profiles where full_name='عبد الرحمن علي نصر الله';
 select array_agg(class_id) into assigned from public.teacher_class_assignments where teacher_id=t;
 perform public.set_teacher_classes(t,assigned);
 if (select count(*) from public.teacher_class_assignments where teacher_id=t)<>cardinality(assigned) then raise exception 'Assignment write test failed'; end if;
 select id,class_id into sid,cid from public.students where active limit 1;
 perform public.move_student_class(sid,cid);
 select program_id,stage,grade,section into p,st,g,sec from public.classes where active and section<>'غير موزع' limit 1;
 perform public.save_school_class(p,st,g,sec);
 insert into public.supervisor_notes(teacher_id,author_id,note_type,body) values(t,auth.uid(),'متابعة','اختبار صلاحيات مؤقت يُلغى بالكامل');
 update public.quran_plan_entries set assignment_text=assignment_text where id=(select id from public.quran_plan_entries limit 1);
 update public.platform_settings set term=term where id=true;
 get diagnostics rows_changed=row_count;
 if rows_changed<>0 then raise exception 'Supervisor changed administrator settings'; end if;
end; $$;
select set_config('request.jwt.claim.sub',(select user_id::text from public.profiles where full_name='مدير مقرأة غراس' and role='admin'),true);
do $$
declare rows_changed integer;
begin
 update public.platform_settings set term=term where id=true;
 get diagnostics rows_changed=row_count;
 if rows_changed<>1 then raise exception 'Administrator settings write failed'; end if;
 if (select count(*) from public.audit_logs where actor_id=auth.uid())<1 then raise exception 'Administrative audit missing'; end if;
end; $$;
rollback;