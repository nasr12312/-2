begin;
do $test$
declare actor uuid; child text; saved uuid;
begin
 select a.teacher_id,s.id into actor,child from public.teacher_class_assignments a join public.profiles p on p.user_id=a.teacher_id and p.active and p.role='teacher' join public.students s on s.class_id=a.class_id and s.active limit 1;
 if actor is null then raise exception 'No teacher fixture';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);execute 'set local role authenticated';
 insert into public.evaluations(client_key,student_id,teacher_id,grade,score,scores,notes,written_feedback) values('achievement-rollback-check-'||gen_random_uuid(),child,actor,'إنجاز مسجل دون درجة',null,'[]'::jsonb,'إنجاز اختبار داخل معاملة','ما سمّع فعليًا: الملك 12–15') returning id into saved;
 update public.evaluations set notes='تعديل الإنجاز: الملك 12–18',grade='جيد',score=3,scores='[3]'::jsonb where id=saved and student_id=child;
 if not exists(select 1 from public.evaluations where id=saved and notes='تعديل الإنجاز: الملك 12–18' and score=3) then raise exception 'Achievement edit failed';end if;
 execute 'reset role';
end $test$;
select 'PASS: assigned teacher can record ungraded achievement and edit the same record with one explicit score. All test records and notifications rolled back.' as result;
rollback;
