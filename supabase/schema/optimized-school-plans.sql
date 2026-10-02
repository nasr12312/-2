create or replace function public.my_quran_plan()
returns table(id text,program_id text,stage text,grade text,week_label text,day_name text,assignment_type text,assignment_text text,sort_order integer)
language sql stable security definer set search_path=public as $$
 with caller as materialized (select auth.uid() uid,private.is_leadership() leadership),
 visible_classes as materialized (
 select distinct c.program_id,c.stage,c.grade from public.classes c cross join caller a
 where a.uid is not null and c.active and (a.leadership
 or c.id in (select t.class_id from public.teacher_class_assignments t where t.teacher_id=a.uid)
 or c.id in (select s.class_id from public.family_students f join public.students s on s.id=f.student_id where f.user_id=a.uid and s.active))
 )
 select distinct q.id,q.program_id,q.stage,q.grade,q.week_label,q.day_name,q.assignment_type,q.assignment_text,q.sort_order
 from public.quran_plan_entries q join visible_classes c on c.program_id=q.program_id
 and position(translate(c.grade,'أإآة','اااه') in translate(q.grade,'أإآة','اااه'))>0
 and ((c.stage like '%ابتدا%' and q.stage like '%ابتدا%') or (c.stage like '%متوسط%' and q.stage like '%متوسط%') or (c.stage like '%ثانو%' and q.stage like '%ثانو%'))
 order by q.sort_order;
$$;
revoke all on function public.my_quran_plan() from public,anon;
grant execute on function public.my_quran_plan() to authenticated;