import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
import {currentStudentReport} from '../src/utils/current-student-report.mjs';
import {reportPlannedLessons} from '../src/utils/report-planned-lessons.mjs';
const classroom={id:1,remoteId:'own',program:'bilingual',stage:'ابتدائي',grade:'خامس',name:'الخامس'};
const student={id:1,remoteId:'target',name:'طالب تجريبي',academicId:'9000000000',classId:1,program:'bilingual',active:true};
const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
const plans=days.map((day,i)=>({id:'p'+i,program:'bilingual',stage:'ابتدائي',grade:'خامس',week:10,day,track:'حفظ',text:'المقرر المطلوب '+i}));
const evaluation=(day,grade)=>({id:'e'+day,studentId:1,weekId:10,day,track:'الحفظ',grade,scores:grade==='جيد'?[3]:[],notes:day===1?'متابعة الخطة: متأخر عن الخطة\nالمقرر الفعلي: سورة الجمعة • من الآية 6 إلى الآية 7\nملاحظة المعلم':day===0?'راجع في المنزل':'',createdAt:'2026-10-29T07:00:00Z'});
const evaluations=[evaluation(0,'غائب اليوم'),evaluation(1,'جيد'),evaluation(2,'لم يسمّع'),evaluation(4,'لا يوجد تسميع اليوم')];
const options={date:'2026-10-29',termStartDate:'2026-08-23',classes:[classroom],plans,school:'غراس',logo:'',teacher:'المعلم'};
const rows=html=>html.split('<tbody>')[1].split('</tbody>')[0].split('<tr>').slice(1).map(row=>[...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(m=>m[1]));

test('every weekly school day displays the required lesson while absent and unassessed reached cells are truly empty',()=>{
 const file=weeklyStudentReports([student],evaluations,options)[0],table=rows(file.content);
 assert.equal(table.length,5);
 for(let day=0;day<5;day++)assert.ok(table[day][1].includes('المقرر المطلوب '+day));
 for(const day of [0,2,3,4])assert.equal(table[day][2],'');
 assert.match(table[0][3],/غائب/);assert.match(table[0][3],/راجع في المنزل/);
 assert.match(table[1][2],/سورة الجمعة/);assert.match(table[1][3],/ملاحظة المعلم/);
 assert.match(table[2][3],/لم يسمّع/);assert.match(table[3][3],/لا يوجد تقييم محفوظ/);assert.match(table[4][3],/لا تسميع اليوم/);
 assert.ok(!file.messageText.includes('المطلوب: —'));
});
test('individual and batch reports show identical required lessons and reached positions',()=>{
 const db={settings:{school:'غراس',logo:'',termStartDate:options.termStartDate},students:[student],classes:[classroom],schoolPlans:plans,evaluations:Object.fromEntries(evaluations.map(e=>[e.id,e]))};
 const individual=currentStudentReport(db,'target',{}, {teacher:'المعلم',date:options.date,period:'week'});
 assert.deepEqual(rows(individual.html),rows(weeklyStudentReports([student],evaluations,options)[0].content));
});
test('planned rows use only the correct class/program override and do not invent curriculum',()=>{
 const all=[...plans,{...plans[0],classId:'other',text:'شعبة أخرى'},{...plans[0],classId:'own',text:'تعديل شعبتي'},{...plans[0],program:'diploma',text:'مقرر آخر'}];
 const scheduled=reportPlannedLessons(all,classroom,{from:'2026-10-25',to:'2026-10-31',termStartDate:options.termStartDate});
 assert.equal(scheduled.length,5);assert.equal(scheduled[0].required,'تعديل شعبتي');
 assert.deepEqual(reportPlannedLessons([],classroom,{from:'2026-10-25',to:'2026-10-31'}),[]);
});
