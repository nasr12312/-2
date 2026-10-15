// Local browser regression test. All database requests are intercepted.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const teacher='11111111-1111-4111-8111-111111111111';
const cls={id:'test-class',name:'اول - أ',program_id:'bilingual',stage:'ابتدائي',grade:'اول',section:'أ',active:true};
const students=[{id:'test-student',full_name:'طالب اختبار المعاينة',national_id:'1000000001',class_id:cls.id,program_id:'bilingual',active:true,account_status:'active'}];
let evaluation={id:'22222222-2222-4222-8222-222222222222',client_key:'test-student|7|4|الحفظ',student_id:'test-student',plan_entry_id:'test-plan',teacher_id:teacher,teacher_name:'معلم الاختبار',grade:'جيد',score:3,scores:[3,3,3,3,3,3],notes:'ملاحظة سابقة محفوظة',written_feedback:'تقييم كتابي سابق',encouragement:'أحسنت',next_step:'راجع المقرر',evaluated_at:'2026-10-08T08:00:00Z'};
const plan={id:'test-plan',program_id:'bilingual',stage:'ابتدائي',grade:'اول',week_label:'7',day_name:'الخميس',assignment_type:'حفظ',assignment_text:'الفاتحة كاملة'};
evaluation.notes='متابعة الخطة: متأخر عن الخطة\nالمقرر الفعلي: سورة الملك • وصل إلى الآية 15 (من بداية السورة)';const homework=[];let homeworkAttempts=0;const evaluationRows=[evaluation];let sends=0,updates=0,archives=0,family=false,failNext=true;
const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.route('**/*.supabase.co/**',async route=>{
 const request=route.request(),url=new URL(request.url()),path=url.pathname;let value=[];
 if(path.includes('/functions/v1/teacher-management')){const input=request.postDataJSON();assert.equal(input.action,'student_archive');students[0].active=false;archives++;value={ok:true,id:students[0].id};}
 else if(path.endsWith('/rpc/send_weekly_reports')){sends++;throw Error('The test must never send reports');}
 else if(path.endsWith('/rpc/teacher_workspace'))value={classes:[cls],students,audit:[]};
 else if(path.endsWith('/rpc/visible_evaluations'))value=evaluationRows;
 else if(path.endsWith('/rpc/my_quran_plan'))value=[plan];
 else if(path.endsWith('/profiles'))value={user_id:teacher,full_name:'معلم الاختبار',role:family?'family':'teacher',active:true,setup_complete:true};
 else if(path.endsWith('/quran_homework')){if(request.method()==='POST'){const input=request.postDataJSON();homeworkAttempts++;if(!homework.some(h=>h.id===input.id))homework.push({...input,created_at:'2026-10-08T09:00:00Z',updated_at:'2026-10-08T09:00:00Z'});if(homeworkAttempts===1){await route.fulfill({status:503,contentType:'application/json',body:'{}'});return}value=[{id:input.id}]}else value=homework;}
 else if(path.endsWith('/classes'))value=[cls];
 else if(path.endsWith('/students'))value=students.filter(s=>s.active);
 else if(path.endsWith('/teacher_class_assignments'))value=[{teacher_id:teacher,class_id:cls.id}];
 else if(path.endsWith('/platform_settings'))value={school:'مدارس غراس الأخلاق الأهلية',term:'الفصل الأول',year:1448,term_start_date:'2026-08-23'};
 else if(path.endsWith('/account_preferences')||path.endsWith('/platform_presentation'))value=null;
 else if(path.endsWith('/evaluations')&&request.method()==='POST'){const input=request.postDataJSON();const previous=evaluationRows.find(e=>e.client_key===input.client_key);evaluation={...(previous||{}),...input,id:previous?.id||'44444444-4444-4444-8444-444444444444'};if(previous)Object.assign(previous,evaluation);else evaluationRows.push(evaluation);updates++;if(failNext){failNext=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Simulated lost response'})});return}value={id:evaluation.id};}
 else if(path.endsWith('/auth/v1/user'))value={id:teacher,email:'test@login.gheras.local'};
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
});
await page.addInitScript(({teacher})=>{const encode=v=>btoa(JSON.stringify(v));const jwt=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:teacher,exp:Math.floor(Date.now()/1000)+3600})+'.test';localStorage.setItem('sb-movfuflqgztlctdpbrbl-auth-token',JSON.stringify({access_token:jwt,refresh_token:'test-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:{id:teacher,email:'test@login.gheras.local',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}}));},{teacher});
try{
 await page.clock.setFixedTime(new Date('2026-10-08T09:00:00Z'));
 await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('button',{name:'إنجاز طالب متأخر',exact:true}).click();
 const panel=page.locator('.checkpoint-homework');
 await panel.getByText('حفظ سورة الملك • من الآية 16 إلى الآية 20',{exact:true}).waitFor();
 await panel.getByLabel('عدد آيات الواجب التالي').selectOption('1');await panel.getByText('حفظ سورة الملك • من الآية 16 إلى الآية 16',{exact:true}).waitFor();
 await panel.getByLabel('عدد آيات الواجب التالي').selectOption('5');await panel.getByLabel('موعد واجب الطالب الفردي').fill('2026-10-09');
 await panel.getByRole('button',{name:'إرسال الواجب الفردي وطلب تسجيل صوتي',exact:true}).click();
 await panel.getByRole('alert').waitFor();
 await panel.getByRole('button',{name:'إرسال الواجب الفردي وطلب تسجيل صوتي',exact:true}).click();
 await panel.getByRole('button',{name:'✓ تم إرسال هذا الواجب',exact:true}).waitFor();assert.equal(homework.length,1);assert.equal(homeworkAttempts,2);
 assert.equal(homework[0].student_id,'test-student');assert.equal(homework[0].class_id,'test-class');assert.equal(homework[0].due_date,'2026-10-09');assert.ok(homework[0].instructions.includes('تسجيل صوتي'));
 family=true;await page.reload();await page.getByRole('button',{name:'الواجبات',exact:true}).click();
 await page.getByRole('button',{name:'إرسال التسجيل الصوتي لهذا الواجب',exact:true}).click();
 await page.getByLabel('واجب المعلم').waitFor();assert.equal(await page.getByLabel('واجب المعلم').inputValue(),homework[0].id);
 assert.equal(await page.getByLabel('من الآية',{exact:true}).inputValue(),'16');assert.equal(await page.getByLabel('إلى الآية',{exact:true}).inputValue(),'20');assert.equal(await page.getByLabel('من الآية',{exact:true}).isEnabled(),false);assert.equal(sends,0);
 console.log('Checkpoint homework: correct next range, private child, stable retry and parent audio form passed');
}finally{await browser.close()}
