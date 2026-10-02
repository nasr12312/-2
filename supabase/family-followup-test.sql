begin;
do $test$
declare teacher uuid; family uuid; sid text; cid text; other_sid text; eid uuid; hid uuid; visible_count int;
begin
select p.user_id into teacher from public.profiles p where p.full_name='عبد الرحمن علي نصر الله' and p.role='teacher';
select s.id,s.class_id,f.user_id into sid,cid,family from public.students s join public.family_students f on f.student_id=s.id join public.teacher_class_assignments a on a.class_id=s.class_id where a.teacher_id=teacher limit 1;
select s.id into other_sid from public.students s where s.class_id<>cid and not exists(select 1 from public.family_students f where f.student_id=s.id and f.user_id=family) limit 1;
perform set_config('request.jwt.claim.sub',teacher::text,true);
set local role authenticated;
insert into public.evaluations(client_key,student_id,grade,score,scores,teacher_id,evaluated_at,written_feedback) values('rollback-test-followup',sid,'جيد',3,'[3,3,3,3,3,3]',teacher,now(),'اختبار معاملات لا يحفظ') returning id into eid;
insert into public.quran_homework(teacher_id,class_id,student_id,kind,title,due_date) values(teacher,cid,sid,'مقرأة','اختبار لا يحفظ',current_date) returning id into hid;
begin
insert into public.quran_homework(teacher_id,class_id,student_id,kind,title,due_date) values(teacher,cid,other_sid,'مقرأة','اختبار نطاق',current_date);
raise exception 'cross-class homework allowed';
exception when insufficient_privilege then null; end;
reset role;
perform set_config('request.jwt.claim.sub',family::text,true);set local role authenticated;
perform public.follow_evaluation(eid);
if not exists(select 1 from public.evaluation_followups where evaluation_id=eid) then raise exception 'followup not saved';end if;
insert into public.homework_followups(homework_id,student_id,parent_id) values(hid,sid,family);
select count(*) into visible_count from public.visible_evaluations() where student_id=other_sid;
if visible_count<>0 then raise exception 'other child evaluation exposed';end if;
begin
insert into public.quran_homework(teacher_id,class_id,kind,title,due_date) values(family,cid,'حفظ','family denied',current_date);
raise exception 'family created homework';
exception when insufficient_privilege then null;end;
reset role;perform set_config('request.jwt.claim.sub',teacher::text,true);set local role authenticated;
update public.evaluations set evaluated_at=now()+interval '1 second' where id=eid;
if exists(select 1 from public.evaluation_followups f join public.evaluations e on e.id=f.evaluation_id where e.id=eid and f.evaluation_version=e.evaluated_at) then raise exception 'stale followup still current';end if;
reset role;
end $test$;
rollback;
select 'passed: scoped homework, parent followup, version invalidation, family readonly; all test changes rolled back' as verification;