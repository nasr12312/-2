import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';
import {weeklyStudentReports} from './src/utils/weekly-student-reports.mjs';
const logo='data:image/jpeg;base64,'+fs.readFileSync('public/gheras-logo.png').toString('base64');
const evaluations=Array.from({length:5},(_,day)=>({studentId:1,weekId:7,day,planEntryId:'p'+day,track:day===3?'المراجعة':'الحفظ',grade:day===2?'جيد جدًا':'متفوق',scores:[day===2?4:5],notes:'متابعة الخطة: تسميع اليوم\nالمقرر الفعلي: سورة الملك: الآيات '+(day*3+1)+'–'+(day*3+3)+'\n'+(day===2?'يحتاج إلى تثبيت الآيات.':''),nextStep:day===4?'مراجعة الآيات المقررة.':'',createdAt:'2026-10-08T09:00:00Z'}));
const report=weeklyStudentReports([{id:1,name:'طالب تجريبي',academicId:'1000000000',classId:1}],evaluations,{date:'2026-10-08',termStartDate:'2026-08-23',school:'مدارس غراس الأخلاق',logo,teacher:'معلم القرآن الكريم',classes:[{id:1,remoteId:'class1',name:'الصف الخامس / أ'}],plans:Array.from({length:5},(_,day)=>({id:'p'+day,classId:'class1',text:'سورة الملك: الآيات '+(day*3+1)+'–'+(day*3+5)}))})[0];
fs.mkdirSync('/tmp/report-preview',{recursive:true});
fs.writeFileSync('preview-report.html',report.content);
const server=spawn('pnpm',['exec','vite','--host','127.0.0.1','--port','4173'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<40;i++){try{await fetch('http://127.0.0.1:4173/preview-report.html');break}catch{await new Promise(r=>setTimeout(r,250))}}
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:850,height:1123}});
 await page.goto('http://127.0.0.1:4173/preview-report.html');
 await page.locator('img').evaluate(img=>img.decode());
 await page.screenshot({path:'/tmp/report-preview/report.png',fullPage:true});
 await page.pdf({path:'/tmp/report-preview/print.pdf',preferCSSPageSize:true,printBackground:true});
 const bytes=await page.evaluate(async html=>{const {studentReportPdf}=await import('/src/utils/student-report-pdf.ts');const file=await studentReportPdf(html,'طالب تجريبي','2026-10-08');return Array.from(new Uint8Array(await file.arrayBuffer()))},report.content);
 const pdf=Buffer.from(bytes);fs.writeFileSync('/tmp/report-preview/shared.pdf',pdf);
 const pages=(pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length;
 if(pages!==1)throw Error('Expected a one-page weekly attachment, got '+pages);
 const size=await page.locator('article').evaluate(el=>({width:el.clientWidth,height:el.clientHeight,scrollWidth:el.scrollWidth}));
 if(size.scrollWidth>size.width)throw Error('Report overflows its page');
 console.log('Report screenshot and one-page print/shared PDFs verified',size);
}finally{await browser?.close();server.kill();}
