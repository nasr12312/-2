import test from 'node:test';import assert from 'node:assert/strict';
import {recitationStatuses,numericEvaluationScore,conciseAssignment,conciseCheckpoint} from '../src/utils/recitation-status.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
test('non-recitation statuses never become a score or dilute graded performance',()=>{
 const base={studentId:1,weekId:7,day:0,track:'الحفظ',createdAt:'2026-10-08T08:00:00Z',notes:''};
 const all=[{...base,grade:'متفوق',scores:[5]},...recitationStatuses.map((grade,i)=>({...base,day:i+1,track:'الحفظ · حالة يومية',grade,scores:[]}))];
 for(const e of all.slice(1))assert.equal(numericEvaluationScore({...e,scores:[0]}),null);
 const [report]=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1}],all,{date:'2026-10-08',termStartDate:'2026-08-23',classes:[{id:1,name:'أ'}],school:'غراس',logo:'',teacher:'المعلم'});
 assert.ok(report.content.includes('5.0 / 5'));for(const label of recitationStatuses)assert.ok(report.content.includes(label));assert.ok(!report.messageText.includes('undefined'));assert.ok(!report.messageText.includes('(0/5)'));
});
test('parent wording is concise without changing stored checkpoint semantics',()=>{
 assert.equal(conciseAssignment('سورة النازعات • وصل إلى الآية 24 (من بداية السورة)'),'النازعات حتى الآية 24');
 assert.equal(conciseCheckpoint('مراجعة وتثبيت عند الموضع نفسه؛ لا يُحتسب تقدم جديد.'),'مراجعة وتثبيت.');
});
