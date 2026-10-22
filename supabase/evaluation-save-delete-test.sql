begin;
do $test$
declare e public.evaluations%rowtype; target_key text; saved uuid; family_id uuid; affected integer;
begin
 select x.* into strict e from public.evaluations x join public.students s on s.id=x.student_id
 join public.profiles p on p.user_id=x.teacher_id and p.active
 join public.teacher_class_assignments a on a.teacher_id=x.teacher_id and a.class_id=s.class_id
 where x.plan_entry_id is not null and p.role in ('teacher','head_teacher','supervisor_teacher')
 and exists(select 1 from public.family_students f join public.profiles fp on fp.user_id=f.user_id and fp.active and fp.role='family' where f.student_id=x.student_id) limit 1;
 select f.user_id into family_id from public.family_students f join public.profiles p on p.user_id=f.user_id and p.active and p.role='family' where f.student_id=e.student_id limit 1;
 select e.student_id||'|'||w||'|'||d||'|'||split_part(e.client_key,'|',4) into strict target_key
 from generate_series(1,17) w cross join generate_series(0,4) d
 where not exists(select 1 from public.evaluations x where x.client_key=e.student_id||'|'||w||'|'||d||'|'||split_part(e.client_key,'|',4)) limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',e.teacher_id,'role','authenticated')::text,true);
 set local role authenticated;
 insert into public.evaluations(client_key,student_id,teacher_id,plan_entry_id,grade,score,scores,notes)
 values(target_key,e.student_id,e.teacher_id,e.plan_entry_id,e.grade,e.score,e.scores,e.notes) returning id into saved;
 if saved is null then raise exception 'Assigned teacher save failed'; end if;
 update public.evaluations set grade=e.grade where id=saved;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'Assigned teacher edit failed';end if;
 begin
  insert into public.evaluations(client_key,student_id,teacher_id,grade) values(target_key,e.student_id,e.teacher_id,e.grade);
  raise exception 'Duplicate daily evaluation was accepted';
 exception when unique_violation then null;end;
 delete from public.evaluations where id=saved and student_id=e.student_id;
 get diagnostics affected=row_count;if affected<>1 then raise exception 'Assigned teacher deletion failed';end if;
 if has_table_privilege('authenticated','private.deleted_evaluations','SELECT') then raise exception 'Deletion archive is exposed';end if;
 reset role;
 if not exists(select 1 from private.deleted_evaluations a where a.evaluation_id=saved and a.deleted_by=e.teacher_id and a.original_record->>'notes'=e.notes) then raise exception 'Deleted original was not archived';end if;
 if family_id is null then raise exception 'Family permission fixture is missing';end if;
 if family_id is not null then
  perform set_config('request.jwt.claims',jsonb_build_object('sub',family_id,'role','authenticated')::text,true);
  set local role authenticated;
  delete from public.evaluations where id=e.id;
  get diagnostics affected=row_count;if affected<>0 then raise exception 'Family deleted an evaluation';end if;
  reset role;
 end if;
 if not exists(select 1 from public.evaluations where id=e.id) then raise exception 'Original evaluation was lost';end if;
end $test$;
rollback;
