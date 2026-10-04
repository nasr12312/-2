alter table public.quran_homework add column updated_at timestamptz not null default now();
alter table public.homework_followups add column homework_version timestamptz;
update public.quran_homework set updated_at=created_at;
update public.homework_followups f set homework_version=h.updated_at from public.quran_homework h where h.id=f.homework_id;
create function private.homework_version() returns trigger language plpgsql security invoker set search_path='' as $$begin if row(new.title,new.instructions,new.due_date,new.cancelled) is distinct from row(old.title,old.instructions,old.due_date,old.cancelled) then new.updated_at:=now();else new.updated_at:=old.updated_at;end if;return new;end$$;
revoke all on function private.homework_version() from public,anon,authenticated;
create trigger homework_version before update on public.quran_homework for each row execute function private.homework_version();
alter policy homework_followups_add on public.homework_followups with check(parent_id=auth.uid() and private.current_role()='family' and exists(select 1 from public.family_students f where f.user_id=auth.uid() and f.student_id=homework_followups.student_id) and exists(select 1 from public.quran_homework h join public.students s on s.class_id=h.class_id where h.id=homework_id and not h.cancelled and s.id=homework_followups.student_id and (h.student_id is null or h.student_id=s.id)));
create function private.follow_homework(target uuid,child text) returns void language plpgsql security definer set search_path='' as $$declare h public.quran_homework;begin
select * into h from public.quran_homework where id=target and not cancelled;
if private.current_role()<>'family' or h.id is null or not exists(select 1 from public.family_students f join public.students s on s.id=f.student_id where f.user_id=auth.uid() and s.id=child and s.active and s.class_id=h.class_id and (h.student_id is null or h.student_id=s.id)) then raise exception 'غير مسموح' using errcode='42501';end if;
insert into public.homework_followups(homework_id,student_id,parent_id,homework_version) values(h.id,child,auth.uid(),h.updated_at) on conflict(homework_id,student_id,parent_id) do update set homework_version=excluded.homework_version,followed_at=now();
end$$;
create function public.follow_homework(target uuid,child text) returns void language sql security invoker set search_path='' as $$select private.follow_homework(target,child)$$;
revoke all on function private.follow_homework(uuid,text),public.follow_homework(uuid,text) from public,anon;
grant execute on function private.follow_homework(uuid,text),public.follow_homework(uuid,text) to authenticated;