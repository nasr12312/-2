-- Minimal directory and atomic enrollment changes. Existing table RLS stays intact.
-- Private definer functions are necessary for the explicitly authorized cross-roster
-- lookup and enrollment change; actor identity, active role and destination are checked.
create function private.find_pathway_students(term text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare q text:=private.roster_key(left(btrim(term),150));
begin
if auth.uid() is null or coalesce(private.current_role()::text,'') not in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') then raise exception 'غير مسموح' using errcode='42501';end if;
if length(q)<3 or (q~'^[0-9]+$' and length(q)<>10) then return '[]'::jsonb;end if;
return coalesce((select jsonb_agg(to_jsonb(x)) from (
 select s.id,s.full_name,s.program_id,s.class_id,s.active,c.stage,c.grade,c.section,
 coalesce((select jsonb_agg(jsonb_build_object('program_id',e.program_id,'class_id',e.class_id,'active',e.active)) from public.students e where e.national_id=s.national_id),'[]'::jsonb) as enrollments
 from public.students s join public.classes c on c.id=s.class_id
 where (q~'^[0-9]{10}$' and s.national_id=q) or (q!~'^[0-9]+$' and strpos(private.roster_key(s.full_name),q)>0)
 order by s.full_name,s.program_id limit 20
) x),'[]'::jsonb);
end$$;
create function public.find_pathway_students(term text) returns jsonb language sql stable security invoker set search_path='' as $$select private.find_pathway_students(term)$$;
revoke all on function private.find_pathway_students(text),public.find_pathway_students(text) from public,anon;
grant execute on function private.find_pathway_students(text),public.find_pathway_students(text) to authenticated;

create function private.place_pathway_student(source_id text,destination_id text,placement text) returns jsonb language plpgsql security definer set search_path='' as $$
declare source public.students; destination public.classes; existing public.students; result_id text; actor uuid:=auth.uid(); family uuid; changed boolean:=false;
begin
if actor is null or coalesce(private.current_role()::text,'') not in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') then raise exception 'غير مسموح' using errcode='42501';end if;
if placement is null or placement not in('add','move') then raise exception 'اختر إضافة أو نقل';end if;
select * into destination from public.classes where id=destination_id and active for share;
if destination.id is null or not private.manage_class(destination.id) then raise exception 'اختر شعبة نشطة من شعبك' using errcode='42501';end if;
select * into source from public.students where id=source_id;
if source.id is null then raise exception 'الطالب غير موجود؛ أعد البحث';end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(source.national_id,0));
select * into source from public.students where id=source_id for update;
if source.id is null then raise exception 'الطالب غير موجود؛ أعد البحث';end if;
if private.roster_key(destination.stage)<>(select private.roster_key(stage) from public.classes where id=source.class_id) or private.roster_key(destination.grade)<>(select private.roster_key(grade) from public.classes where id=source.class_id) then raise exception 'اختر شعبة في صف الطالب الحالي. تغيير الصف يُراجع لدى الإدارة';end if;
select * into existing from public.students where national_id=source.national_id and program_id=destination.program_id for update;
if existing.id is not null then
 if placement='add' and existing.active and existing.class_id<>destination.id then raise exception 'الطالب مسجل بالفعل في هذا المسار بشعبة أخرى؛ اختر النقل لتغيير شعبته';end if;
 result_id:=existing.id;
 if existing.class_id<>destination.id or not existing.active then
 update public.students set class_id=destination.id,active=true,account_status='active',enrollment_status='enrolled' where id=existing.id;changed:=true;
 end if;
else
 select f.user_id into family from public.family_students f join public.profiles p on p.user_id=f.user_id where f.student_id=source.id and p.role='family' and p.active;
 if family is null or (select count(*) from public.family_students where student_id=source.id)<>1 then raise exception 'يلزم مراجعة ربط حساب ولي الأمر لدى الإدارة';end if;
 result_id:=gen_random_uuid()::text;
 insert into public.students(id,full_name,national_id,program_id,class_id,active,account_status,enrollment_status) values(result_id,source.full_name,source.national_id,destination.program_id,destination.id,true,'active','enrolled');
 insert into public.family_students(user_id,student_id) values(family,result_id);changed:=true;
end if;
if placement='move' and source.program_id<>destination.program_id and source.active then
 update public.students set active=false,account_status='disabled' where id=source.id;changed:=true;
end if;
if changed then insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(actor,case placement when 'add' then 'إضافة طالب إلى مسار مع حفظ تسجيله السابق' else 'نقل طالب بين المسارات والشعب مع حفظ سجلاته' end,'student_pathway',result_id);end if;
return jsonb_build_object('ok',true,'id',result_id,'changed',changed);
end$$;
create function public.place_pathway_student(source_id text,destination_id text,placement text) returns jsonb language sql security invoker set search_path='' as $$select private.place_pathway_student(source_id,destination_id,placement)$$;
revoke all on function private.place_pathway_student(text,text,text),public.place_pathway_student(text,text,text) from public,anon;
grant execute on function private.place_pathway_student(text,text,text),public.place_pathway_student(text,text,text) to authenticated;
