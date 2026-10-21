import test from 'node:test';
import assert from 'node:assert/strict';
import {guardianPhone,safeResourceUrl,guardianMessage,whatsappReportUrl} from '../src/utils/guardian-contact.mjs';
import {studentReportDocument} from '../src/utils/student-export.mjs';
import {reportEvaluations} from '../src/utils/report-evaluations.mjs';
test('guardian phones normalize Saudi local, Arabic digits and international format; reject malformed numbers',()=>{
 assert.equal(guardianPhone('٠٥٠ ١٢٣ ٤٥٦٧'),'966501234567');assert.equal(guardianPhone('+966 (50) 123-4567'),'966501234567');assert.equal(guardianPhone('00966501234567'),'966501234567');
 for(const value of ['123','050abc1234567','000000000000','05','1234567890123456'])assert.equal(guardianPhone(value),'');
 assert.equal(whatsappReportUrl('bad','text'),'');assert.equal(new URL(whatsappReportUrl('0501234567','نص & تقرير')).searchParams.get('text'),'نص & تقرير');
});
test('links accept HTTPS without embedded credentials',()=>{assert.equal(safeResourceUrl('javascript:alert(1)'),'');assert.equal(safeResourceUrl('http://example.com'),'');assert.equal(safeResourceUrl('https://user:pass@example.com'),'');assert.equal(safeResourceUrl('https://example.com/file'),'https://example.com/file')});
test('report preserves and escapes editable academic and behavioral notes without including a login number',()=>{
 const html=studentReportDocument({name:'طالب',number:'1234567890',className:'ثاني متوسط'},'مدرسة','',{title:'تقرير',summary:'ملخص',recommendation:'متابعة',teacher:'معلم',showNumber:false,academicNotes:'<script>bad</script>',behavioralNotes:'انضباط جيد',records:[]});
 assert.ok(html.includes('ملاحظات أكاديمية'));assert.ok(html.includes('انضباط جيد'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('1234567890'));
 const message=guardianMessage({student:'طالب',school:'مدرسة',title:'تقرير',summary:'ملخص',academic:'تثبيت الحفظ',behavioral:'انضباط',recommendation:'مراجعة',records:Array.from({length:12},(_,i)=>({date:String(i),track:'المراجعة',grade:'جيد',feedback:'آيات'}))});assert.equal((message.match(/المراجعة/g)||[]).length,8);assert.ok(!message.includes('مرفق'));
});
test('review grades and daily statuses do not replace memorization grades in reports',()=>{
 const make=(track,grade)=>({studentId:1,weekId:1,day:0,track,grade,createdAt:'2026-08-23T08:00:00Z'});const rows=reportEvaluations([make('الحفظ','متفوق'),make('المراجعة','جيد')],'2026-08-23');assert.equal(rows.length,2);assert.ok(rows.some(e=>e.track==='المراجعة'));
});
