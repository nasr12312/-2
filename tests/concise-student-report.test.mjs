import test from 'node:test';
import assert from 'node:assert/strict';
import {studentReportDocument} from '../src/utils/student-export.mjs';
import {studentReportRecord} from '../src/utils/student-report-record.mjs';
const student={name:'طالب تجريبي',number:'private-number',className:'خامس / أ'};
const draft={title:'التقرير الأسبوعي لتسميع القرآن الكريم',teacher:'المعلم',summary:'',recommendation:'',fromDate:'2026-10-04',toDate:'2026-10-10',weekLabel:'الأسبوع 7'};
const evaluation=(extra={})=>({track:'الحفظ',grade:'جيد جدًا',scores:[4],notes:'متابعة الخطة: تسميع اليوم\nالمقرر الفعلي: الملك: الآيات 1–5\nملاحظة قصيرة',writtenFeedback:'توجيه محفوظ',nextStep:'مراجعة الآيات',...extra});
test('weekly form uses five school days, saved course and notes without statistics or invented guidance',()=>{
 const record=studentReportRecord(evaluation(),{date:'2026-10-04'});
 const html=studentReportDocument(student,'غراس','',{...draft,records:[record],progress:[{private:'must not appear'}],behavioralNotes:'سلوك لا يخص التقرير'});
 for(const text of ['الصف / الشعبة','التقييم الأسبوعي','الملك: الآيات 1–5','توجيه محفوظ','ملاحظة قصيرة','مراجعة الآيات','الأحد','الخميس'])assert.ok(html.includes(text),text);
 for(const text of ['private-number','must not appear','سلوك لا يخص التقرير','آخر متابعة','متوسط الدرجات','عدد التقييمات','آخر تحديث','تطبيق أحكام التجويد','10 دقائق'])assert.ok(!html.includes(text),text);
 const table=html.split('<table class="recitation-log">')[1].split('</table>')[0];
 assert.equal((table.match(/<tbody><tr>|<\/tr><tr>/g)||[]).length,5);
 assert.equal((table.match(/لم يُسجّل تقييم/g)||[]).length,4);
 assert.ok(!table.includes('غائب'));
});
test('several tracks on one day keep their own assignment, grade and note in the same row',()=>{
 const records=[studentReportRecord(evaluation(),{date:'2026-10-04'}),studentReportRecord(evaluation({track:'المراجعة',notes:'متابعة الخطة: تسميع اليوم\nالمقرر الفعلي: الفاتحة\nملاحظة المراجعة',grade:'جيد'}),{date:'2026-10-04'})];
 const html=studentReportDocument(student,'غراس','',{...draft,records});
 const table=html.split('<table class="recitation-log">')[1].split('</table>')[0];
 const review=table.split('<tr>').find(row=>row.includes('الفاتحة'));
 assert.ok(review.includes('المراجعة'));assert.ok(review.includes('ملاحظة المراجعة'));assert.ok(!review.includes('الملك'));
});
test('absence and hidden notes never expose old assignments, guidance, or fake performance levels',()=>{
 const record=studentReportRecord(evaluation({grade:'غائب اليوم'}),{date:'2026-10-04'});
 const html=studentReportDocument(student,'غراس','',{...draft,records:[record]});
 assert.ok(html.includes('غائب'));assert.ok(!html.includes('الملك'));assert.ok(!html.includes('توجيه محفوظ'));assert.ok(!html.includes('مراجعة الآيات'));
 const levels=html.split('<table class="weekly-levels">')[1].split('</table>')[0];assert.ok(!levels.includes('غائب'));
 const hidden=studentReportRecord(evaluation(),{date:'2026-10-04',includeNotes:false});assert.ok(hidden.assignment.includes('الملك'));assert.equal(hidden.notes,'');assert.equal(hidden.nextStep,'');
});
