create or replace function public.teacher_management_commit(actor uuid,operation text,payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare role_name text; leader boolean; old public.students; class_row public.classes; new_id text; label text; number text; family_id uuid; prev_code text; target text; section_label text;
begin
select role::text into role_name from public.profiles where user_id=actor and active;
if role_name is null or role_name='family' then raise exception 'الحساب غير مخول';end if;
leader:=role_name in('admin','principal','supervisor','supervisor_teacher');
if operation in('students_bulk_archive','students_bulk_restore','students_bulk_move') then
if jsonb_array_length(payload->'ids') not between 1 and 50 then raise exception 'حدد من 1 إلى 50 طالبًا';end if;
for new_id in select jsonb_array_elements_text(payload->'ids') loop
perform public.teacher_management_commit(actor,case operation when 'students_bulk_archive' then 'student_archive' when 'students_bulk_restore' then 'student_restore' else 'student_move' end,jsonb_build_object('id',new_id,'class_id',payload->>'class_id'));end loop;return jsonb_build_object('ok',true,'count',jsonb_array_length(payload->'ids'));
elsif operation='profile_self' then
label:=btrim(payload->>'name');number:=payload->>'code';prev_code:=payload->>'previous_code';
if length(label) not between 3 and 150 or number !~ '^[0-9]{6,12}$' then raise exception 'راجع الاسم والرقم';end if;
perform 1 from public.profiles where user_id=actor and access_code=prev_code for update;
if not found then raise exception 'تغيرت بيانات الحساب، أعد المحاولة';end if;
if number<>prev_code and not exists(select 1 from auth.users where id=actor and email=number||'@login.gheras.local') then raise exception 'لم يكتمل تحديث الدخول';end if;
update public.profiles set full_name=label,access_code=number where user_id=actor;
new_id:=actor::text;
elsif operation in('student_save','student_archive','student_restore','student_move') then
if coalesce(payload->>'id','')<>'' then
select * into old from public.students where id=payload->>'id' for update;
if old.id is null or not (leader or exists(select 1 from public.teacher_class_assignments where teacher_id=actor and class_id=old.class_id)) then raise exception 'هذا الطالب خارج شعبك';end if;
end if;
if operation='student_save' then
label:=btrim(payload->>'name');number:=payload->>'national_id';target:=payload->>'class_id';family_id:=(payload->>'family_id')::uuid;
if length(label) not between 3 and 150 or number !~ '^[0-9]{10}$' then raise exception 'راجع الاسم والرقم الوطني المكون من 10 أرقام';end if;
select * into class_row from public.classes where id=target and active;
if class_row.id is null or not(leader or exists(select 1 from public.teacher_class_assignments where teacher_id=actor and class_id=target)) then raise exception 'الشعبة خارج نطاقك';end if;
if old.id is not null and old.class_id<>target then raise exception 'استخدم نقل الطالب لتغيير الشعبة';end if;
if old.id is null then
if exists(select 1 from public.profiles where user_id=family_id and (role<>'family' or access_code<>number)) then raise exception 'تعارض في حساب ولي الأمر';end if;
if exists(select 1 from public.students s join public.family_students f on f.student_id=s.id where f.user_id=family_id and btrim(s.full_name)<>label) then raise exception 'الرقم مرتبط ببيانات أخرى؛ راجع المشرف';end if;
insert into public.profiles(user_id,full_name,role,access_code,active,setup_complete) values(family_id,label,'family',number,true,true) on conflict(user_id) do nothing;
new_id:=gen_random_uuid()::text;
insert into public.students(id,full_name,national_id,program_id,class_id,account_status,active,enrollment_status) values(new_id,label,number,class_row.program_id,target,'active',true,'enrolled');
insert into public.family_students(user_id,student_id) values(family_id,new_id);
else
new_id:=old.id;
if old.national_id is distinct from number then
if not exists(select 1 from public.family_students where student_id=old.id and user_id=family_id) then raise exception 'حساب ولي الأمر غير مطابق';end if;
if not leader and exists(select 1 from public.family_students f join public.students s on s.id=f.student_id where f.user_id=family_id and not exists(select 1 from public.teacher_class_assignments a where a.teacher_id=actor and a.class_id=s.class_id)) then raise exception 'الرقم مشترك مع شعبة أخرى؛ يراجعه المشرف';end if;
perform 1 from public.profiles where user_id=family_id and role='family' and access_code=old.national_id for update;
if not found or not exists(select 1 from auth.users where id=family_id and email=number||'@login.gheras.local') then raise exception 'تغير حساب الأسرة، أعد المحاولة';end if;
update public.students set national_id=number where id in(select student_id from public.family_students where user_id=family_id);
update public.profiles set access_code=number where user_id=family_id;
end if;
update public.students set full_name=label where id=old.id;
end if;
elsif operation='student_move' then
target:=payload->>'class_id';select * into class_row from public.classes where id=target and active;
if class_row.id is null or class_row.program_id<>old.program_id or not(leader or exists(select 1 from public.teacher_class_assignments where teacher_id=actor and class_id=target)) then raise exception 'اختر شعبة من شعبك في البرنامج نفسه';end if;
update public.students set class_id=target where id=old.id;new_id:=old.id;
else
if old.id is null then raise exception 'اختر طالبًا';end if;
if operation='student_restore' and not exists(select 1 from public.classes where id=old.class_id and active) then raise exception 'استعد الشعبة أولًا ثم استعد الطالب';end if;
update public.students set active=operation='student_restore',account_status=case when operation='student_restore' then 'active' else 'disabled' end where id=old.id;new_id:=old.id;
end if;
elsif operation in('class_save','class_archive','class_restore') then
target:=payload->>'id';if coalesce(target,'')<>'' then
select * into class_row from public.classes where id=target for update;
if class_row.id is null or not(leader or exists(select 1 from public.teacher_class_assignments where teacher_id=actor and class_id=target)) then raise exception 'هذه الشعبة خارج نطاقك';end if;
end if;
if operation='class_save' then
label:=btrim(payload->>'name');section_label:=coalesce(nullif(btrim(payload->>'section'),''),case when class_row.section='غير موزع' then class_row.section else '' end);
if length(label) not between 1 and 100 or length(section_label) not between 1 and 30 or section_label='غير موزع' and (class_row.id is null or class_row.section<>'غير موزع') then raise exception 'راجع اسم الشعبة ورمزها';end if;
if class_row.id is null then
select * into class_row from public.classes where id=payload->>'template_class' and active;
if class_row.id is null or not(leader or exists(select 1 from public.teacher_class_assignments where teacher_id=actor and class_id=class_row.id)) then raise exception 'اختر صفًا من شعبك';end if;
new_id:=gen_random_uuid()::text;
if exists(select 1 from public.classes where program_id=class_row.program_id and stage=class_row.stage and grade=class_row.grade and section=section_label) then raise exception 'الشعبة موجودة بالفعل';end if;
insert into public.classes(id,program_id,name,stage,grade,section,active) values(new_id,class_row.program_id,label,class_row.stage,class_row.grade,section_label,true);
insert into public.teacher_class_assignments(teacher_id,class_id) values(actor,new_id);
else
new_id:=class_row.id;
if exists(select 1 from public.classes where id<>new_id and program_id=class_row.program_id and stage=class_row.stage and grade=class_row.grade and section=section_label) then raise exception 'رمز الشعبة مستخدم';end if;
update public.classes set name=label,section=section_label where id=new_id;
end if;
else
if operation='class_archive' and exists(select 1 from public.students where class_id=target and active) then raise exception 'انقل الطلاب أولًا؛ لا يمكن أرشفة شعبة بها طلاب نشطون';end if;
update public.classes set active=operation='class_restore' where id=target;new_id:=target;
end if;
else raise exception 'إجراء غير متاح';end if;
insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(actor,case operation when 'profile_self' then 'تعديل بيانات حساب المعلم' when 'student_save' then 'حفظ بيانات طالب' when 'student_move' then 'نقل طالب بين الشعب' when 'student_archive' then 'أرشفة طالب' when 'student_restore' then 'استعادة طالب' when 'class_save' then 'حفظ شعبة' when 'class_archive' then 'أرشفة شعبة فارغة' else 'استعادة شعبة' end,'teacher_management',new_id);
return jsonb_build_object('ok',true,'id',new_id);
end$$;

alter table public.school_certificates add column student_name_snapshot text,add column teacher_name_snapshot text,add column class_name_snapshot text;
create function private.certificate_snapshot() returns trigger language plpgsql security definer set search_path='' as $$begin
select s.full_name,c.name into new.student_name_snapshot,new.class_name_snapshot from public.students s join public.classes c on c.id=s.class_id where s.id=new.student_id;
select full_name into new.teacher_name_snapshot from public.profiles where user_id=new.teacher_id;
new.issued_at:=now();new.reference:='GH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));return new;end$$;
revoke all on function private.certificate_snapshot() from public,anon,authenticated;
create trigger certificate_snapshot before insert on public.school_certificates for each row execute function private.certificate_snapshot();
create or replace function private.visible_certificates() returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from(select c.*,coalesce(c.student_name_snapshot,s.full_name) as student_name,coalesce(c.teacher_name_snapshot,p.full_name) as teacher_name,coalesce(c.class_name_snapshot,cl.name) as class_name,s.program_id from public.school_certificates c join public.students s on s.id=c.student_id join public.profiles p on p.user_id=c.teacher_id join public.classes cl on cl.id=s.class_id where auth.uid() is not null and private.can_view_student(c.student_id) order by c.issued_at desc limit 300)x$$;