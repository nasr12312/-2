-- One child may be enrolled in both programs; family_students links both records.
alter table public.students drop constraint if exists students_national_id_key;
alter table public.students add constraint students_program_national_id_key unique(program_id,national_id);
