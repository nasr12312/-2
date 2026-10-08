create table public.class_plan_overrides (
 class_id text not null references public.classes(id),
 plan_entry_id text not null references public.quran_plan_entries(id),
 assignment_text text not null check(length(btrim(assignment_text)) between 1 and 2000),
 created_by uuid not null default auth.uid() references public.profiles(user_id),
 updated_at timestamptz not null default now(),
 primary key(class_id,plan_entry_id)
);
alter table public.class_plan_overrides enable row level security;
grant select on public.class_plan_overrides to authenticated;
grant insert(class_id,plan_entry_id,assignment_text),update(assignment_text) on public.class_plan_overrides to authenticated;
create policy "scoped class plan read" on public.class_plan_overrides for select to authenticated using(private.manage_class(class_id) or exists(select 1 from public.students s join public.family_students f on f.student_id=s.id where s.class_id=class_plan_overrides.class_id and s.active and f.user_id=auth.uid()));
create policy "teachers edit own class plans" on public.class_plan_overrides for insert to authenticated with check(private.manage_class(class_id) and exists(select 1 from public.classes c join public.quran_plan_entries q on q.program_id=c.program_id where c.id=class_plan_overrides.class_id and c.active and q.id=class_plan_overrides.plan_entry_id and position(private.roster_key(c.grade) in private.roster_key(q.grade))>0 and ((c.stage like '%ابتدا%' and q.stage like '%ابتدا%') or (c.stage like '%متوسط%' and q.stage like '%متوسط%') or (c.stage like '%ثانو%' and q.stage like '%ثانو%'))));
create policy "teachers update own class plans" on public.class_plan_overrides for update to authenticated using(private.manage_class(class_id)) with check(private.manage_class(class_id));
create function public.save_class_plan(class_ref text,entry_ref text,assignment text) returns void language sql security invoker set search_path='' as $$
insert into public.class_plan_overrides(class_id,plan_entry_id,assignment_text) values(class_ref,entry_ref,btrim(assignment)) on conflict(class_id,plan_entry_id) do update set assignment_text=excluded.assignment_text;
$$;
revoke all on function public.save_class_plan(text,text,text) from public,anon;
grant execute on function public.save_class_plan(text,text,text) to authenticated;
create function private.class_plan_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
new.updated_at:=now();
insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'تعديل مقرر شعبة مع الحفاظ على الخطة الأصلية','class_plan',new.class_id);
return new;
end$$;
revoke all on function private.class_plan_audit() from public,anon,authenticated;
create trigger class_plan_change before insert or update on public.class_plan_overrides for each row execute function private.class_plan_audit();
create function private.audio_recitation_only() returns trigger language plpgsql set search_path='' as $$
begin
if new.media_type is distinct from 'audio' or new.mime_type is null or new.mime_type not like 'audio/%' then raise exception 'المقرأة تستقبل التسجيلات الصوتية فقط' using errcode='23514';end if;
return new;
end$$;
revoke all on function private.audio_recitation_only() from public,anon,authenticated;
create trigger recitations_audio_only before insert on public.recitation_submissions for each row execute function private.audio_recitation_only();
update storage.buckets set allowed_mime_types=array['audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/x-m4a','audio/x-wav'] where id='recitations';
