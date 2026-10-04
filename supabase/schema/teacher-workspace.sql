
-- Scoped teacher workspace. Authentication and credential changes stay server-side.
create function private.manage_class(target text) returns boolean language sql stable security definer set search_path='' as $$
select coalesce(private.current_role() in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') and (private.is_leadership() or exists(select 1 from public.teacher_class_assignments a where a.teacher_id=auth.uid() and a.class_id=target)),false)$$;
revoke all on function private.manage_class(text) from public,anon;grant execute on function private.manage_class(text) to authenticated;
create function private.teacher_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
if private.current_role() is null or private.current_role()='family' then raise exception 'غير مسموح' using errcode='42501';end if;
return jsonb_build_object('classes',coalesce((select jsonb_agg(to_jsonb(c)) from public.classes c where private.manage_class(c.id)),'[]'::jsonb),'students',coalesce((select jsonb_agg(to_jsonb(s)) from public.students s where private.manage_class(s.class_id)),'[]'::jsonb),'audit',coalesce((select jsonb_agg(to_jsonb(a)) from (select id,action,entity_type,entity_id,created_at from public.audit_logs where actor_id=auth.uid() order by created_at desc limit 50)a),'[]'::jsonb));
end$$;
create function public.teacher_workspace() returns jsonb language sql stable security invoker set search_path='' as $$select private.teacher_workspace()$$;
revoke all on function private.teacher_workspace(),public.teacher_workspace() from public,anon;grant execute on function private.teacher_workspace(),public.teacher_workspace() to authenticated;
create table private.identity_leases(user_id uuid primary key references auth.users(id) on delete cascade,lease_id uuid not null,expires_at timestamptz not null);
alter table private.identity_leases enable row level security;
revoke all on private.identity_leases from public,anon,authenticated;grant all on private.identity_leases to service_role;grant usage on schema private to service_role;
create function public.teacher_identity_lease(target uuid,lease uuid,release boolean default false) returns boolean language plpgsql security invoker set search_path='' as $$
begin
if release then delete from private.identity_leases where user_id=target and lease_id=lease;return true;end if;
insert into private.identity_leases(user_id,lease_id,expires_at) values(target,lease,now()+interval '120 seconds')
on conflict(user_id) do update set lease_id=excluded.lease_id,expires_at=excluded.expires_at where private.identity_leases.expires_at<now();
return found;end$$;
revoke all on function public.teacher_identity_lease(uuid,uuid,boolean) from public,anon,authenticated;grant execute on function public.teacher_identity_lease(uuid,uuid,boolean) to service_role;
create function public.teacher_management_commit(actor uuid,operation text,payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare role_name text; leader boolean; old public.students; class_row public.classes; new_id text; label text; number text; family_id uuid; prev_code text; target text; section_label text;
begin
select role::text into role_name from public.profiles where user_id=actor and active;
if role_name is null or role_name='family' then raise exception 'الحساب غير مخول';end if;
leader:=role_name in('admin','principal','supervisor','supervisor_teacher');
if operation='profile_self' then
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
label:=btrim(payload->>'name');section_label:=btrim(payload->>'section');
if length(label) not between 1 and 100 or length(section_label) not between 1 and 30 or section_label='غير موزع' then raise exception 'راجع اسم الشعبة ورمزها';end if;
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
revoke all on function public.teacher_management_commit(uuid,text,jsonb) from public,anon,authenticated;grant execute on function public.teacher_management_commit(uuid,text,jsonb) to service_role;

create table public.teacher_student_notes(id uuid primary key default gen_random_uuid(),student_id text not null references public.students(id),teacher_id uuid not null references public.profiles(user_id),body text not null check(length(body) between 1 and 3000),created_at timestamptz not null default now());
alter table public.teacher_student_notes enable row level security;revoke all on public.teacher_student_notes from anon,authenticated;grant select,insert on public.teacher_student_notes to authenticated;
create policy teacher_notes_read on public.teacher_student_notes for select to authenticated using(teacher_id=auth.uid() and exists(select 1 from public.students where id=student_id and private.manage_class(class_id)));
create policy teacher_notes_insert on public.teacher_student_notes for insert to authenticated with check(teacher_id=auth.uid() and exists(select 1 from public.students where id=student_id and private.manage_class(class_id)));
create index teacher_notes_student on public.teacher_student_notes(student_id,teacher_id);
create function private.private_thread(target_student text,target_teacher uuid) returns boolean language sql stable security definer set search_path='' as $$
select coalesce(private.current_role() is not null and exists(select 1 from public.students s join public.profiles p on p.user_id=target_teacher and p.active and p.role<>'family' where s.id=target_student and (p.role in('admin','principal','supervisor','supervisor_teacher') or exists(select 1 from public.teacher_class_assignments a where a.class_id=s.class_id and a.teacher_id=target_teacher)) and (auth.uid()=target_teacher or private.current_role()='family' and exists(select 1 from public.family_students f where f.student_id=s.id and f.user_id=auth.uid()))),false)$$;
revoke all on function private.private_thread(text,uuid) from public,anon;grant execute on function private.private_thread(text,uuid) to authenticated;
create table public.school_private_messages(id uuid primary key default gen_random_uuid(),student_id text not null references public.students(id),teacher_id uuid not null references public.profiles(user_id),sender_id uuid not null references public.profiles(user_id),kind text not null default 'رسالة' check(kind in('رسالة','إشادة','تذكير','توجيه','استفسار')),body text not null check(length(body) between 1 and 4000),created_at timestamptz not null default now());
alter table public.school_private_messages enable row level security;revoke all on public.school_private_messages from anon,authenticated;grant select,insert on public.school_private_messages to authenticated;
create policy private_messages_read on public.school_private_messages for select to authenticated using(private.private_thread(student_id,teacher_id));
create policy private_messages_send on public.school_private_messages for insert to authenticated with check(sender_id=auth.uid() and private.private_thread(student_id,teacher_id));
create index private_messages_thread on public.school_private_messages(student_id,teacher_id,created_at);
create table public.school_message_receipts(message_id uuid references public.school_private_messages(id) on delete cascade,user_id uuid references public.profiles(user_id),read_at timestamptz not null default now(),primary key(message_id,user_id));
alter table public.school_message_receipts enable row level security;revoke all on public.school_message_receipts from anon,authenticated;grant select,insert on public.school_message_receipts to authenticated;
create policy receipts_read on public.school_message_receipts for select to authenticated using(exists(select 1 from public.school_private_messages m where m.id=message_id and private.private_thread(m.student_id,m.teacher_id)));
create policy receipts_add on public.school_message_receipts for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.school_private_messages m where m.id=message_id and m.sender_id<>auth.uid() and private.private_thread(m.student_id,m.teacher_id)));
create function private.conversation_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
if new.sender_id=new.teacher_id then insert into public.notifications(recipient_id,student_id,title,body,page) select user_id,new.student_id,'رسالة خاصة من المعلم',left(new.body,200),'messages' from public.family_students where student_id=new.student_id;
else insert into public.notifications(recipient_id,student_id,title,body,page) values(new.teacher_id,new.student_id,'رسالة خاصة من ولي الأمر',left(new.body,200),'messages');end if;return new;end$$;
revoke all on function private.conversation_notice() from public,anon,authenticated;
create trigger conversation_notice after insert on public.school_private_messages for each row execute function private.conversation_notice();
create function private.school_conversations() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
if private.current_role() is null then raise exception 'غير مسموح';end if;
return jsonb_build_object('messages',coalesce((select jsonb_agg(to_jsonb(x)) from(select m.*,p.full_name as sender_name,(select count(*) from public.school_message_receipts r where r.message_id=m.id and r.user_id<>m.sender_id)>0 as was_read from public.school_private_messages m join public.profiles p on p.user_id=m.sender_id where private.private_thread(m.student_id,m.teacher_id) order by m.created_at desc limit 300)x),'[]'::jsonb),'teachers',coalesce((select jsonb_agg(to_jsonb(x)) from(select distinct s.id as student_id,p.user_id as teacher_id,p.full_name as teacher_name from public.students s join public.teacher_class_assignments a on a.class_id=s.class_id join public.profiles p on p.user_id=a.teacher_id and p.active where private.current_role()='family' and exists(select 1 from public.family_students f where f.user_id=auth.uid() and f.student_id=s.id)
union select distinct m.student_id,m.teacher_id,p.full_name from public.school_private_messages m join public.profiles p on p.user_id=m.teacher_id where private.private_thread(m.student_id,m.teacher_id))x),'[]'::jsonb));
end$$;
create function public.school_conversations() returns jsonb language sql stable security invoker set search_path='' as $$select private.school_conversations()$$;
revoke all on function private.school_conversations(),public.school_conversations() from public,anon;grant execute on function private.school_conversations(),public.school_conversations() to authenticated;

