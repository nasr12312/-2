import test from 'node:test';import assert from 'node:assert/strict';
import {recitationStatuses,numericEvaluationScore,conciseAssignment,conciseCheckpoint,recitationStatusTargets,recitationStatusLabel} from '../src/utils/recitation-status.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
import {flexibleNotes,readFlexibleNotes,achievementDescription} from '../src/utils/flexible-evaluation.mjs';
test('non-recitation statuses never become a score or dilute graded performance',()=>{
 const base={studentId:1,weekId:7,day:0,track:'الحفظ',createdAt:'2026-10-08T08:00:00Z',notes:''};
 const all=[{...base,grade:'متفوق',scores:[5]},...recitationStatuses.map((grade,i)=>({...base,day:i+1,track:'الحفظ · حالة يومية',grade,scores:[]}))];
 for(const e of all.slice(1))assert.equal(numericEvaluationScore({...e,scores:[0]}),null);
 const [report]=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1}],all,{date:'2026-10-08',termStartDate:'2026-08-23',classes:[{id:1,name:'أ'}],school:'غراس',logo:'',teacher:'المعلم'});
 assert.ok(report.content.includes('متفوق'));assert.ok(!report.content.includes('متوسط'));for(const label of recitationStatuses)assert.ok(report.content.includes(recitationStatusLabel(label)));assert.ok(!report.messageText.includes('undefined'));assert.ok(!report.messageText.includes('(0/5)'));
});
test('class status skips graded students, repeated status and duplicate enrollment IDs',()=>{
 const students=[{id:1,remoteId:'a'},{id:2,remoteId:'b'},{id:3,remoteId:'c'},{id:4,remoteId:'d'},{id:5},{id:6,remoteId:'d'}];
 const rows=[{studentId:1,weekId:7,day:4,track:'الحفظ · إنجاز فردي x',grade:'متفوق'},{studentId:2,weekId:7,day:4,track:'الحفظ · حالة يومية',grade:'غائب اليوم'},{studentId:3,weekId:7,day:3,track:'الحفظ',grade:'جيد'},{studentId:4,weekId:7,day:4,track:'التلاوة',grade:'جيد'}];
 assert.deepEqual(recitationStatusTargets(students,rows,{week:7,day:4,track:'الحفظ',status:'غائب اليوم',bulk:true}).map(s=>s.id),[3,4]);
 assert.deepEqual(recitationStatusTargets([students[0]],rows,{week:7,day:4,track:'الحفظ',status:'لم يسمّع'}).map(s=>s.id),[1]);
});
test('parent wording is concise without changing stored checkpoint semantics',()=>{
 assert.equal(conciseAssignment('سورة النازعات • وصل إلى الآية 24 (من بداية السورة)'),'النازعات حتى الآية 24');
 assert.equal(conciseCheckpoint('مراجعة وتثبيت عند الموضع نفسه؛ لا يُحتسب تقدم جديد.'),'مراجعة وتثبيت.');
});
test('absence retains its required plan and teacher note without showing old reached work or next step',()=>{
 const notes=flexibleNotes('today','الإخلاص: الآيات 1–4','أحسنت');assert.equal(readFlexibleNotes(notes).mode,'today');assert.equal(achievementDescription({notes}),'الإخلاص: الآيات 1–4');
 const [report]=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1}],[{studentId:1,weekId:7,day:4,track:'الحفظ · حالة يومية',grade:'غائب اليوم',scores:[],notes:'ملاحظة قديمة لا تعرض',nextStep:'توجيه قديم لا يعرض',planEntryId:'p',createdAt:'2026-10-08T08:00:00Z'}],{date:'2026-10-08',termStartDate:'2026-08-23',classes:[{id:1,name:'أ'}],plans:[{id:'p',text:'خطة لا تعرض'}],school:'غراس',logo:'',teacher:'المعلم'});
 assert.ok(report.content.includes('خطة لا تعرض'));assert.ok(report.content.includes('ملاحظة قديمة لا تعرض'));assert.ok(!report.content.includes('توجيه قديم لا يعرض'));assert.ok(report.content.includes('غائب'));
});

