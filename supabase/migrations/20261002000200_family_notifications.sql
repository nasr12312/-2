create or replace function private.notify_family_evaluation() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.grade is not null and new.grade <> '' then
 insert into public.notifications(recipient_id,student_id,title,body,page)
 select fs.user_id,new.student_id,'تقييم جديد: '||new.grade,new.notes,'quran' from public.family_students fs where fs.student_id=new.student_id;
 end if;
 return new;
end; $$;
revoke all on function private.notify_family_evaluation() from public,anon,authenticated;
create trigger family_evaluation_notice after insert or update of grade,notes on public.evaluations for each row execute function private.notify_family_evaluation();
create or replace function private.lock_completed_setup() returns trigger language plpgsql set search_path=public as $$
begin
 if old.setup_complete and not new.setup_complete and current_user <> 'postgres' then raise exception 'Setup is already complete'; end if;
 return new;
end; $$;
create trigger lock_completed_setup before update on public.profiles for each row execute function private.lock_completed_setup();