import test from 'node:test';
import assert from 'node:assert/strict';
import {curriculumSurahs,searchSurahs,explicitRecitationSegments,remainingRecitation,teacherRecitationSummary} from '../src/utils/recitation-followup.mjs';
import {flexibleNotes} from '../src/utils/flexible-evaluation.mjs';
import {multiAssignment} from '../src/utils/multi-recitation.mjs';
import {achievementNotes} from '../src/utils/student-achievement.mjs';
import {followupNotes} from '../src/utils/student-followup.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
const surahs=[{id:67,name:'الملك',ayahs:30},{id:68,name:'القلم',ayahs:52},{id:112,name:'الإخلاص',ayahs:4},{id:113,name:'الفلق',ayahs:5},{id:114,name:'الناس',ayahs:6},{id:50,name:'ق',ayahs:45},{id:38,name:'ص',ayahs:88}];
const plans=[{week:1,day:'الأحد',track:'حفظ',text:'سورة الملك 1–5'},{week:1,day:'الاثنين',track:'حفظ',text:'الملك 6–10 / القلم 1–5'},{week:1,day:'الثلاثاء',track:'حفظ',text:'الإخلاص كاملة'},{week:1,day:'الأحد',track:'تلاوة',text:'الفلق والناس'}];
const row=(id,day,assignment,extra={})=>({id,studentId:1,weekId:1,day,track:'الحفظ',grade:'جيد',scores:[3],notes:flexibleNotes('today',assignment,''),createdAt:`2026-08-${23+day}T09:00:00Z`,...extra});
const dateOf=e=>'2026-08-'+(23+e.day);
test('late picker uses only due curriculum surahs and Arabic search does not add other tracks or future assignments',()=>{
 const allowed=curriculumSurahs(plans,surahs,{track:'حفظ',week:1,day:1});assert.deepEqual(allowed.map(s=>s.id),[67,68]);assert.deepEqual(searchSurahs(allowed,'سورة الْمُلْك').map(s=>s.id),[67]);assert.deepEqual(searchSurahs(allowed,'٦٨').map(s=>s.id),[68]);assert.equal(searchSurahs(allowed,'الناس').length,0);
 assert.deepEqual(curriculumSurahs([{week:1,day:'الأحد',track:'حفظ',text:'الناس والفلق'}],surahs,{track:'حفظ',week:1,day:0}).map(s=>s.id),[113,114]);
 assert.equal(curriculumSurahs([{week:1,day:'الأحد',track:'حفظ',text:'مراجعة الفصل'}],surahs,{track:'حفظ',week:1,day:0}).length,0);
});
test('manual notes parse two surahs, Arabic digits, daily plan boundaries and explicit whole surah without inventing missing verses',()=>{
 assert.deepEqual(explicitRecitationSegments('سورة الملك من الآية ١ إلى الآية ٥، وسورة القلم من الآية ٣ إلى الآية ٨',surahs),[{surahId:67,from:1,to:5},{surahId:68,from:3,to:8}]);
 assert.deepEqual(explicitRecitationSegments('ق 1–23 — 6–11',surahs),[{surahId:50,from:6,to:11}]);
 for(const text of ['الملك','الملك وصل إلى الآية 8','الملك 10–3','الملك 1–31','مراجعة الفصل'])assert.deepEqual(explicitRecitationSegments(text,surahs),[],text);
 assert.deepEqual(explicitRecitationSegments('سورة الإخلاص كاملة',surahs),[{surahId:112,from:1,to:4}]);
 assert.deepEqual(explicitRecitationSegments('الملك 1–5\nالتوصية: تثبيت 8–10',surahs),[{surahId:67,from:1,to:5}]);
});
test('remaining ranges subtract overlapping passages exactly, preserving gaps and other surahs',()=>{
 const required=[{surahId:67,from:1,to:10},{surahId:67,from:5,to:12},{surahId:68,from:1,to:5}],heard=[{surahId:67,from:3,to:5},{surahId:67,from:4,to:7},{surahId:67,from:10,to:12}];
 assert.deepEqual(remainingRecitation(required,heard),[{surahId:67,from:1,to:2},{surahId:67,from:8,to:9},{surahId:68,from:1,to:5}]);
});
test('teacher summary links prior lessons, current multi-surah draft and remaining work without counting absence, other students, review, future or superseded records',()=>{
 const old=row('old',0,'الملك 1–2'),corrected={...old,notes:flexibleNotes('today','الملك 1–5',''),createdAt:'2026-08-24T12:00:00Z'};
 const today=row('today',1,'');today.notes=flexibleNotes('multi_late',multiAssignment([{surahId:67,from:6,to:8,recommendation:''},{surahId:68,from:1,to:3,recommendation:''}],surahs),'للتثبيت');
 const summary=teacherRecitationSummary({records:[old,corrected,row('other',0,'القلم 1–5',{studentId:2}),row('review',0,'القلم 1–5',{track:'المراجعة'}),row('future',2,'الملك كاملة'),row('absent',0,'القلم 1–5',{grade:'غائب اليوم'})],studentId:1,track:'الحفظ',date:dateOf(today),dateOf,entries:plans,week:1,day:1,assignment:plans[1].text,draft:today,surahs});
 assert.deepEqual(summary.pending,[{surahId:67,from:9,to:10},{surahId:68,from:4,to:5}]);assert.equal(summary.suggestedMode,'multi_late');assert.equal(summary.today.length,2);assert.match(summary.todayText,/القلم/);
});
test('position-only records and unbounded plans never turn into completed recitation',()=>{
 const checkpoint=row('point',0,'');checkpoint.notes=achievementNotes({track:'الحفظ',kind:'checkpoint',segments:[],position:{surahId:67,ayah:20},note:''},surahs);
 const draft=row('today',1,'الملك');const summary=teacherRecitationSummary({records:[checkpoint],studentId:1,track:'الحفظ',date:dateOf(draft),dateOf,entries:[],week:1,day:1,assignment:'الملك',draft,surahs});
 assert.equal(summary.today.length,0);assert.equal(summary.previous,null);assert.equal(summary.suggestedMode,null);assert.equal(summary.planned.length,0);assert.equal(summary.todayText,'الملك');
});
test('handwritten achievement feeds the same followup and report, and later absence does not claim those verses were recited',()=>{
 const text='سورة الملك من الآية 1 إلى الآية 5، وسورة القلم من الآية 3 إلى الآية 8';
 const draft=row('daily',1,'');draft.notes=followupNotes('',{mode:'multi_late',assignment:text,note:'تثبيت الخواتيم',assignmentChanged:true},surahs);
 const options={records:[],studentId:1,track:'الحفظ',date:dateOf(draft),dateOf,entries:plans,week:1,day:1,assignment:plans[1].text,draft,surahs};
 assert.equal(teacherRecitationSummary(options).today.length,2);
 const report=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1}],[draft],{date:dateOf(draft),termStartDate:'2026-08-23',classes:[{id:1,name:'أ'}],school:'غراس',logo:'',teacher:'المعلم'})[0];
 for(const expected of ['الملك','القلم','تثبيت الخواتيم'])assert.ok(report.content.includes(expected));
 const absent=teacherRecitationSummary({...options,draft:{...draft,grade:'غائب اليوم',scores:[]}});assert.equal(absent.today.length,0);assert.equal(absent.todayText,'غائب');
});
