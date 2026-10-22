import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionFetch} from '../src/utils/session-fetch.mjs';
import {reportReadiness} from '../src/utils/report-readiness.mjs';
import {studentReportDocument} from '../src/utils/student-export.mjs';
import {cleanReportFooter} from '../src/utils/report-presentation.mjs';

const base='https://school.supabase.co',key='public-test-key';
test('expired screen cannot save or read private student tables as anon, and prompts sign in instead of a pupil permission error',async()=>{
 let calls=0,expired=0;const fetcher=sessionFetch(async()=>{calls++;return new Response('{}')},base,key,()=>expired++);
 for(const [path,method] of [['evaluations','POST'],['shared_student_reports','GET'],['student_guardian_contacts','GET']]){
  const r=await fetcher(base+'/rest/v1/'+path,{method,headers:{authorization:'Bearer '+key}});
  assert.equal(r.status,401);assert.equal((await r.json()).code,'session_expired');
 }
 assert.equal(calls,0);assert.equal(expired,3);
});
test('valid staff request is sent once, retains token and signal, and failed writes are never automatically retried',async()=>{
 const calls=[];let expired=0;const fetcher=sessionFetch(async(input,init)=>{calls.push({input,init});return new Response('{}',{status:401})},base,key,()=>expired++);
 const controller=new AbortController(),init={method:'POST',headers:{authorization:'Bearer staff-session-token'},signal:controller.signal};
 await fetcher(base+'/rest/v1/evaluations',init);assert.equal(calls.length,1);assert.equal(calls[0].init,init);assert.equal(expired,1);
});
test('public presentation and auth refresh keep working without a session; other hosts do not trigger school logout',async()=>{
 let calls=0,expired=0;const fetcher=sessionFetch(async()=>{calls++;return new Response('{}')},base,key,()=>expired++);
 for(const path of [base+'/rest/v1/platform_presentation?select=*',base+'/auth/v1/token?grant_type=refresh_token','https://other.invalid/rest/v1/evaluations'])await fetcher(path);
 assert.equal(calls,3);assert.equal(expired,0);
 const request=new Request(base+'/rest/v1/evaluations',{headers:{authorization:'Bearer staff-session-token'}});await fetcher(request);assert.equal(calls,4);
 assert.equal((await fetcher(base+'/rest/v1/platform_presentation',{method:'PATCH'})).status,401);
});
test('saved evaluations are ready to generate at sending time, independent of manually frozen report snapshots',()=>{
 assert.equal(reportReadiness({phone:'966500000000',report:null,hasEvaluations:true}).ready,true);
 assert.equal(reportReadiness({phone:'',report:{id:'snapshot'},hasEvaluations:true}).state,'phone');
 assert.equal(reportReadiness({phone:'966500000000',report:null,hasEvaluations:false}).state,'report');
 assert.equal(reportReadiness({phone:'966500000000',report:{id:'snapshot'},hasEvaluations:false}).ready,true);
});
test('new and old reports omit the generic footer text and signature blanks while preserving teacher notes and author',()=>{
 const old='<article><p>ملاحظات معلم خاصة</p><footer>أعدّه: معلم تجريبي<p>النتائج من السجلات المحفوظة. يُحسب متوسط كل مسار من درجاته المسجلة فقط؛ موضع الوصول وحده لا يثبت تسميع الآيات السابقة.</p>توقيع المعلم: ........................ • اعتماد المشرف: ........................</footer></article>';
 const clean=cleanReportFooter(old);assert.ok(clean.includes('ملاحظات معلم خاصة'));assert.ok(clean.includes('أعدّه: معلم تجريبي'));assert.ok(!clean.includes('النتائج من السجلات'));assert.ok(!clean.includes('توقيع المعلم'));
 const fresh=studentReportDocument({name:'طالب تجريبي',className:'شعبة',number:''},'مدرسة','',{title:'تقرير',summary:'ملاحظات المعلم',teacher:'معلم',showNumber:false,records:[]});assert.ok(fresh.includes('ملاحظات المعلم'));assert.ok(!fresh.includes('النتائج من السجلات'));assert.ok(!fresh.includes('توقيع المعلم'));
});
