-- Keep complete originals (including parent acknowledgements) outside the Data API.
begin;
lock table public.evaluations in share row exclusive mode;
create table if not exists private.evaluation_duplicate_archive (
 evaluation_id uuid primary key,
 canonical_id uuid not null,
 original_record jsonb not null,
 original_followups jsonb not null,
 archived_at timestamptz not null default now()
);
alter table private.evaluation_duplicate_archive enable row level security;
revoke all on private.evaluation_duplicate_archive from public, anon, authenticated;

create temporary table evaluation_cleanup on commit drop as
select id, first_value(id) over lesson as canonical_id,
 count(*) over (partition by student_id,split_part(client_key,'|',2)::integer,
 split_part(client_key,'|',3)::integer,split_part(split_part(client_key,'|',4),' · ',1)) as copies
from public.evaluations
window lesson as (partition by student_id,split_part(client_key,'|',2)::integer,
 split_part(client_key,'|',3)::integer,split_part(split_part(client_key,'|',4),' · ',1)
 order by evaluated_at desc, (grade in ('لم يسمّع','لا يوجد تسميع اليوم','غائب اليوم')),id);

insert into private.evaluation_duplicate_archive(evaluation_id,canonical_id,original_record,original_followups)
select e.id,c.canonical_id,to_jsonb(e),coalesce((select jsonb_agg(to_jsonb(f)) from public.evaluation_followups f where f.evaluation_id=e.id),'[]'::jsonb)
from public.evaluations e join evaluation_cleanup c on c.id=e.id where c.copies>1
on conflict(evaluation_id) do nothing;

-- Latest teacher decision wins. Earlier versions remain recoverable in the archive.
delete from public.evaluations e using evaluation_cleanup c where e.id=c.id and c.id<>c.canonical_id;

create or replace function private.canonical_evaluation_key(student text, key text)
returns text language sql immutable strict set search_path='' as $$
 select student || '|' || split_part(key,'|',2)::integer || '|' || split_part(key,'|',3)::integer || '|' || split_part(split_part(key,'|',4),' · ',1)
$$;
update public.evaluations set client_key=private.canonical_evaluation_key(student_id,client_key)
where client_key<>private.canonical_evaluation_key(student_id,client_key);

create or replace function private.normalize_evaluation_key()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.client_key !~ '^[^|]+\|[0-9]+\|[0-9]+\|[^|]+$'
 or split_part(new.client_key,'|',1)<>new.student_id
 or split_part(new.client_key,'|',2)::integer not between 1 and 17
 or split_part(new.client_key,'|',3)::integer not between 0 and 6 then
 raise exception 'Invalid evaluation lesson key' using errcode='23514';
 end if;
 new.client_key:=private.canonical_evaluation_key(new.student_id,new.client_key);
 return new;
end $$;
create trigger normalize_evaluation_lesson before insert or update of client_key,student_id on public.evaluations
for each row execute function private.normalize_evaluation_key();
-- The existing UNIQUE(client_key) now covers status, achievement and grade together.
alter table public.evaluations add constraint evaluations_canonical_lesson_key
check(client_key=private.canonical_evaluation_key(student_id,client_key));
revoke all on function private.canonical_evaluation_key(text,text) from public,anon;
grant execute on function private.canonical_evaluation_key(text,text) to authenticated,service_role;
revoke all on function private.normalize_evaluation_key() from public,anon;
commit;
