// Local browser regression test. All database requests are intercepted.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const teacher='11111111-1111-4111-8111-111111111111';
const cls={id:'test-class',name:'اول - أ',program_id:'bilingual',stage:'ابتدائي',grade:'اول',section:'أ',active:true};
const students=[{id:'test-student',full_name:'طالب اختبار المعاينة',national_id:'1000000001',class_id:cls.id,program_id:'bilingual',active:true,account_status:'active'}];
let evaluation={id:'22222222-2222-4222-8222-222222222222',client_key:'test-student|7|4|الحفظ',student_id:'test-student',plan_entry_id:'test-plan',teacher_id:teacher,teacher_name:'معلم الاختبار',grade:'جيد',score:3,scores:[3,3,3,3,3,3],notes:'ملاحظة سابقة محفوظة',written_feedback:'تقييم كتابي سابق',encouragement:'أحسنت',next_step:'راجع المقرر',evaluated_at:'2026-10-08T08:00:00Z'};
const plan={id:'test-plan',program_id:'bilingual',stage:'ابتدائي',grade:'اول',week_label:'7',day_name:'الخميس',assignment_type:'حفظ',assignment_text:'الفاتحة كاملة'};
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
 else if(path.endsWith('/evaluations')&&request.method()==='POST'){const input=request.postDataJSON();const previous=evaluationRows.find(e=>e.client_key===input.client_key);evaluation={...(previous||{}),...input,id:previous?.id||'44444444-4444-4444-8444-444444444444'};if(previous)Object.assign(previous,evaluation);else evaluationRows.push(evaluation);updates++;if(failNext){failNext=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Simulated lost response'})});return}value={id:evaluation.id};}
 else if(path.endsWith('/auth/v1/user'))value={id:teacher,email:'test@login.gheras.local'};
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
});
await page.addInitScript(({teacher})=>{const encode=v=>btoa(JSON.stringify(v));const jwt=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:teacher,exp:Math.floor(Date.now()/1000)+3600})+'.test';localStorage.setItem('sb-movfuflqgztlctdpbrbl-auth-token',JSON.stringify({access_token:jwt,refresh_token:'test-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:{id:teacher,email:'test@login.gheras.local',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}}));},{teacher});
try{
 await page.clock.setFixedTime(new Date('2026-10-08T09:00:00Z'));
 await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5174/',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('button',{name:'عدة سور أو مقاطع',exact:true}).click();
 await page.getByRole('button',{name:'+ إضافة سورة أو مقطع',exact:true}).click();
 await page.getByLabel('سورة المقطع 1',{exact:true}).selectOption('112');
 await page.getByLabel('توصية المقطع 1',{exact:true}).fill('مواصلة مراجعة الإخلاص');
 await page.getByRole('button',{name:'+ إضافة سورة أو مقطع',exact:true}).click();
 await page.getByLabel('سورة المقطع 2',{exact:true}).selectOption('67');
 await page.getByLabel('من آية المقطع 2',{exact:true}).fill('10');await page.getByLabel('إلى آية المقطع 2',{exact:true}).fill('15');
 await page.getByLabel('توصية المقطع 2',{exact:true}).fill('تثبيت الآيات 10 إلى 15');
 await page.getByRole('checkbox',{name:'الطالب متأخر عن خطة الشعبة',exact:true}).check();
 await page.locator('.grade-choice').nth(2).click();await page.getByRole('button',{name:'حفظ إنجاز الطالب وإشعار ولي الأمر',exact:true}).click();
 await page.getByText('تم الحفظ وإرسال ملخص التقييم لولي الأمر',{exact:true}).waitFor();assert.equal(updates,1);assert.equal(evaluationRows.length,2);
 await page.reload();await page.getByRole('button',{name:'تعديل التقييم المحفوظ',exact:true}).click();
 assert.equal(await page.getByLabel('سورة المقطع 1',{exact:true}).inputValue(),'112');assert.equal(await page.getByLabel('من آية المقطع 2',{exact:true}).inputValue(),'10');assert.equal(await page.getByLabel('توصية المقطع 2',{exact:true}).inputValue(),'تثبيت الآيات 10 إلى 15');
 family=true;await page.reload();const result=page.locator('.result-assignment').filter({hasText:'عدة سور أو مقاطع'});
 await result.waitFor();const text=await result.innerText();for(const word of ['السورة كاملة','الملك','10–15','مواصلة مراجعة الإخلاص','تثبيت الآيات 10 إلى 15','متأخر عن خطة الشعبة'])assert.ok(text.includes(word),word);assert.equal(sends,0);
 console.log('Multi recitation: multiple surahs, partial verses, recommendations, persistence and parent display passed');
}finally{await browser.close()}
