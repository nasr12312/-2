create table public.school_weekly_reports(
 message_id uuid primary key references public.school_private_messages(id) on delete cascade,
 student_id text not null references public.students(id),
 teacher_id uuid not null references public.profiles(user_id),
 file_name text not null check(length(file_name) between 1 and 200),
 period_from date not null,period_to date not null,
 html text not null check(length(html) between 1 and 200000),
 created_at timestamptz not null default now(),
 check(period_to=period_from+6)
);
alter table public.school_weekly_reports enable row level security;
revoke all on public.school_weekly_reports from anon,authenticated;
grant select,insert on public.school_weekly_reports to authenticated;
create policy weekly_reports_read on public.school_weekly_reports for select to authenticated
 using((private.current_role()='family' and exists(select 1 from public.family_students f where f.user_id=(select auth.uid()) and f.student_id=school_weekly_reports.student_id))
 or (teacher_id=(select auth.uid()) and private.current_role() in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') and private.can_view_student(student_id)));
create policy weekly_reports_add on public.school_weekly_reports for insert to authenticated
 with check(teacher_id=(select auth.uid()) and private.current_role() in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') and private.private_thread(student_id,teacher_id)
 and exists(select 1 from public.school_private_messages m where m.id=message_id and m.student_id=school_weekly_reports.student_id and m.teacher_id=school_weekly_reports.teacher_id and m.sender_id=(select auth.uid())));
create index weekly_reports_student on public.school_weekly_reports(student_id);
create index weekly_reports_teacher on public.school_weekly_reports(teacher_id);

create function public.send_weekly_reports(entries jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare item jsonb; inserted uuid; sent integer:=0; linked uuid;
begin
 if auth.uid() is null or coalesce(private.current_role()::text,'') not in('teacher','head_teacher','supervisor_teacher','supervisor','admin','principal') then raise exception 'غير مسموح' using errcode='42501';end if;
 if jsonb_typeof(entries)<>'array' or jsonb_array_length(entries) not between 1 and 500 then raise exception 'دفعة التقارير غير صالحة';end if;
 for item in select value from jsonb_array_elements(entries) loop
  if length(item->>'html') not between 1 and 200000 or length(item->>'body') not between 1 and 4000 then raise exception 'محتوى التقرير غير صالح';end if;
  linked:=(item->>'id')::uuid;
  inserted:=null;
  insert into public.school_private_messages(id,student_id,teacher_id,sender_id,kind,body)
   values(linked,item->>'student_id',auth.uid(),auth.uid(),'توجيه',item->>'body')
   on conflict(id) do nothing returning id into inserted;
  if not exists(select 1 from public.school_private_messages m where m.id=linked and m.student_id=item->>'student_id' and m.teacher_id=auth.uid() and m.sender_id=auth.uid() and m.body=item->>'body') then raise exception 'تعارض في التقرير' using errcode='42501';end if;
  insert into public.school_weekly_reports(message_id,student_id,teacher_id,file_name,period_from,period_to,html)
   values(linked,item->>'student_id',auth.uid(),item->>'file_name',(item->>'period_from')::date,(item->>'period_to')::date,item->>'html')
   on conflict(message_id) do nothing;
  if inserted is not null then sent:=sent+1;end if;
 end loop;
 return jsonb_build_object('sent',sent,'already_sent',jsonb_array_length(entries)-sent);
end;
$$;
revoke all on function public.send_weekly_reports(jsonb) from public,anon;
grant execute on function public.send_weekly_reports(jsonb) to authenticated;
