-- Public school presentation contains no student, account, credential, or audit data.
create function private.roster_key(value text) returns text language sql immutable parallel safe set search_path='' as $$
select regexp_replace(translate(btrim(value),'أإآٱ٠١٢٣٤٥٦٧٨٩','اااا0123456789'),'[[:space:]ـًٌٍَُِّْ]','','g')$$;
revoke all on function private.roster_key(text) from public,anon;
grant execute on function private.roster_key(text) to authenticated;
create unique index classes_normalized_identity_key on public.classes(program_id,regexp_replace(translate(btrim(stage),'أإآٱ٠١٢٣٤٥٦٧٨٩','اااا0123456789'),'[[:space:]ـًٌٍَُِّْ]','','g'),regexp_replace(translate(btrim(grade),'أإآٱ٠١٢٣٤٥٦٧٨٩','اااا0123456789'),'[[:space:]ـًٌٍَُِّْ]','','g'),regexp_replace(translate(btrim(section),'أإآٱ٠١٢٣٤٥٦٧٨٩','اااا0123456789'),'[[:space:]ـًٌٍَُِّْ]','','g'));
alter table public.students add constraint students_national_id_format check(national_id ~ '^[0-9]{10}$' and national_id is not null);
alter table public.classes add constraint classes_id_program_key unique(id,program_id);
alter table public.students add constraint students_class_program_match foreign key(class_id,program_id) references public.classes(id,program_id);

