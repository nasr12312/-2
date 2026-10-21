import test from 'node:test';import assert from 'node:assert/strict';
import {achievementNotes,achievementSummary,readAchievement,validateAchievement,heardVerseCount,lastAchievementPosition,recordedSegments} from '../src/utils/student-achievement.mjs';
import {readFlexibleNotes,achievementDescription,latestCheckpoint} from '../src/utils/flexible-evaluation.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
const surahs=[{id:1,name:'الفاتحة',ayahs:7},{id:67,name:'الملك',ayahs:30}],draft={track:'الحفظ',segments:[{surahId:67,from:12,to:15}],position:{surahId:67,ayah:15},note:'ملاحظة المعلم'};
test('legacy edits restore explicit ranges but never reinterpret a reached position or an unspecified plan as actual recitation',()=>{
 assert.deepEqual(recordedSegments('سورة الملك • من الآية 12 إلى الآية 15',surahs),draft.segments);assert.deepEqual(recordedSegments('سورة الملك • الآيات 12–15',surahs),draft.segments);assert.deepEqual(recordedSegments('سورة الملك • وصل إلى الآية 15 (من بداية السورة)',surahs),[]);assert.deepEqual(recordedSegments('مقرر سورة الملك',surahs),[]);
});
test('actual achievement keeps heard range distinct from reached position; never infers earlier verses or a grade',()=>{
 const notes=achievementNotes(draft,surahs),data=readAchievement(notes);assert.deepEqual(data.segments,draft.segments);assert.equal(data.position.ayah,15);assert.equal(data.grade,undefined);assert.match(achievementSummary(draft,surahs),/12–15/);assert.match(achievementSummary(draft,surahs),/هذه المتابعة: 4/);assert.ok(!readFlexibleNotes(notes).notes.includes('سجل الإنجاز:'));assert.match(achievementDescription({notes}),/موضع الوصول/);
 for(const segments of [[],[{surahId:67,from:0,to:15}],[{surahId:67,from:15,to:12}],[{surahId:67,from:1,to:31}]])assert.equal(validateAchievement({...draft,segments},surahs),false);
 assert.equal(validateAchievement({...draft,track:'المراجعة'},surahs),false);assert.equal(validateAchievement({...draft,track:'المراجعة',position:null},surahs),true);assert.equal(heardVerseCount([{surahId:67,from:1,to:5},{surahId:67,from:3,to:7}]),7);
});
test('editing an old record does not override a later lesson; review does not move memorization progress',()=>{
 const make=(id,day,ayah,extra={})=>({id,studentId:1,weekId:8,day,track:'الحفظ · إنجاز فردي '+id,createdAt:'2026-10-21T09:00:00Z',notes:achievementNotes({...draft,position:{surahId:67,ayah}},surahs),...extra});
 const rows=[make('old',0,13),make('recent',1,17),make('review',2,20,{notes:achievementNotes({...draft,track:'المراجعة',position:null},surahs),track:'المراجعة · إنجاز فردي review'}),make('other',2,25,{studentId:2})];
 const dateOf=e=>'2026-10-'+String(11+e.day).padStart(2,'0');assert.equal(lastAchievementPosition(rows,1,'2026-10-13',dateOf).record.position.ayah,17);assert.equal(lastAchievementPosition(rows,1,'2026-10-13',dateOf,'recent').record.position.ayah,13);
 assert.equal(latestCheckpoint(rows,surahs,{studentId:1,track:'الحفظ',date:'2026-10-13',termStartDate:'2026-08-23'}).ayah,17);
});
test('weekly report automatically includes actual achievement and teacher note; ungraded progress has no invented average',()=>{
 const e={id:'e',studentId:1,weekId:8,day:2,track:'الحفظ · إنجاز فردي e',grade:'إنجاز مسجل دون درجة',scores:[],notes:achievementNotes(draft,surahs),createdAt:'2026-10-13T09:00:00Z'};
 const report=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1}],[e],{date:'2026-10-13',termStartDate:'2026-08-23',classes:[{id:1,name:'ثاني متوسط'}],school:'غراس',logo:'',teacher:'المعلم'})[0];
 assert.match(report.content,/12–15/);assert.match(report.content,/ملاحظة المعلم/);assert.match(report.content,/لا توجد درجات مسجلة/);assert.ok(!report.content.includes('سجل الإنجاز:'));
});