create table public.school_certificates(id uuid primary key default gen_random_uuid(),student_id text not null references public.students(id),teacher_id uuid not null references public.profiles(user_id),kind text not null check(kind in('تميز','إتقان مقرر','تحسن الأداء','إنجاز حفظ','شكر وتقدير')),title text not null check(length(title) between 1 and 150),achievement text not null check(length(achievement) between 1 and 1000),body text not null check(length(body) between 1 and 2000),issued_at timestamptz not null default now(),reference text not null unique default ('GH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),revoked boolean not null default false,revocation_reason text not null default '');
alter table public.school_certificates enable row level security;revoke all on public.school_certificates from anon,authenticated;grant select,insert on public.school_certificates to authenticated;grant update(revoked,revocation_reason) on public.school_certificates to authenticated;
create policy certificates_read on public.school_certificates for select to authenticated using(private.can_view_student(student_id));
create policy certificates_create on public.school_certificates for insert to authenticated with check(teacher_id=auth.uid() and exists(select 1 from public.students where id=student_id and active and private.manage_class(class_id)));
create policy certificates_revoke on public.school_certificates for update to authenticated using(exists(select 1 from public.students where id=student_id and private.manage_class(class_id))) with check(exists(select 1 from public.students where id=student_id and private.manage_class(class_id)));
create index certificates_student on public.school_certificates(student_id,issued_at);
create function private.certificate_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
if tg_op='INSERT' or new.revoked is distinct from old.revoked then
insert into public.notifications(recipient_id,student_id,title,body,page) select user_id,new.student_id,case when new.revoked then 'تحديث شهادة الطالب' else 'شهادة جديدة من المعلم' end,new.title||' • '||new.reference,'certificates' from public.family_students where student_id=new.student_id;
insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),case when new.revoked then 'إلغاء شهادة' else 'إصدار شهادة' end,'certificate',new.id::text);
end if;return new;end$$;
revoke all on function private.certificate_notice() from public,anon,authenticated;
create trigger certificate_notice after insert or update of revoked on public.school_certificates for each row execute function private.certificate_notice();
create function private.visible_certificates() returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from(select c.*,s.full_name as student_name,p.full_name as teacher_name,cl.name as class_name,s.program_id from public.school_certificates c join public.students s on s.id=c.student_id join public.profiles p on p.user_id=c.teacher_id join public.classes cl on cl.id=s.class_id where auth.uid() is not null and private.can_view_student(c.student_id) order by c.issued_at desc limit 300)x$$;
create function public.visible_certificates() returns jsonb language sql stable security invoker set search_path='' as $$select private.visible_certificates()$$;
revoke all on function private.visible_certificates(),public.visible_certificates() from public,anon;grant execute on function private.visible_certificates(),public.visible_certificates() to authenticated;
alter table public.quran_homework add column cancelled boolean not null default false;
revoke update on public.quran_homework from authenticated;grant update(title,instructions,due_date,cancelled) on public.quran_homework to authenticated;
create policy homework_edit on public.quran_homework for update to authenticated using(private.manage_class(class_id)) with check(private.manage_class(class_id));
