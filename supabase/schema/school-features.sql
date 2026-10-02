create or replace function public.my_quran_plan()
returns table(id text,program_id text,stage text,grade text,week_label text,day_name text,assignment_type text,assignment_text text,sort_order integer)
language sql stable security invoker set search_path=public as $$
 select distinct q.id,q.program_id,q.stage,q.grade,q.week_label,q.day_name,q.assignment_type,q.assignment_text,q.sort_order
 from public.quran_plan_entries q join public.classes c on c.program_id=q.program_id
 and position(translate(c.grade,'أإآة','اااه') in translate(q.grade,'أإآة','اااه'))>0
 and ((c.stage like '%ابتدا%' and q.stage like '%ابتدا%') or (c.stage like '%متوسط%' and q.stage like '%متوسط%') or (c.stage like '%ثانو%' and q.stage like '%ثانو%'))
 where auth.uid() is not null and c.active order by q.sort_order;
$$;
revoke all on function public.my_quran_plan() from public,anon;
grant execute on function public.my_quran_plan() to authenticated;
create or replace function public.quran_stars()
returns table(display_name text,program_id text,class_name text,points numeric,evaluation_count bigint,rank_number bigint)
language sql stable security definer set search_path=public as $$
 with scoped as (
 select s.id,s.full_name,s.program_id,c.name as class_name
 from public.students s join public.classes c on c.id=s.class_id where auth.uid() is not null and s.active and c.active
 and (private.is_leadership() or exists(select 1 from public.teacher_class_assignments t where t.teacher_id=auth.uid() and t.class_id=s.class_id)
 or exists(select 1 from public.family_students f join public.students own on own.id=f.student_id join public.classes oc on oc.id=own.class_id where f.user_id=auth.uid() and oc.program_id=c.program_id and oc.stage=c.stage and oc.grade=c.grade))
 ), totals as (
 select s.id,split_part(s.full_name,' ',1)||' '||left(split_part(s.full_name,' ',2),1)||'.' as display_name,s.program_id,s.class_name,sum(greatest(0,least(e.score,5)))::numeric as points,count(*) as evaluation_count
 from scoped s join public.evaluations e on e.student_id=s.id where e.evaluated_at>=now()-interval '7 days' and e.score is not null group by s.id,s.full_name,s.program_id,s.class_name
 ) select display_name,program_id,regexp_replace(class_name,' - غير موزع$','') as class_name,points,evaluation_count,dense_rank() over(order by points desc) as rank_number from totals order by points desc,display_name limit 10;
$$;
revoke all on function public.quran_stars() from public,anon;
grant execute on function public.quran_stars() to authenticated;
create index if not exists quran_plan_program_grade_idx on public.quran_plan_entries(program_id,grade);
