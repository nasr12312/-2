import test from 'node:test';import assert from 'node:assert/strict';
import {studentProgress,studentProgressReports,progressReportMarkup,matchesProgressActivity,studentProgressCsv} from '../src/utils/student-progress.mjs';
import {quranSurahs} from '../src/data/quran-surahs.mjs';
import {achievementNotes} from '../src/utils/student-achievement.mjs';
import {multiAssignment} from '../src/utils/multi-recitation.mjs';
import {flexibleNotes} from '../src/utils/flexible-evaluation.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
import {studentReportDocument} from '../src/utils/student-export.mjs';
const make=(id,day,segments,extra={})=>({id,studentId:1,weekId:1,day,track:'الحفظ',grade:'جيد',scores:[3],notes:flexibleNotes('multi',multiAssignment(segments.map(r=>({...r,recommendation:''})),quranSurahs),''),createdAt:'2026-08-25T09:00:00Z',...extra});
const row=(surahId,from,to)=>({surahId,from,to});
const first=make('first',0,[row(63,1,6)]),next=make('next',1,[row(62,1,4)]);
test('progress shows exact incomplete verses before changing surah and later completion updates current coverage, retaining the historical transition',()=>{
 const p=studentProgress([next,first],{studentId:1,until:'2026-08-24',termStartDate:'2026-08-23'});
 assert.equal(p.uniqueVerses,10);assert.deepEqual(p.surahs.find(s=>s.surahId===63).pending,[row(63,7,11)]);assert.equal(p.lastHeard.date,'2026-08-24');assert.match(p.transitions[0].text,/الجمعة/);assert.match(p.transitions[0].text,/المنافقون/);assert.deepEqual(p.transitions[0].pending,[row(63,7,11)]);
 const completed=studentProgress([first,next,make('finish',2,[row(63,7,11)])],{studentId:1,until:'2026-08-25',termStartDate:'2026-08-23'});assert.equal(completed.surahs.find(s=>s.surahId===63).complete,true);assert.equal(completed.uniqueVerses,15);assert.deepEqual(completed.transitions[0].pending,[row(63,7,11)]);
});
test('overlaps, repeated reviews and edited legacy duplicate rows never count the same verse twice, and unrelated tracks, students and future days are isolated',()=>{
 const updated={...first,notes:flexibleNotes('today','سورة المنافقون من الآية 2 إلى الآية 5',''),createdAt:'2026-08-28T10:00:00Z'};
 const p=studentProgress([first,updated,make('repeat',1,[row(63,4,7)]),make('other',0,[row(63,1,11)],{studentId:2}),make('review',0,[row(63,1,11)],{track:'المراجعة'}),make('future',4,[row(63,1,11)])],{studentId:1,until:'2026-08-24',termStartDate:'2026-08-23'});
 assert.equal(p.uniqueVerses,6);assert.deepEqual(p.surahs[0].heard,[row(63,2,7)]);assert.deepEqual(p.surahs[0].pending,[row(63,1,1),row(63,8,11)]);assert.equal(p.history.length,2);
});
test('same-day multiple surahs remain one daily evaluation without asserting a chronological switch inside the lesson',()=>{
 const p=studentProgress([make('multi',0,[row(63,1,6),row(62,3,5)])],{studentId:1,termStartDate:'2026-08-23'});assert.equal(p.history.length,1);assert.equal(p.partialCount,2);assert.equal(p.transitions.length,0);assert.equal(p.uniqueVerses,9);
});
test('checkpoint-only, legacy reached positions, unbounded evaluations and absence do not fabricate heard verses',()=>{
 const point=make('point',0,[]);point.notes=achievementNotes({track:'الحفظ',kind:'checkpoint',segments:[],position:{surahId:63,ayah:6},note:''},quranSurahs);
 const p=studentProgress([point],{studentId:1,termStartDate:'2026-08-23'});assert.equal(p.state,'position_only');assert.equal(p.uniqueVerses,0);assert.equal(p.position.ayah,6);assert.equal(p.surahs.length,0);
 const legacy=make('legacy',1,[]);legacy.notes=flexibleNotes('late','سورة المنافقون • وصل إلى الآية 8 (من بداية السورة)','');const l=studentProgress([legacy],{studentId:1,termStartDate:'2026-08-23'});assert.equal(l.position.ayah,8);assert.equal(l.uniqueVerses,0);
 const absent=studentProgress([{...first,grade:'غائب اليوم',scores:[]}],{studentId:1,termStartDate:'2026-08-23'});assert.equal(absent.uniqueVerses,0);assert.equal(absent.lastHeard,null);
 const empty=studentProgress([{...first,notes:'ممتاز'}],{studentId:1,termStartDate:'2026-08-23'});assert.equal(empty.state,'unbounded');assert.equal(empty.uniqueVerses,0);
});
test('surah percentages do not round an incomplete large surah to 100 and metadata remains consistent with all Quran verses',()=>{
 assert.equal(quranSurahs.length,114);assert.equal(quranSurahs.reduce((n,s)=>n+s.ayahs,0),6236);
 const p=studentProgress([make('large',0,[row(2,1,285)])],{studentId:1,termStartDate:'2026-08-23'});assert.equal(p.surahs[0].complete,false);assert.ok(p.surahs[0].percent<100);assert.deepEqual(p.surahs[0].pending,[row(2,286,286)]);
});
test('activity filters include everyone by default and distinguish recent, old and missing recitation without changing cumulative achievements',()=>{
 const p=studentProgress([first],{studentId:1,termStartDate:'2026-08-23'}),none=studentProgress([],{studentId:1});assert.equal(matchesProgressActivity(p,'all','2026-08-24'),true);assert.equal(matchesProgressActivity(none,'all','2026-08-24'),true);assert.equal(matchesProgressActivity(p,'recent','2026-08-30'),true);assert.equal(matchesProgressActivity(p,'stale','2026-08-31'),true);assert.equal(matchesProgressActivity(none,'stale','2026-08-31'),false);assert.equal(matchesProgressActivity(none,'missing','2026-08-31'),true);
});
test('individual and weekly reports include incomplete surahs and transition history without exposing another child, and PDF progress blocks stay flat',()=>{
 const entries=[first,next,make('other',0,[row(67,1,30)],{studentId:2})],groups=studentProgressReports(entries,{studentIds:[1],until:'2026-08-24',termStartDate:'2026-08-23'}),markup=progressReportMarkup(groups);
 assert.match(markup,/المنافقون/);assert.match(markup,/7–11/);assert.match(markup,/الجمعة/);assert.ok(!markup.includes('الملك'));assert.ok(!markup.includes('<section'));assert.ok(markup.includes('class="progress-surah-report"'));
 const report=studentReportDocument({name:'طالب',number:'secret',className:'أ'},'غراس','',{title:'تقرير',summary:'',recommendation:'',teacher:'المعلم',showNumber:false,progress:groups,records:[]});assert.ok(!report.includes('secret'));assert.match(report,/تسلسل إنجاز السور والآيات/);
 const weekly=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1}],entries,{date:'2026-08-24',termStartDate:'2026-08-23',school:'غراس',logo:'',teacher:'المعلم',classes:[{id:1,name:'أ'}]})[0];assert.match(weekly.content,/7–11/);assert.ok(!weekly.content.includes('الملك'));
 const escaped=progressReportMarkup(groups.map(g=>({...g,label:'<script>private</script>'})));assert.ok(!escaped.includes('<script>'));assert.ok(escaped.includes('&lt;script&gt;'));
});
test('CSV exports the filtered progress only and neutralizes spreadsheet formulas',()=>{
 const progress=studentProgress([first],{studentId:1,termStartDate:'2026-08-23'}),csv=studentProgressCsv([{student:{name:'=BAD()',id:1},className:'أ',progress}]);assert.ok(csv.includes("'=BAD()"));assert.match(csv,/المنافقون/);assert.match(csv,/7–11/);assert.equal(csv.split('\r\n').length,2);
});
