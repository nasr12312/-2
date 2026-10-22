-- Integration check uses an existing valid row and rolls everything back, including notices.
begin;
do $$
declare original public.evaluations%rowtype; saved_id uuid; before_count bigint;
begin
 select * into strict original from public.evaluations order by evaluated_at desc limit 1;
 select count(*) into before_count from public.evaluations;
 insert into public.evaluations(client_key,student_id,teacher_id,grade,score,scores,notes,evaluated_at)
 values(original.client_key||' · إنجاز فردي duplicate-test',original.student_id,original.teacher_id,original.grade,original.score,original.scores,original.notes,original.evaluated_at)
 on conflict(client_key) do update set grade=excluded.grade returning id into saved_id;
 if saved_id<>original.id or (select count(*) from public.evaluations)<>before_count then raise exception 'Legacy upsert created a duplicate'; end if;
 begin
  insert into public.evaluations(client_key,student_id,teacher_id,grade)
  values(original.client_key||' · حالة يومية',original.student_id,original.teacher_id,original.grade);
  raise exception 'Plain duplicate insert was accepted';
 exception when unique_violation then null;
 end;
 begin
  insert into public.evaluations(client_key,student_id,teacher_id,grade)
  values('wrong-student|1|0|الحفظ',original.student_id,original.teacher_id,original.grade);
  raise exception 'Mismatched identity accepted';
 exception when check_violation then null;
 end;
end $$;
rollback;
