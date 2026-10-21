begin;
do $test$
declare actor uuid; child text; family uuid; other_family uuid; other_teacher uuid; report_id uuid; blocked boolean;
begin
 select a.teacher_id,s.id,f.user_id into actor,child,family from public.teacher_class_assignments a join public.profiles p on p.user_id=a.teacher_id and p.active and p.role='teacher' join public.students s on s.class_id=a.class_id and s.active join public.family_students f on f.student_id=s.id limit 1;
 select p.user_id into other_family from public.profiles p where p.role='family' and p.user_id<>family and not exists(select 1 from public.family_students f where f.user_id=p.user_id and f.student_id=child) limit 1;
 select user_id into other_teacher from public.profiles where role='teacher' and user_id<>actor limit 1;
 if actor is null or other_family is null or other_teacher is null then raise exception 'Missing fixtures';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);execute 'set local role authenticated';
 insert into public.teacher_contact_settings(user_id,whatsapp_phone) values(actor,'966500000000') on conflict(user_id) do update set whatsapp_phone=excluded.whatsapp_phone;
 blocked:=false;begin insert into public.teacher_contact_settings(user_id,whatsapp_phone) values(other_teacher,'966500000000') on conflict(user_id) do update set whatsapp_phone=excluded.whatsapp_phone;exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Other teacher contact writable';end if;
 insert into public.shared_student_reports(student_id,title,html) values(child,'اختبار ضمن معاملة','<p>Private report</p>') returning id into report_id;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',family,'role','authenticated')::text,true);
 if not exists(select 1 from public.shared_student_reports where id=report_id) then raise exception 'Linked parent cannot read report';end if;
 if exists(select 1 from public.teacher_contact_settings) then raise exception 'Teacher contact exposed to family';end if;
 blocked:=false;begin insert into public.shared_student_reports(student_id,title,html) values(child,'Forbidden','x');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Family can create reports';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',other_family,'role','authenticated')::text,true);
 if exists(select 1 from public.shared_student_reports where id=report_id) then raise exception 'Other family sees report by known id';end if;
 execute 'reset role';execute 'set local role anon';blocked:=false;begin perform html from public.shared_student_reports where id=report_id;exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Report link is public';end if;
 execute 'reset role';
end $test$;
select 'PASS: personal teacher settings, immutable report creation, linked-family access, unrelated-family and anonymous denial. All test writes rolled back.' as result;
rollback;
