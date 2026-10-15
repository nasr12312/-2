// Local browser regression test. All database requests are intercepted.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const teacher='11111111-1111-4111-8111-111111111111';
const cls={id:'test-class',name:'اول - أ',program_id:'bilingual',stage:'ابتدائي',grade:'اول',section:'أ',active:true};
const students=[{id:'test-student',full_name:'طالب اختبار المعاينة',national_id:'1000000001',class_id:cls.id,program_id:'bilingual',active:true,account_status:'active'}];
let evaluation={id:'22222222-2222-4222-8222-222222222222',client_key:'test-student|7|4|الحفظ',student_id:'test-student',plan_entry_id:'test-plan',teacher_id:teacher,teacher_name:'معلم الاختبار',grade:'جيد',score:3,scores:[3,3,3,3,3,3],notes:'ملاحظة سابقة محفوظة',written_feedback:'تقييم كتابي سابق',encouragement:'أحسنت',next_step:'راجع المقرر',evaluated_at:'2026-10-08T08:00:00Z'};
const plan={id:'test-plan',program_id:'bilingual',stage:'ابتدائي',grade:'اول',week_label:'7',day_name:'الخميس',assignment_type:'حفظ',assignment_text:'الفاتحة كاملة'};
students.push(...[2,3].map(n=>({...students[0],id:'test-student-'+n,full_name:'طالب اختبار '+n,national_id:'100000000'+n})));
const evaluationRows=[evaluation];let sends=0,updates=0,archives=0,family=false,failNext=false;
const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('**/*.supabase.co/**',async route=>{
 const request=route.request(),url=new URL(request.url()),path=url.pathname;let value=[];
 if(path.includes('/functions/v1/teacher-management')){const input=request.postDataJSON();assert.equal(input.action,'student_archive');students[0].active=false;archives++;value={ok:true,id:students[0].id};}
 else if(path.endsWith('/rpc/send_weekly_reports')){sends++;throw Error('The test must never send reports');}
 else if(path.endsWith('/rpc/teacher_workspace'))value={classes:[cls],students,audit:[]};
 else if(path.endsWith('/rpc/visible_evaluations'))value=evaluationRows;
 else if(path.endsWith('/rpc/my_quran_plan'))value=[plan];
 else if(path.endsWith('/profiles'))value={user_id:teacher,full_name:'معلم الاختبار',role:family?'family':'teacher',active:true,setup_complete:true};
 else if(path.endsWith('/classes'))value=[cls];
 else if(path.endsWith('/students'))value=students.filter(s=>s.active);
 else if(path.endsWith('/teacher_class_assignments'))value=[{teacher_id:teacher,class_id:cls.id}];
 else if(path.endsWith('/platform_settings'))value={school:'مدارس غراس الأخلاق الأهلية',term:'الفصل الأول',year:1448,term_start_date:'2026-08-23'};
 else if(path.endsWith('/account_preferences')||path.endsWith('/platform_presentation'))value=null;
 else if(path.endsWith('/evaluations')&&request.method()==='POST'){const input=request.postDataJSON();const inputs=Array.isArray(input)?input:[input];const ids=[];for(const row of inputs){const previous=evaluationRows.find(e=>e.client_key===row.client_key);evaluation={...(previous||{}),...row,id:previous?.id||'test-evaluation-'+evaluationRows.length};if(previous)Object.assign(previous,evaluation);else evaluationRows.push(evaluation);ids.push({id:evaluation.id})}updates++;value=Array.isArray(input)?ids:ids[0];}
 else if(path.endsWith('/auth/v1/user'))value={id:teacher,email:'test@login.gheras.local'};
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
});
await page.addInitScript(({teacher})=>{const encode=v=>btoa(JSON.stringify(v));const jwt=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:teacher,exp:Math.floor(Date.now()/1000)+3600})+'.test';localStorage.setItem('sb-movfuflqgztlctdpbrbl-auth-token',JSON.stringify({access_token:jwt,refresh_token:'test-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:{id:teacher,email:'test@login.gheras.local',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}}));},{teacher});
try{
 await page.clock.setFixedTime(new Date('2026-10-08T09:00:00Z'));
 await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.daily-status-options').waitFor();assert.equal(await page.locator('.grade-choice').count(),0);
 await page.getByRole('button',{name:'غائب',exact:true}).click();assert.equal(await page.locator('.assignment-block').count(),0);assert.equal(await page.locator('.flexible-evaluation').count(),0);
 await page.getByRole('button',{name:'كل الشعبة (3)',exact:true}).click();await page.getByRole('button',{name:'مراجعة حالة الشعبة',exact:true}).click();
 const modal=page.getByRole('dialog');await modal.waitFor();assert.equal(await modal.locator('li').count(),2);assert.ok(!(await modal.innerText()).includes(students[0].full_name));
 await page.getByRole('button',{name:'تأكيد حفظ حالة الشعبة',exact:true}).click();await page.getByText('تم حفظ الحالة لـ 2 طالب وإشعار أولياء أمورهم',{exact:true}).waitFor();assert.equal(updates,1);assert.equal(evaluationRows.length,3);
 for(const e of evaluationRows.slice(1)){assert.equal(e.score,null);assert.deepEqual(e.scores,[]);assert.equal(e.plan_entry_id,null);assert.equal(e.notes,'');assert.equal(e.next_step,'')}
 assert.equal(evaluationRows[0].notes,'ملاحظة سابقة محفوظة');assert.equal(await page.getByRole('button',{name:'مراجعة حالة الشعبة',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'هذا الطالب',exact:true}).click();await page.getByRole('button',{name:'لم يسمّع',exact:true}).click();await page.getByRole('button',{name:'حفظ الحالة',exact:true}).click();await page.getByText('تم حفظ الحالة لـ 1 طالب وإشعار أولياء أمورهم',{exact:true}).waitFor();assert.equal(evaluationRows.length,4);
 await page.getByRole('button',{name:'تسميع',exact:true}).click();await page.getByRole('button',{name:'+ إضافة سورة أو مقطع',exact:true}).click();await page.getByLabel('سورة المقطع 1',{exact:true}).selectOption('112');
 await page.getByRole('checkbox',{name:'الانتقال للطالب التالي',exact:true}).uncheck();await page.locator('.grade-choice').first().click();await page.getByRole('button',{name:'حفظ إنجاز الطالب وإشعار ولي الأمر',exact:true}).click();await page.getByText('تم الحفظ وإرسال ملخص التقييم لولي الأمر',{exact:true}).waitFor();assert.ok(evaluation.notes.includes('الإخلاص'));assert.ok(!evaluation.notes.includes('الفاتحة'));assert.equal(evaluation.plan_entry_id,null);assert.equal(evaluationRows.length,5);
 family=true;await page.reload();const result=page.locator('.result-card').filter({has:page.getByRole('heading',{name:'لم يسمّع',exact:true})});await result.waitFor();assert.equal(await result.locator('progress,.result-assignment,.result-next,h3').count(),0);assert.ok(!(await result.innerText()).includes('خطة'));assert.ok(!(await result.innerText()).includes('ملاحظة سابقة'));
 const actual=page.locator('.result-card').filter({hasText:'الإخلاص'});await actual.waitFor();assert.ok(!(await actual.innerText()).includes('الفاتحة'));assert.equal(sends,0);
 console.log('Today assessment: exact recited surah, compact status, safe class batch, repeat protection and parent display passed');
}finally{await browser.close()}
