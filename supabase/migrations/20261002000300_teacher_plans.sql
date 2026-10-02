grant insert on public.quran_plan_entries to authenticated;
create policy "teachers add plans for own classes" on public.quran_plan_entries
for insert to authenticated with check (
  private.current_role() <> 'family' and (
    private.is_leadership() or exists (
      select 1 from public.classes c
      join public.teacher_class_assignments a on a.class_id=c.id
      where a.teacher_id=auth.uid()
        and c.program_id=quran_plan_entries.program_id
        and c.stage=quran_plan_entries.stage
        and c.grade=quran_plan_entries.grade
    )
  )
);
