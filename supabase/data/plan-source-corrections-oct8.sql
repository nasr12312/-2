begin;
-- Normalize malformed Hijri labels without changing plan IDs or saved evaluations.
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='plan_57439630111704c7' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='shared_plan_57439630111704c7' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='plan_c95ea6bd4956b6fd' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='shared_plan_c95ea6bd4956b6fd' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='plan_3ddd5867e2d6740f' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='shared_plan_3ddd5867e2d6740f' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='plan_217cb357077ebc70' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='shared_plan_217cb357077ebc70' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='plan_d5982d7c907996b5' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='shared_plan_d5982d7c907996b5' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='shared_plan_3bcaa2c510f63b2d' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='plan_3bcaa2c510f63b2d' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='shared_plan_7e7bafef32326572' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='plan_7e7bafef32326572' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='shared_plan_b6b03ca371408a79' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 1 / 7' where id='plan_b6b03ca371408a79' and day_name='الخميس 1 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='shared_plan_512f172b14862f87' and day_name='الخميس 15 / 7 / 6';
update public.quran_plan_entries set day_name='الخميس 15 / 7' where id='plan_512f172b14862f87' and day_name='الخميس 15 / 7 / 6';
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_14_0','diploma','المتوسطة','الثاني المتوسط','14','الأحد 19 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_14_1','diploma','المتوسطة','الثاني المتوسط','14','الاثنين 20 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_14_2','diploma','المتوسطة','الثاني المتوسط','14','الثلاثاء 21 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_14_3','diploma','المتوسطة','الثاني المتوسط','14','الأربعاء 22 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_15_0','diploma','المتوسطة','الثاني المتوسط','15','الأحد 26/ 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_15_1','diploma','المتوسطة','الثاني المتوسط','15','الاثنين 27 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_15_2','diploma','المتوسطة','الثاني المتوسط','15','الثلاثاء 28 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_15_3','diploma','المتوسطة','الثاني المتوسط','15','الأربعاء 29 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_16_0','diploma','المتوسطة','الثاني المتوسط','16','الأحد 4 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_16_1','diploma','المتوسطة','الثاني المتوسط','16','الاثنين 5/ 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_16_2','diploma','المتوسطة','الثاني المتوسط','16','الثلاثاء 6 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_16_3','diploma','المتوسطة','الثاني المتوسط','16','الأربعاء 7 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_17_0','diploma','المتوسطة','الثاني المتوسط','17','الأحد 11 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_17_1','diploma','المتوسطة','الثاني المتوسط','17','الاثنين 12 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_17_2','diploma','المتوسطة','الثاني المتوسط','17','الثلاثاء 13 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_diploma_17_3','diploma','المتوسطة','الثاني المتوسط','17','الأربعاء 14 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='diploma' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_14_0','bilingual','المتوسطة','الثاني المتوسط','14','الأحد 19 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_14_1','bilingual','المتوسطة','الثاني المتوسط','14','الاثنين 20 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_14_2','bilingual','المتوسطة','الثاني المتوسط','14','الثلاثاء 21 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_14_3','bilingual','المتوسطة','الثاني المتوسط','14','الأربعاء 22 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9140
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='14' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_15_0','bilingual','المتوسطة','الثاني المتوسط','15','الأحد 26/ 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_15_1','bilingual','المتوسطة','الثاني المتوسط','15','الاثنين 27 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_15_2','bilingual','المتوسطة','الثاني المتوسط','15','الثلاثاء 28 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_15_3','bilingual','المتوسطة','الثاني المتوسط','15','الأربعاء 29 / 6','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9150
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='15' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_16_0','bilingual','المتوسطة','الثاني المتوسط','16','الأحد 4 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_16_1','bilingual','المتوسطة','الثاني المتوسط','16','الاثنين 5/ 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_16_2','bilingual','المتوسطة','الثاني المتوسط','16','الثلاثاء 6 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_16_3','bilingual','المتوسطة','الثاني المتوسط','16','الأربعاء 7 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9160
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='16' and day_name like 'الأربعاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_17_0','bilingual','المتوسطة','الثاني المتوسط','17','الأحد 11 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الأحد%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_17_1','bilingual','المتوسطة','الثاني المتوسط','17','الاثنين 12 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الاثنين%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_17_2','bilingual','المتوسطة','الثاني المتوسط','17','الثلاثاء 13 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الثلاثاء%' and assignment_type='حفظ');
insert into public.quran_plan_entries(id,program_id,stage,grade,week_label,day_name,assignment_type,assignment_text,source_form,sort_order)
select 'source_review_second_middle_bilingual_17_3','bilingual','المتوسطة','الثاني المتوسط','17','الأربعاء 14 / 7','حفظ','مراجعة مقرر الحفظ السابق','__استمارة القرآن الكريم - ثاني متوسط دبلومة تحفيظ - الفصل الأول 1448هـ_.docx',9170
where not exists(select 1 from public.quran_plan_entries where program_id='bilingual' and stage='المتوسطة' and grade='الثاني المتوسط' and week_label='17' and day_name like 'الأربعاء%' and assignment_type='حفظ');
commit;
