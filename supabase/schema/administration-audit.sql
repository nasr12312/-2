create or replace function public.administration_update_profile(actor uuid,target uuid,display_name text,target_role public.app_role,enabled boolean) returns void language plpgsql security invoker set search_path=public as $$
declare previous public.profiles;
begin
 perform pg_advisory_xact_lock(817424603);
 if not exists(select 1 from public.profiles where user_id=actor and active and role in ('admin','principal')) then raise exception 'Administrator required' using errcode='42501'; end if;
 select * into previous from public.profiles where user_id=target for update;
 if previous.user_id is null or previous.role='family' or target_role not in ('teacher','supervisor_teacher','supervisor','admin') or length(trim(display_name)) not between 3 and 150 then raise exception 'Invalid account'; end if;
 if target=actor and (target_role<>previous.role or not enabled) then raise exception 'Cannot disable or demote own account'; end if;
 if previous.role='admin' and previous.active and (target_role<>'admin' or not enabled) and not exists(select 1 from public.profiles where role='admin' and active and user_id<>target) then raise exception 'Last active administrator must remain'; end if;
 update public.profiles set full_name=trim(display_name),role=target_role,active=enabled,setup_complete=case when target_role in ('admin','supervisor','supervisor_teacher') then true else setup_complete end where user_id=target;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(actor,'تحديث حساب: '||display_name||' • '||target_role||' • '||case when enabled then 'نشط' else 'موقوف' end,'staff_account',target::text);
end; $$;
revoke all on function public.administration_update_profile(uuid,uuid,text,public.app_role,boolean) from public,anon,authenticated;
grant execute on function public.administration_update_profile(uuid,uuid,text,public.app_role,boolean) to service_role;
create or replace function private.school_management_audit() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is not null then
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),case when TG_TABLE_NAME='platform_settings' then 'تحديث إعدادات المدرسة والفصل الدراسي' else 'تعديل مقرر القرآن' end,TG_TABLE_NAME,case when TG_TABLE_NAME='platform_settings' then 'true' else to_jsonb(new)->>'id' end);
 end if;
 return new;
end; $$;
revoke all on function private.school_management_audit() from public,anon,authenticated;
create trigger platform_settings_audit after update on public.platform_settings for each row execute function private.school_management_audit();
create trigger quran_curriculum_audit after update on public.quran_plan_entries for each row execute function private.school_management_audit();
create index if not exists supervisor_notes_teacher_date_idx on public.supervisor_notes(teacher_id,created_at desc);
do $$
declare f text;
begin
 select pg_get_functiondef('public.my_quran_plan()'::regprocedure) into f;
 f:=replace(f,'select auth.uid() uid,private.is_leadership() leadership','select auth.uid() uid,private.is_leadership() leadership where private.current_role() is not null');
 execute f;
 select pg_get_functiondef('public.quran_stars()'::regprocedure) into f;
 f:=replace(f,'where auth.uid() is not null and s.active','where auth.uid() is not null and private.current_role() is not null and s.active');
 execute f;
end; $$;