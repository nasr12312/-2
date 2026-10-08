begin;
do $$
declare actor uuid; child text; family uuid; outsider text; other_family uuid;
begin
 select a.teacher_id,s.id,f.user_id into actor,child,family from public.teacher_class_assignments a join public.students s on s.class_id=a.class_id join public.family_students f on f.student_id=s.id join public.profiles p on p.user_id=a.teacher_id where p.role='teacher' and p.active and s.active limit 1;
 select s.id,f.user_id into outsider,other_family from public.students s join public.family_students f on f.student_id=s.id where f.user_id<>family and not exists(select 1 from public.teacher_class_assignments a where a.teacher_id=actor and a.class_id=s.class_id) and s.active limit 1;
 if actor is null or outsider is null then raise exception 'Missing verification fixtures';end if;
 perform set_config('test.teacher',actor::text,true);perform set_config('test.child',child,true);perform set_config('test.family',family::text,true);perform set_config('test.other_family',other_family::text,true);perform set_config('test.outsider',outsider,true);perform set_config('test.message',gen_random_uuid()::text,true);perform set_config('request.jwt.claim.sub',actor::text,true);
end$$;
set local role authenticated;
do $$
declare item jsonb; result jsonb; failed_id uuid:=gen_random_uuid(); denied boolean:=false;
begin
 item:=jsonb_build_object('id',current_setting('test.message'),'student_id',current_setting('test.child'),'body','Verification only: transaction rolled back','html','<html>Private test report</html>','file_name','test.html','period_from','2026-10-04','period_to','2026-10-10');
 result:=public.send_weekly_reports(jsonb_build_array(item));if (result->>'sent')::int<>1 then raise exception 'Expected one delivery';end if;
 result:=public.send_weekly_reports(jsonb_build_array(item));if (result->>'sent')::int<>0 then raise exception 'Duplicate delivery';end if;
 begin
  perform public.send_weekly_reports(jsonb_build_array(item||jsonb_build_object('id',failed_id),item||jsonb_build_object('id',gen_random_uuid(),'student_id',current_setting('test.outsider'))));
 exception when insufficient_privilege then denied:=true;end;
 if not denied or exists(select 1 from public.school_private_messages where id=failed_id) then raise exception 'Unauthorized batch was not atomic';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.family'),true);
set local role authenticated;
do $$
declare denied boolean:=false;
begin
 if (select count(*) from public.school_weekly_reports where message_id=current_setting('test.message')::uuid)<>1 then raise exception 'Recipient cannot read report';end if;
 begin perform public.send_weekly_reports('[]'::jsonb);exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'Family can send staff reports';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.other_family'),true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.school_weekly_reports where message_id=current_setting('test.message')::uuid) then raise exception 'Unrelated family can read report';end if;
end$$;
reset role;
rollback;
