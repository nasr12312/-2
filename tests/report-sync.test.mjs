import test from 'node:test';
import assert from 'node:assert/strict';
import {createLatestLoad} from '../src/utils/latest-load.mjs';
import {currentStudentReport,prepareCurrentReport} from '../src/utils/current-student-report.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test('a slow old refresh cannot replace newer saved grades and all waiting readers receive the latest result',async()=>{
 const first=deferred(),second=deferred(),commits=[];let calls=0;
 const loader=createLatestLoad(()=>++calls===1?first.promise:second.promise,value=>commits.push(value));
 const a=loader.run(),b=loader.run();second.resolve('current-grade');assert.equal(await b,'current-grade');
 first.resolve('old-absence');assert.equal(await a,'current-grade');assert.deepEqual(commits,['current-grade']);
});
test('a late failure from an old refresh does not invalidate a successful newer refresh',async()=>{
 const first=deferred(),second=deferred();let calls=0;const loader=createLatestLoad(()=>++calls===1?first.promise:second.promise,()=>{});
 const a=loader.run(),b=loader.run();second.resolve('fresh');await b;first.reject(Error('old request failed'));assert.equal(await a,'fresh');
});
test('signing out prevents a pending refresh from restoring a previous account',async()=>{
 const load=deferred(),commits=[];const loader=createLatestLoad(()=>load.promise,value=>commits.push(value));const pending=loader.run();loader.invalidate();load.resolve('private-old-account');await assert.rejects(pending);assert.deepEqual(commits,[]);
});
const makeDatabase=grade=>({settings:{school:'مدرسة تجريبية',logo:'',termStartDate:'2026-08-23'},students:[{id:12,remoteId:'other',name:'طالب آخر',classId:1,active:true},{id:91,remoteId:'target',name:'الطالب المقصود',classId:1,program:'bilingual',active:true}],classes:[{id:1,remoteId:'class',name:'الخامس',program:'bilingual',stage:'ابتدائي',grade:'خامس'}],schoolPlans:[{id:'plan',program:'bilingual',stage:'ابتدائي',grade:'خامس',week:10,day:'الثلاثاء',track:'حفظ',text:'سورة النبأ 1–10'}],evaluations:{target:{id:'evaluation',studentId:91,weekId:10,day:2,track:'الحفظ',grade,scores:[5],notes:'متابعة الخطة: تسميع اليوم\nالمقرر الفعلي: سورة النبأ • من الآية 1 إلى الآية 8',createdAt:'2026-10-29T05:00:00Z'},other:{id:'other-eval',studentId:12,weekId:10,day:2,track:'الحفظ',grade:'ملاحظة لا تخص الطالب',scores:[3],notes:'',createdAt:'2026-10-29T05:00:00Z'}}});
const options={teacher:'المعلم',date:'2026-10-29',period:'week'};
test('regenerated reports use the stable pupil identity after local rows have been renumbered',()=>{
 const report=currentStudentReport(makeDatabase('متفوق'),'target',{},options);
 assert.match(report.html,/الطالب المقصود/);assert.match(report.html,/متفوق/);assert.match(report.html,/سورة النبأ/);assert.doesNotMatch(report.html,/طالب آخر|ملاحظة لا تخص الطالب/);
 assert.equal(report.records[0].date,'2026-10-27');assert.equal(report.student.id,91);
 assert.throws(()=>currentStudentReport(makeDatabase('متفوق'),'inaccessible',{},options));
});
test('delivery always fetches current evaluations and saves a new report instead of reusing prior HTML',async()=>{
 let server=makeDatabase('غائب اليوم');const calls=[],snapshots=[];
 const prepare=()=>prepareCurrentReport({studentId:'target',options,synchronize:async()=>{calls.push('load');return server;},readDraft:async()=>({summary:'ملاحظة المعلم'}),saveSnapshot:async draft=>{snapshots.push(draft);return {id:'snapshot-'+snapshots.length};}});
 const old=await prepare();assert.match(old.html,/غائب/);server=makeDatabase('متفوق');const fresh=await prepare();
 assert.equal(calls.length,2);assert.equal(snapshots.length,2);assert.notEqual(old.report.id,fresh.report.id);assert.match(fresh.html,/متفوق/);assert.doesNotMatch(fresh.html,/غائب/);assert.match(fresh.html,/ملاحظة المعلم/);
});
test('failed synchronization or inaccessible student never creates a misleading snapshot',async()=>{
 let writes=0;const base={studentId:'target',options,readDraft:async()=>({}),saveSnapshot:async()=>{writes++;return {};}};
 await assert.rejects(prepareCurrentReport({...base,synchronize:async()=>{throw Error('offline');}}));
 await assert.rejects(prepareCurrentReport({...base,studentId:'missing',synchronize:async()=>makeDatabase('متفوق')}));assert.equal(writes,0);
});
test('saved absences remain real statuses, and a selected empty day does not acquire another days grade',()=>{
 const db=makeDatabase('غائب اليوم');const absent=currentStudentReport(db,'target',{},options);assert.match(absent.html,/غائب/);assert.doesNotMatch(absent.html,/متفوق/);
 const empty=currentStudentReport(db,'target',{}, {...options,date:'2026-10-26',period:'day'});assert.equal(empty.records.length,0);assert.match(empty.html,/لا يوجد تقييم محفوظ لهذا اليوم/);assert.doesNotMatch(empty.html,/غائب/);
});


import {recitationStatusTargets} from '../src/utils/recitation-status.mjs';
test('bulk statuses leave canonical grades, achievements and prior statuses untouched, including a newly synchronized grade',()=>{
 const students=[{id:1,remoteId:'graded'},{id:2,remoteId:'status'},{id:3,remoteId:'empty'}];
 const rows=[{studentId:1,weekId:10,day:2,track:'الحفظ',grade:'متفوق'},{studentId:2,weekId:10,day:2,track:'الحفظ',grade:'غائب اليوم'}];
 assert.deepEqual(recitationStatusTargets(students,rows,{week:10,day:2,track:'الحفظ',status:'لم يسمّع',bulk:true}).map(s=>s.remoteId),['empty']);
 assert.deepEqual(recitationStatusTargets(students,[...rows,{studentId:3,weekId:10,day:2,track:'الحفظ',grade:'جيد'}],{week:10,day:2,track:'الحفظ',status:'لم يسمّع',bulk:true}),[]);
 assert.equal(recitationStatusTargets([students[0]],rows,{week:10,day:2,track:'الحفظ',status:'غائب اليوم',bulk:false}).length,1);
});
