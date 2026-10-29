import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
const classroom={id:1,remoteId:'own',program:'bilingual',stage:'ابتدائي',grade:'خامس',name:'الخامس أ'};
const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
const plans=days.map((day,i)=>({id:'p'+i,program:'bilingual',stage:'ابتدائي',grade:'خامس',week:10,day,track:'حفظ',text:i===0?'سورة الصف • الآيات 8–10':i===1?'سورة الصف • الآيات 11–12':i===2?'سورة الصف • الآيات 13–14':'سورة الصف • مراجعة وتقييم السورة'}));
const evaluations=[{day:0,grade:'غائب اليوم'},{day:1,grade:'جيد',notes:'متابعة الخطة: متأخر عن الخطة\nالمقرر الفعلي: سورة الجمعة • من الآية 6 إلى الآية 7\nيحتاج إلى تثبيت الآيات.'},{day:2,grade:'لم يسمّع'},{day:4,grade:'لم يسمّع'}].map((e,i)=>({id:'e'+i,studentId:1,weekId:10,track:'الحفظ',scores:[],notes:'',createdAt:'2026-10-29T07:00:00Z',...e}));
const [report]=weeklyStudentReports([{id:1,name:'طالب تجريبي',academicId:'9000000000',classId:1,program:'bilingual'}],evaluations,{date:'2026-10-29',termStartDate:'2026-08-23',classes:[classroom],plans,school:'مدرسة تجريبية',logo:'',teacher:'معلم تجريبي'});
fs.writeFileSync('../required-lessons-preview.html',report.content);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1200,height:1000}});await page.route('https://gherasquran.com/gheras-logo.png',route=>route.fulfill({contentType:'image/png',body:fs.readFileSync('public/gheras-logo.png')}));await page.setContent(report.content,{waitUntil:'domcontentloaded'});
const rows=page.locator('tbody tr');await expect(rows).toHaveCount(5);
for(const day of [0,2,3,4])await expect(rows.nth(day).locator('td').nth(2)).toBeEmpty();
for(let day=0;day<5;day++)await expect(rows.nth(day).locator('td').nth(1)).toContainText('سورة الصف');
await expect(rows.nth(0).locator('td').nth(3)).toContainText('غائب');await expect(rows.nth(1).locator('td').nth(2)).toContainText('سورة الجمعة');await expect(rows.nth(1).locator('td').nth(3)).toContainText('يحتاج إلى تثبيت الآيات');await expect(rows.nth(3).locator('td').nth(3)).toContainText('لا يوجد تقييم محفوظ');
await page.screenshot({path:'../required-lessons-preview.png',fullPage:true});console.log(JSON.stringify({passed:true,schoolDays:5,requiredLessonsVisible:true,unheardReachedCellsEmpty:true,notesVisible:true}));}finally{await browser.close();}