create function private.unique_welcome_presets(values_array text[]) returns boolean language sql immutable set search_path='' as $$select cardinality(values_array)=(select count(distinct x) from unnest(values_array)x)$$;
revoke all on function private.unique_welcome_presets(text[]) from public,anon;
grant execute on function private.unique_welcome_presets(text[]) to authenticated;
create table public.platform_presentation(
 id boolean primary key default true check(id),
 school_label text not null default 'مدارس غراس الأخلاق الأهلية' check(length(btrim(school_label)) between 3 and 150),
 platform_name text not null default 'مقرأة غراس' check(length(btrim(platform_name)) between 3 and 80),
 school_site text not null default 'https://www.gheras.edu.sa/' check(school_site ~ '^https://[^[:space:]]+$' and length(school_site)<=300),
 logo_data text not null default '' check(length(logo_data)<=240000 and (logo_data='' or logo_data ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')),
 login_subtitle text not null default 'حفظٌ بإتقان، ومتابعةٌ باهتمام.' check(length(login_subtitle)<=200),
 welcome_enabled boolean not null default true,
 welcome_presets text[] not null default array['rahman','prayer','knowledge'] check(cardinality(welcome_presets) between 1 and 6 and welcome_presets <@ array['rahman','prayer','knowledge','reading','guidance','ease']::text[] and private.unique_welcome_presets(welcome_presets)),
 welcome_mode text not null default 'daily' check(welcome_mode in('daily','fixed')),
 welcome_autoplay boolean not null default true,
 welcome_repeat boolean not null default false,
 welcome_volume numeric not null default 0.65 check(welcome_volume between 0 and 1),
 welcome_caption text not null default 'نبدأ رحلتنا بآيات من كتاب الله' check(length(welcome_caption)<=180),
 background_style text not null default 'school' check(background_style in('school','gradient')),
 default_mode text not null default 'dark' check(default_mode in('dark','light','system')),
 default_density text not null default 'comfortable' check(default_density in('comfortable','compact')),
 default_font_size integer not null default 16 check(default_font_size in(14,16,18,20)),
 reduce_motion boolean not null default false,
 notification_indicator boolean not null default true
);
insert into public.platform_presentation(id) values(true);
alter table public.platform_presentation enable row level security;
revoke all on public.platform_presentation from public,anon,authenticated;
grant select on public.platform_presentation to anon,authenticated;
grant update(school_label,platform_name,school_site,logo_data,login_subtitle,welcome_enabled,welcome_presets,welcome_mode,welcome_autoplay,welcome_repeat,welcome_volume,welcome_caption,background_style,default_mode,default_density,default_font_size,reduce_motion,notification_indicator) on public.platform_presentation to authenticated;
grant all on public.platform_presentation to service_role;
create policy public_school_presentation on public.platform_presentation for select to anon,authenticated using(id=true);
create policy administrator_changes_presentation on public.platform_presentation for update to authenticated using(private.current_role() in('admin','principal')) with check(private.current_role() in('admin','principal'));
create function private.presentation_audit() returns trigger language plpgsql security definer set search_path='' as $$begin
if auth.uid() is not null then insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'تحديث واجهة الدخول والآيات وتفضيلات المنصة','platform_presentation','true');end if;return new;end$$;
revoke all on function private.presentation_audit() from public,anon,authenticated;
create trigger platform_presentation_audit after update on public.platform_presentation for each row execute function private.presentation_audit();

create function public.save_platform_configuration(school_name text,term_name text,year_name text,start_date date,presentation jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare draft public.platform_presentation;
begin
 if private.current_role() not in('admin','principal') or private.current_role() is null then raise exception 'إعدادات المنصة لمدير المنصة' using errcode='42501';end if;
 if length(btrim(term_name)) not between 1 and 100 or length(btrim(year_name)) not between 1 and 10 or start_date is null then raise exception 'راجع بيانات الفصل الدراسي';end if;
 select * into draft from jsonb_populate_record(null::public.platform_presentation,presentation);
 update public.platform_settings set school=btrim(school_name),term=btrim(term_name),year=btrim(year_name),term_start_date=start_date,updated_at=now() where id=true;
 if not found then raise exception 'تعذر حفظ إعدادات المدرسة';end if;
 update public.platform_presentation set school_label=btrim(school_name),platform_name=draft.platform_name,school_site=draft.school_site,logo_data=draft.logo_data,login_subtitle=draft.login_subtitle,welcome_enabled=draft.welcome_enabled,welcome_presets=draft.welcome_presets,welcome_mode=draft.welcome_mode,welcome_autoplay=draft.welcome_autoplay,welcome_repeat=draft.welcome_repeat,welcome_volume=draft.welcome_volume,welcome_caption=draft.welcome_caption,background_style=draft.background_style,default_mode=draft.default_mode,default_density=draft.default_density,default_font_size=draft.default_font_size,reduce_motion=draft.reduce_motion,notification_indicator=draft.notification_indicator where id=true;
 if not found then raise exception 'تعذر حفظ إعدادات الواجهة';end if;
end$$;
revoke all on function public.save_platform_configuration(text,text,text,date,jsonb) from public,anon;
grant execute on function public.save_platform_configuration(text,text,text,date,jsonb) to authenticated;

create function public.platform_roster_health() returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if private.current_role() not in('admin','principal') or private.current_role() is null then raise exception 'فحص البيانات لمدير المنصة' using errcode='42501';end if;
 return jsonb_build_object('students',(select count(distinct national_id) from public.students where active),'enrollments',(select count(*) from public.students where active),'diploma',(select count(*) from public.students where active and program_id='diploma'),'bilingual',(select count(*) from public.students where active and program_id='bilingual'),'classes',(select count(*) from public.classes where active),'duplicate_students',(select count(*) from(select program_id,national_id from public.students where active group by program_id,national_id having count(*)>1)x),'duplicate_classes',(select count(*) from(select program_id,private.roster_key(stage),private.roster_key(grade),private.roster_key(section) from public.classes where active group by 1,2,3,4 having count(*)>1)x),'invalid_ids',(select count(*) from public.students where active and (national_id is null or national_id !~ '^[0-9]{10}$')),'wrong_program',(select count(*) from public.students s join public.classes c on c.id=s.class_id where s.active and s.program_id<>c.program_id),'archived_class_students',(select count(*) from public.students s join public.classes c on c.id=s.class_id where s.active and not c.active));
end$$;
revoke all on function public.platform_roster_health() from public,anon;
grant execute on function public.platform_roster_health() to authenticated;
