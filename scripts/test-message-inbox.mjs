// Isolated UI checks: every Supabase request is mocked, including all sends.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const teacher='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',parent='33333333-3333-4333-8333-333333333333';
const cls={id:'test-class',name:'اول - أ',program_id:'bilingual',stage:'ابتدائي',grade:'اول',section:'أ',active:true};
const students=['الأول','الثاني'].map((n,i)=>({id:'student-'+i,full_name:'طالب الاختبار '+n,national_id:'100000000'+i,class_id:cls.id,program_id:'bilingual',active:true,account_status:'active'}));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{for(const family of [false,true]){
 const uid=family?parent:teacher,page=await browser.newPage({viewport:{width:1440,height:1000}}),sent=[];
 const messages=[{id:'m1',student_id:'student-0',teacher_id:teacher,sender_id:family?teacher:parent,sender_name:family?'المعلم الأول':'ولي الاختبار الأول',kind:'رسالة',body:'رسالة المحادثة الأولى',created_at:'2026-10-08T08:00:00Z',was_read:true},{id:'m2',student_id:'student-1',teacher_id:family?other:teacher,sender_id:family?other:parent,sender_name:family?'المعلم الثاني':'ولي الاختبار الثاني',kind:'استفسار',body:'رسالة جديدة تحتاج الرد',created_at:'2026-10-08T09:00:00Z',was_read:false}];
 await page.route('**/*.supabase.co/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let value=[];
  if(path.endsWith('/rpc/school_conversations'))value={messages,teachers:messages.map(m=>({student_id:m.student_id,teacher_id:m.teacher_id,teacher_name:m.teacher_id===other?'المعلم الثاني':'المعلم الأول'}))};
  else if(path.endsWith('/school_private_messages')&&req.method()==='POST'){const input=req.postDataJSON();sent.push(input);messages.push({...input,id:'reply-'+sent.length,sender_name:'حساب الاختبار',created_at:'2026-10-08T10:00:00Z',was_read:false});}
  else if(path.endsWith('/profiles'))value={user_id:uid,full_name:'حساب الاختبار',role:family?'family':'teacher',active:true,setup_complete:true};
  else if(path.endsWith('/classes'))value=[cls];
  else if(path.endsWith('/students'))value=students;
  else if(path.endsWith('/family_students'))value=students.map(s=>({user_id:uid,student_id:s.id,students:s}));
  else if(path.endsWith('/teacher_class_assignments'))value=[{teacher_id:teacher,class_id:cls.id}];
  else if(path.endsWith('/platform_settings'))value={school:'غراس',year:1448,term_start_date:'2026-08-23'};
  else if(path.endsWith('/account_preferences')||path.endsWith('/platform_presentation'))value=null;
  else if(path.endsWith('/auth/v1/user'))value={id:uid,email:'test@login.gheras.local'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.addInitScript(({uid})=>{const encode=v=>btoa(JSON.stringify(v)),jwt=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:uid,exp:Math.floor(Date.now()/1000)+3600})+'.test';localStorage.setItem('sb-movfuflqgztlctdpbrbl-auth-token',JSON.stringify({access_token:jwt,refresh_token:'test-only',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:{id:uid,email:'test@login.gheras.local',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}}));},{uid});
 await page.goto('http://127.0.0.1:5174/');
 await page.getByRole('button',{name:'التواصل الخاص',exact:true}).click({timeout:25000});
 await page.locator('.conversation-card').first().waitFor();assert.equal(await page.locator('.conversation-card').count(),2);
 assert.equal(await page.getByLabel('الطالب والبرنامج').inputValue(),'student-1');
 const sender=family?'المعلم الثاني':'ولي الاختبار الثاني';
 await page.getByRole('button',{name:'الرد على '+sender,exact:true}).click();
 await page.getByLabel('نص الرسالة',{exact:true}).fill('رد اختبار معزول');
 await page.getByRole('button',{name:'إرسال الرد',exact:true}).click();
 await page.getByText('تم إرسال الرسالة الخاصة وإشعار المستلم',{exact:true}).waitFor();
 assert.equal(sent.length,1);assert.equal(sent[0].student_id,'student-1');assert.equal(sent[0].teacher_id,family?other:teacher);assert.equal(sent[0].sender_id,uid);
 await page.getByLabel('البحث في الرسائل والمرسل والطالب').fill(family?'المعلم الأول':'ولي الاختبار الأول');assert.equal(await page.locator('.conversation-card').count(),1);
 await page.locator('.conversation-card').click();assert.equal(await page.getByLabel('الطالب والبرنامج').inputValue(),'student-0');
 await page.close();console.log((family?'Family':'Teacher')+': inbox, sender, correct reply destination and search passed');
}}finally{await browser.close()}
