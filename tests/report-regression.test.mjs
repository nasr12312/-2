import test from 'node:test';
import assert from 'node:assert/strict';
import {readAllPages} from '../src/utils/read-all-pages.mjs';
import {studentReportPlan,studentReportRecord,studentReportRecords} from '../src/utils/student-report-record.mjs';
import {studentReportDocument} from '../src/utils/student-export.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
const classroom={id:1,remoteId:'own',program:'bilingual',stage:'ابتدائي',grade:'خامس',name:'الخامس'};
const plan={id:'plan',program:'bilingual',stage:'ابتدائي',grade:'خامس',week:10,day:'الثلاثاء',track:'حفظ',text:'سورة النبأ 1–10'};
const evaluation={studentId:1,weekId:10,day:2,track:'الحفظ',notes:'',grade:'جيد',scores:[3],createdAt:'2026-10-29T09:00:00Z'};
const student={id:1,name:'طالب تجريبي',academicId:'9000000000',classId:1,program:'bilingual',className:'الخامس'};
test('all evaluation pages load including records beyond 1000, and later page errors stop incomplete reports',async()=>{
 const source=Array.from({length:3034},(_,id)=>({id}));const ranges=[];
 const result=await readAllPages(()=>({range:async(from,to)=>{ranges.push([from,to]);return {data:source.slice(from,to+1),error:null}}}));
 assert.deepEqual(result.data,source);assert.deepEqual(ranges.at(-1),[3000,3499]);
 const error=Error('later page unavailable');await assert.rejects(readAllPages(()=>({range:async(from,to)=>from?{data:null,error}:{data:source.slice(from,to+1),error:null}})),error);
});
test('report matches الحفظ and التلاوة to curriculum حفظ and تلاوة and prioritizes own override',()=>{
 const own={...plan,classId:'own',text:'مقرر شعبتي'},other={...plan,classId:'other',text:'شعبة أخرى'};
 assert.equal(studentReportPlan(evaluation,[plan,other,own],classroom),own);
 assert.equal(studentReportPlan({...evaluation,planEntryId:plan.id},[plan,other,own],classroom),own);
 assert.equal(studentReportPlan({...evaluation,track:'التلاوة'},[{...plan,track:'تلاوة'}],classroom).track,'تلاوة');
 assert.equal(studentReportPlan({...evaluation,day:3},[plan],classroom),undefined);
 assert.equal(studentReportPlan(evaluation,[{...plan,program:'diploma'}],classroom),undefined);
});
test('saved assessment is shown without claiming an unrecorded reached verse or missing enrollment',()=>{
 const record=studentReportRecord(evaluation,{date:'2026-10-27',plan});
 assert.equal(record.reached,''); // A grade does not establish how far the pupil recited.
 const html=studentReportDocument(student,'غراس','',{title:'تقرير',teacher:'معلم',fromDate:'2026-10-25',toDate:'2026-10-31',records:[record]});
 assert.match(html,/سورة النبأ 1–10/);assert.match(html,/تقييم محفوظ؛ لم يُحدد موضع الوصول/);assert.match(html,/جيد/);assert.doesNotMatch(html,/غير مسجّل|لم يُسجّل تسميع/);
 const absent=studentReportRecord({...evaluation,grade:'غائب اليوم'},{date:'2026-10-27',plan});
 const absentHtml=studentReportDocument(student,'غراس','',{title:'تقرير',teacher:'معلم',records:[absent]});
 assert.match(absentHtml,/غائب/);assert.doesNotMatch(absentHtml,/تقييم محفوظ/);assert.match(absentHtml,/سورة النبأ 1–10/);
});
test('weekly report keeps lesson date rather than later save date and includes the matched required lesson',()=>{
 const file=weeklyStudentReports([student],[evaluation],{date:'2026-10-29',termStartDate:'2026-08-23',classes:[classroom],plans:[plan],school:'غراس',logo:'',teacher:'معلم'})[0];
 assert.match(file.content,/سورة النبأ 1–10/);assert.match(file.messageText,/2026-10-27/);assert.match(file.messageText,/تقييم محفوظ/);assert.doesNotMatch(file.content,/غير مسجّل/);
});

test('individual report uses selected lesson dates and track, excludes other children, and resolves daily contradictions',()=>{
 const old={...evaluation,weekId:9,day:2,createdAt:'2026-10-29T10:00:00Z'};
 const rows=[evaluation,old,{...evaluation,studentId:2},{...evaluation,track:'التلاوة'},{...evaluation,grade:'غائب اليوم',track:'الحفظ · حالة يومية',createdAt:'2026-10-27T08:00:00Z'}];
 const options={studentId:1,classroom,plans:[plan],from:'2026-10-18',to:'2026-10-24',track:'الحفظ',termStartDate:'2026-08-23'};
 const previous=studentReportRecords(rows,options);assert.equal(previous.length,1);assert.equal(previous[0].date,'2026-10-20');
 const current=studentReportRecords(rows,{...options,from:'2026-10-25',to:'2026-10-31'});assert.equal(current.length,1);assert.equal(current[0].date,'2026-10-27');assert.equal(current[0].grade,'جيد');
 assert.deepEqual(studentReportRecords(rows,{...options,studentId:undefined}),[]);
 assert.equal(studentReportRecords(rows,{...options,from:undefined,to:undefined}).length,2);
});
