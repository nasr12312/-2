begin;
do $test$
declare teacher uuid;family uuid;own_class text;other_class text;entry text;original text;blocked boolean;
begin
select a.teacher_id,c.id,q.id,q.assignment_text into teacher,own_class,entry,original from public.teacher_class_assignments a join public.profiles p on p.user_id=a.teacher_id and p.role='teacher' and p.active join public.classes c on c.id=a.class_id and c.active join public.quran_plan_entries q on q.program_id=c.program_id and position(private.roster_key(c.grade) in private.roster_key(q.grade))>0 and ((c.stage like '%ابتدا%' and q.stage like '%ابتدا%') or (c.stage like '%متوسط%' and q.stage like '%متوسط%')) limit 1;
select c.id into other_class from public.classes c where c.active and not exists(select 1 from public.teacher_class_assignments a where a.teacher_id=teacher and a.class_id=c.id) limit 1;
select f.user_id into family from public.family_students f join public.students s on s.id=f.student_id where s.class_id=own_class and s.active limit 1;
if family is null or entry is null then raise exception 'Missing fixtures';end if;
perform set_config('request.jwt.claims',jsonb_build_object('sub',teacher,'role','authenticated')::text,true);execute 'set local role authenticated';
perform public.save_class_plan(own_class,entry,'مقرر تحقق داخل معاملة ملغاة');
perform public.save_class_plan(own_class,entry,'تعديل تحقق ثانٍ');
if (select assignment_text from public.class_plan_overrides where class_id=own_class and plan_entry_id=entry)<>'تعديل تحقق ثانٍ' then raise exception 'Own class update failed';end if;
if (select assignment_text from public.quran_plan_entries where id=entry)<>original then raise exception 'Shared original modified';end if;
blocked:=false;begin perform public.save_class_plan(other_class,entry,'غير مسموح');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Other class changed';end if;
perform set_config('request.jwt.claims',jsonb_build_object('sub',family,'role','authenticated')::text,true);
if not exists(select 1 from public.class_plan_overrides where class_id=own_class and plan_entry_id=entry) then raise exception 'Family does not see class plan';end if;
blocked:=false;begin perform public.save_class_plan(own_class,entry,'تعديل ولي الأمر');exception when insufficient_privilege then blocked:=true;end;if not blocked then raise exception 'Family edit permitted';end if;
execute 'reset role';
if (select 'video/mp4'=any(allowed_mime_types) from storage.buckets where id='recitations') then raise exception 'Video storage still enabled';end if;
if not exists(select 1 from pg_trigger where tgname='recitations_audio_only' and not tgisinternal) then raise exception 'Audio guard missing';end if;
end $test$;
select 'PASS: teacher scoped plan insert/update, parent visibility, other class and parent write denial, original preserved and audio-only storage. All writes rolled back.' as result;
rollback;
