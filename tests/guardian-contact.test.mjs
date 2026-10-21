import test from 'node:test';
import assert from 'node:assert/strict';
import {fixedGuardianReportMessage,guardianPhone,safeResourceUrl,guardianMessage,whatsappReportUrl} from '../src/utils/guardian-contact.mjs';
import {studentReportDocument} from '../src/utils/student-export.mjs';
import {reportEvaluations} from '../src/utils/report-evaluations.mjs';
test('guardian phones normalize Saudi local, Arabic digits and international format; reject malformed numbers',()=>{
 assert.equal(guardianPhone('٠٥٠ ١٢٣ ٤٥٦٧'),'966501234567');assert.equal(guardianPhone('+966 (50) 123-4567'),'966501234567');assert.equal(guardianPhone('00966501234567'),'966501234567');
 for(const value of ['123','050abc1234567','000000000000','05','1234567890123456'])assert.equal(guardianPhone(value),'');
 assert.equal(whatsappReportUrl('bad','text'),'');assert.equal(new URL(whatsappReportUrl('0501234567','نص & تقرير')).searchParams.get('text'),'نص & تقرير');
});
test('links accept HTTPS without embedded credentials',()=>{assert.equal(safeResourceUrl('javascript:alert(1)'),'');assert.equal(safeResourceUrl('http://example.com'),'');assert.equal(safeResourceUrl('https://user:pass@example.com'),'');assert.equal(safeResourceUrl('https://example.com/file'),'https://example.com/file')});

test('fixed guardian message identifies student, teacher and report without confusing generation and sending dates',()=>{
 const reportUrl='https://gherasquran.com/?report=00000000-0000-4000-8000-000000000001';
 const message=fixedGuardianReportMessage({student:'أحمد',school:'غراس الأخلاق',teacher:'معلم أحمد',teacherPhone:'0501234567',title:'تقرير المتابعة',generatedAt:'2026-10-19T22:00:00Z',sentAt:'2026-10-21T10:00:00Z',reportUrl});
 for(const text of ['أحمد','معلم أحمد','غراس الأخلاق','تاريخ توليد التقرير:','تاريخ الرسالة:','+966501234567',reportUrl])assert.ok(message.includes(text));
 assert.ok(message.includes(new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date('2026-10-20T00:00:00+03:00'))));
 assert.equal(new URL(whatsappReportUrl('0501234567',message)).searchParams.get('text'),message);
 assert.ok(!message.includes('تم الإرسال'));assert.ok(!message.includes('undefined'));
});
test('PDF attachment message opens independently without a platform URL or a parent-login instruction',()=>{
 const message=fixedGuardianReportMessage({student:'أحمد',school:'غراس',teacher:'المعلم',title:'تقرير المتابعة',generatedAt:'2026-10-21T10:00:00Z',sentAt:'2026-10-21T10:00:00Z',attachment:true});
 assert.ok(message.includes('PDF'));assert.ok(message.includes('أحمد'));assert.ok(!message.includes('https://'));assert.ok(!message.includes('يرجى الدخول'));assert.ok(!message.includes('undefined'));
});
test('report preserves and escapes editable academic and behavioral notes without including a login number',()=>{
 const html=studentReportDocument({name:'طالب',number:'1234567890',className:'ثاني متوسط'},'مدرسة','',{title:'تقرير',summary:'ملخص',recommendation:'متابعة',teacher:'معلم',showNumber:false,academicNotes:'<script>bad</script>',behavioralNotes:'انضباط جيد',records:[]});
 assert.ok(html.includes('ملاحظات أكاديمية'));assert.ok(html.includes('انضباط جيد'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('1234567890'));
 const message=guardianMessage({student:'طالب',school:'مدرسة',title:'تقرير',summary:'ملخص',academic:'تثبيت الحفظ',behavioral:'انضباط',recommendation:'مراجعة',records:Array.from({length:12},(_,i)=>({date:String(i),track:'المراجعة',grade:'جيد',feedback:'آيات'}))});assert.equal((message.match(/المراجعة/g)||[]).length,8);assert.ok(!message.includes('مرفق'));
});
test('review grades and daily statuses do not replace memorization grades in reports',()=>{
 const make=(track,grade)=>({studentId:1,weekId:1,day:0,track,grade,createdAt:'2026-08-23T08:00:00Z'});const rows=reportEvaluations([make('الحفظ','متفوق'),make('المراجعة','جيد')],'2026-08-23');assert.equal(rows.length,2);assert.ok(rows.some(e=>e.track==='المراجعة'));
});
