begin;
do $test$
declare actor uuid; family uuid; source_id text; source_class text; target_class text; forbidden_class text; target_program text; identity_number text; before_source jsonb; r jsonb; added_id text; blocked boolean; directory jsonb;
begin
select a.teacher_id,s.id,s.class_id,c.id,c.program_id,s.national_id,f.user_id into actor,source_id,source_class,target_class,target_program,identity_number,family
from public.teacher_class_assignments a join public.profiles p on p.user_id=a.teacher_id and p.role='teacher' and p.active
join public.classes c on c.id=a.class_id and c.active
join public.classes sc on private.roster_key(sc.stage)=private.roster_key(c.stage) and private.roster_key(sc.grade)=private.roster_key(c.grade) and sc.program_id<>c.program_id
join public.students s on s.class_id=sc.id and s.active
join public.family_students f on f.student_id=s.id
where not exists(select 1 from public.students e where e.national_id=s.national_id and e.program_id=c.program_id) limit 1;
if source_id is null then raise exception 'No real cross-pathway fixtures';end if;
select to_jsonb(s) into before_source from public.students s where id=source_id;
select c.id into forbidden_class from public.classes c where c.active and not exists(select 1 from public.teacher_class_assignments a where a.class_id=c.id and a.teacher_id=actor) limit 1;
insert into public.teacher_class_assignments(teacher_id,class_id) values(actor,source_class) on conflict do nothing;
perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
execute 'set local role authenticated';
if public.find_pathway_students('12')<>'[]'::jsonb or public.find_pathway_students('%_%')<>'[]'::jsonb then raise exception 'Broad query accepted';end if;
directory:=public.find_pathway_students(identity_number);
if jsonb_array_length(directory)<>1 or directory->0 ? 'national_id' or directory->0 ? 'family_id' then raise exception 'Directory missing or leaks identifiers';end if;
blocked:=false;begin perform public.place_pathway_student(source_id,forbidden_class,'move');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Unassigned destination accepted';end if;
r:=public.place_pathway_student(source_id,target_class,'add');added_id:=r->>'id';
r:=public.place_pathway_student(source_id,target_class,'add');if (r->>'changed')::boolean or r->>'id'<>added_id then raise exception 'Repeated addition duplicated student';end if;
execute 'reset role';
if (select to_jsonb(s) from public.students s where id=source_id)<>before_source then raise exception 'Addition changed source enrollment';end if;
if (select count(*) from public.students where national_id=identity_number and program_id=target_program)<>1 then raise exception 'Duplicate target enrollment';end if;
if not exists(select 1 from public.family_students where user_id=family and student_id=added_id) then raise exception 'Family linkage not preserved';end if;
execute 'set local role authenticated';
perform public.place_pathway_student(source_id,target_class,'move');
execute 'reset role';
if (select active from public.students where id=source_id) or not (select active from public.students where id=added_id) then raise exception 'Move did not archive source and activate target';end if;
if (select class_id from public.students where id=source_id)<>source_class then raise exception 'Historical source class changed';end if;
execute 'set local role authenticated';
r:=public.place_pathway_student(added_id,source_class,'move');if r->>'id'<>source_id then raise exception 'Reverse move failed to reuse original';end if;
execute 'reset role';
if not (select active from public.students where id=source_id) or (select active from public.students where id=added_id) then raise exception 'Reverse move state incorrect';end if;
perform set_config('request.jwt.claims',jsonb_build_object('sub',family,'role','authenticated')::text,true);
execute 'set local role authenticated';
blocked:=false;begin perform public.find_pathway_students(identity_number);exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Parent directory exposed';end if;
blocked:=false;begin perform public.place_pathway_student(source_id,target_class,'move');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Parent placement permitted';end if;
execute 'reset role';execute 'set local role anon';
blocked:=false;begin perform public.find_pathway_students('طالب');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Anonymous directory exposed';end if;
execute 'reset role';
end $test$;
select 'PASS: exact lookup privacy, assigned destination, add, idempotency, move, reverse restore, shared family, parent and anonymous denial. All writes rolled back.' as result;
rollback;
