import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const qaRoot=path.resolve('../report-sync-qa-dist');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1400,height:1100},locale:'ar-SA'});
let grade='غائب اليوم',offline=false,reads=0,writes=0;
const uid='11111111-1111-4111-8111-111111111111';const user={id:uid,email:'test@login.gheras.local',role:'authenticated',app_metadata:{},user_metadata:{}};
await context.route('https://mock.supabase.co/**',async route=>{
 const request=route.request(),url=new URL(request.url()),name=url.pathname.split('/').at(-1);let data=[];
 if(url.pathname.includes('/auth/v1/token'))data={access_token:'mock-session-token',refresh_token:'mock-refresh',expires_in:3600,token_type:'bearer',user};
 else if(url.pathname.includes('/auth/v1/user'))data=user;
 else if(name==='profiles')data={user_id:uid,full_name:'معلم تجريبي',role:'teacher',active:true,setup_complete:true};
 else if(name==='classes')data=[{id:'class',name:'الخامس',program_id:'bilingual',stage:'ابتدائي',grade:'خامس',section:'أ'}];
 else if(name==='teacher_class_assignments')data=[{teacher_id:uid,class_id:'class'}];
 else if(name==='students')data=[{id:'target',full_name:'الطالب المقصود',national_id:'9000000000',program_id:'bilingual',class_id:'class',account_status:'active',active:true}];
 else if(name==='evaluations'&&request.method()!=='GET'){writes++;data=[];}
 else if(name==='visible_evaluations'){
  reads++;if(offline){await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'mock offline'})});return;}
  data=[{id:'evaluation',client_key:'target|10|2|الحفظ',student_id:'target',grade,score:grade==='غائب اليوم'?null:5,scores:grade==='غائب اليوم'?[]:[5],notes:'متابعة الخطة: تسميع اليوم\nالمقرر الفعلي: سورة النبأ • من الآية 1 إلى الآية 8',teacher_id:uid,evaluated_at:'2026-10-29T05:00:00Z',plan_entry_id:'plan'}];
 }
 else if(name==='my_quran_plan')data=[{id:'plan',program_id:'bilingual',stage:'ابتدائي',grade:'خامس',week_label:'10',day_name:'الثلاثاء',assignment_type:'حفظ',assignment_text:'سورة النبأ 1–10',sort_order:1}];
 else if(name==='platform_settings')data={school:'مدرسة تجريبية',term:'الفصل الأول',year:'1448',term_start_date:'2026-08-23'};
 else if(name==='platform_presentation')data={welcome_enabled:false};
 else if(name==='account_preferences'||name==='student_report_drafts'||name==='teacher_contact_settings'||name==='student_guardian_contacts')data=null;
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
});
await context.route('http://report-sync.test/**',async route=>{const url=new URL(route.request().url());const file=path.join(qaRoot,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1));const ext=path.extname(file);await route.fulfill({status:200,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.woff2':'font/woff2'})[ext]||'application/octet-stream',body:fs.readFileSync(file)});});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://report-sync.test/');
 await page.getByLabel('رقم الدخول',{exact:true}).fill('9000000000');
 await page.getByRole('button',{name:'دخول',exact:true}).click();
 await page.locator('.sidebar').getByRole('button',{name:'التقارير',exact:true}).waitFor({timeout:30000});
 grade='متفوق';await page.locator('.sidebar').getByRole('button',{name:'التقارير',exact:true}).click();
 await expect(page.getByRole('button',{name:'مزامنة بيانات التقارير',exact:true})).toBeEnabled({timeout:30000});
 await page.getByLabel('طالب التقرير القابل للتعديل',{exact:true}).selectOption('target');
 const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
 await expect(modal.getByRole('button',{name:'مزامنة بيانات التقرير',exact:true})).toBeEnabled({timeout:30000});
 const frame=modal.frameLocator('iframe[title="معاينة تقرير الطالب"]');await expect(frame.locator('body')).toContainText('متفوق');await expect(frame.locator('body')).not.toContainText('غائب');
 grade='جيد';await modal.getByRole('button',{name:'مزامنة بيانات التقرير',exact:true}).click();await expect(frame.locator('body')).toContainText('جيد');await expect(frame.locator('body')).not.toContainText('متفوق');
 const downloadWait=page.waitForEvent('download');await modal.getByRole('button',{name:'تنزيل HTML',exact:true}).click();const download=await downloadWait;const content=fs.readFileSync(await download.path(),'utf8');if(!content.includes('جيد')||content.includes('غائب'))throw Error('download did not use fresh grade');
 await page.screenshot({path:'../report-sync-preview.png',fullPage:true});
 offline=true;await modal.getByRole('button',{name:'مزامنة بيانات التقرير',exact:true}).click();await expect(modal.getByRole('button',{name:'طباعة / حفظ PDF',exact:true})).toBeDisabled();await expect(modal).toContainText('تعذرت مزامنة بيانات التقارير');
 offline=false;await page.reload();await page.locator('.sidebar').getByRole('button',{name:'التقييم اليومي',exact:true}).waitFor({timeout:30000});await page.locator('.sidebar').getByRole('button',{name:'التقييم اليومي',exact:true}).click();await page.getByRole('button',{name:'الثلاثاء',exact:true}).click();await page.getByRole('button',{name:'لم يسمّع • كل الشعبة',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'تأكيد حفظ الحالة لغير المسجلين',exact:true}).click();await expect(page.getByText('كل الطلاب لديهم متابعة محفوظة؛ لم يُستبدل أي سجل.',{exact:true})).toBeVisible({timeout:30000});if(writes!==0)throw Error('Bulk status attempted to overwrite a saved grade');
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({passed:true,serverEvaluationReads:reads,downloadUsesLatestGrade:true,offlineExportBlocked:true,bulkDoesNotOverwriteSavedGrades:true}));
}catch(error){console.log((await page.locator('body').innerText()).slice(-5000));await page.screenshot({path:'../report-sync-ui-failure.png',fullPage:true});throw error;}finally{await browser.close();}
