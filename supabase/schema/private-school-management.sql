do $$
declare n text;f text;
begin
 foreach n in array array['school_staff','set_teacher_classes','move_student_class','save_school_class','my_quran_plan','quran_stars'] loop
 select pg_get_functiondef(p.oid) into f from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname=n;
 execute replace(f,'FUNCTION public.'||n||'(','FUNCTION private.'||n||'(');
 end loop;
end; $$;
create or replace function public.school_staff() returns table(user_id uuid,full_name text,role public.app_role,active boolean,setup_complete boolean) language sql stable security invoker set search_path=public as $$select * from private.school_staff()$$;
create or replace function public.set_teacher_classes(target_teacher uuid,selected_classes text[]) returns void language sql security invoker set search_path=public as $$select private.set_teacher_classes($1,$2)$$;
create or replace function public.move_student_class(target_student text,target_class text) returns void language sql security invoker set search_path=public as $$select private.move_student_class($1,$2)$$;
create or replace function public.save_school_class(program text,stage_name text,grade_name text,section_name text) returns text language sql security invoker set search_path=public as $$select private.save_school_class($1,$2,$3,$4)$$;
create or replace function public.my_quran_plan() returns table(id text,program_id text,stage text,grade text,week_label text,day_name text,assignment_type text,assignment_text text,sort_order integer) language sql stable security invoker set search_path=public as $$select * from private.my_quran_plan()$$;
create or replace function public.quran_stars() returns table(display_name text,program_id text,class_name text,points numeric,evaluation_count bigint,rank_number bigint) language sql stable security invoker set search_path=public as $$select * from private.quran_stars()$$;
revoke all on function private.school_staff(),private.set_teacher_classes(uuid,text[]),private.move_student_class(text,text),private.save_school_class(text,text,text,text),private.my_quran_plan(),private.quran_stars() from public,anon;
grant execute on function private.school_staff(),private.set_teacher_classes(uuid,text[]),private.move_student_class(text,text),private.save_school_class(text,text,text,text),private.my_quran_plan(),private.quran_stars() to authenticated;
