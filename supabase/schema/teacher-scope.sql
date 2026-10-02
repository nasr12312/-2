create or replace function private.is_leadership() returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(private.current_role() in ('admin','principal','supervisor'),false);
$$;
revoke all on function private.is_leadership() from public;
grant execute on function private.is_leadership() to authenticated;
drop policy if exists "authenticated can view classes" on public.classes;
drop policy if exists "view scoped classes" on public.classes;
create policy "view scoped classes" on public.classes for select to authenticated using (
 private.is_leadership()
 or exists(select 1 from public.teacher_class_assignments t where t.teacher_id=auth.uid() and t.class_id=classes.id)
 or (private.current_role() in ('teacher','head_teacher','supervisor_teacher') and exists(select 1 from public.profiles p where p.user_id=auth.uid() and not p.setup_complete))
 or exists(select 1 from public.students s join public.family_students f on f.student_id=s.id where f.user_id=auth.uid() and s.class_id=classes.id)
);
