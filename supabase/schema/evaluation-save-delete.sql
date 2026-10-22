begin;
-- A plan entry can cover several lesson days. The canonical daily key remains unique.
alter table public.evaluations drop constraint if exists evaluations_student_id_plan_entry_id_key;
create index if not exists evaluations_student_plan_idx on public.evaluations(student_id,plan_entry_id);

create table if not exists private.deleted_evaluations (
 id uuid primary key default gen_random_uuid(),
 evaluation_id uuid not null,
 student_id text not null,
 deleted_by uuid,
 deleted_at timestamptz not null default now(),
 original_record jsonb not null,
 original_followups jsonb not null
);
alter table private.deleted_evaluations enable row level security;
revoke all on private.deleted_evaluations from public,anon,authenticated;
create policy no_client_access on private.deleted_evaluations for all to authenticated using(false) with check(false);
create index deleted_evaluations_student_date_idx on private.deleted_evaluations(student_id,deleted_at desc);
create function private.archive_deleted_evaluation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into private.deleted_evaluations(evaluation_id,student_id,deleted_by,original_record,original_followups)
 values(old.id,old.student_id,auth.uid(),to_jsonb(old),coalesce((select jsonb_agg(to_jsonb(f)) from public.evaluation_followups f where f.evaluation_id=old.id),'[]'::jsonb));
 return old;
end $$;
revoke all on function private.archive_deleted_evaluation() from public,anon,authenticated;
create trigger archive_evaluation_before_delete before delete on public.evaluations for each row execute function private.archive_deleted_evaluation();
grant delete on public.evaluations to authenticated;
create policy assigned_staff_deletes_evaluations on public.evaluations for delete to authenticated
using(exists(select 1 from public.students s where s.id=evaluations.student_id and private.manage_class(s.class_id)));
commit;
