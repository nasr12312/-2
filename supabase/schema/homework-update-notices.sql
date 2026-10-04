create policy identity_lease_service on private.identity_leases for all to service_role using(true) with check(true);
create function private.homework_update_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
if row(new.title,new.instructions,new.due_date,new.cancelled) is distinct from row(old.title,old.instructions,old.due_date,old.cancelled) then
insert into public.notifications(recipient_id,student_id,title,body,page) select distinct f.user_id,s.id,case when new.cancelled then 'إلغاء واجب المقرأة' else 'تعديل واجب المقرأة' end,new.title||E'\nموعد المتابعة: '||new.due_date,'homework' from public.students s join public.family_students f on f.student_id=s.id where s.class_id=new.class_id and s.active and (new.student_id is null or new.student_id=s.id);
insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),case when new.cancelled then 'إلغاء واجب' else 'تعديل واجب' end,'homework',new.id::text);
end if;return new;end$$;
revoke all on function private.homework_update_notice() from public,anon,authenticated;
create trigger homework_update_notice after update of title,instructions,due_date,cancelled on public.quran_homework for each row execute function private.homework_update_notice();