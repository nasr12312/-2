import test from 'node:test';
import assert from 'node:assert/strict';
import {reportHtmlFile,shareReportFile} from '../src/utils/report-file-share.mjs';
import {fixedGuardianReportMessage} from '../src/utils/guardian-contact.mjs';

test('HTML attachment retains complete Arabic report, names the child, uses UTF-8 and disables active content',async()=>{
 const html='<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><article><h2>طالب تجريبي</h2><p>المنافقون ١–٦ ولم يكمل السورة</p></article></html>';
 const file=reportHtmlFile(html,'طالب / تجريبي','2026-10-22');
 assert.equal(file.name,'تقرير طالب   تجريبي 2026-10-22.html');assert.equal(file.type,'text/html');
 const source=await file.text();assert.ok(source.startsWith('<!doctype html>'));assert.ok(source.includes('المنافقون ١–٦ ولم يكمل السورة'));assert.ok(source.indexOf("script-src 'none'")<source.indexOf('<article>'));assert.ok(!file.name.includes('/'));
});

test('HTML attachment message describes the actual format without a login, URL or claim of delivery',()=>{
 const message=fixedGuardianReportMessage({student:'طالب تجريبي',school:'مدرسة تجريبية',teacher:'معلم تجريبي',title:'تقرير المتابعة',generatedAt:'2026-10-22T12:00:00Z',sentAt:'2026-10-22T12:00:00Z',attachment:true,attachmentFormat:'HTML'});
 assert.ok(message.includes('بصيغة HTML'));assert.ok(message.includes('طالب تجريبي'));assert.ok(!message.includes('PDF'));assert.ok(!message.includes('https://'));assert.ok(!message.includes('يرجى الدخول'));assert.ok(!message.includes('تم الإرسال'));
});

test('HTML export retains a valid single document and removes the nonfunctional scripted print button',async()=>{
 const source=await reportHtmlFile('<!doctype html><html><head><title>تقرير</title></head><body><button class="print-control" onclick="window.print()">طباعة</button><article>ملاحظات المعلم</article></body></html>','طالب','2026-10-22').text();
 assert.equal((source.match(/<html\b/g)||[]).length,1);assert.ok(!source.includes('onclick'));assert.ok(source.indexOf('Content-Security-Policy')<source.indexOf('<title>'));assert.ok(source.includes('ملاحظات المعلم'));
});

test('native share receives only the selected child file and matching message synchronously before yielding',async()=>{
 const file=reportHtmlFile('<article>تقرير طالب واحد</article>','طالب واحد','2026-10-22');let complete;const calls=[];
 const platform={canShare(data){calls.push('canShare');assert.equal(data.files.length,1);return true},share(data){calls.push('share');assert.deepEqual(data.files,[file]);assert.equal(data.text,'رسالة طالب واحد');return new Promise(resolve=>{complete=resolve})}};
 const result=shareReportFile(file,'رسالة طالب واحد',platform);assert.deepEqual(calls,['canShare','share']);complete();assert.equal(await result,'shared');
});

test('unsupported, denied and cancelled file shares never claim success or retry sending',async()=>{
 const file=reportHtmlFile('تقرير','طالب','2026-10-22');let count=0;
 assert.equal(await shareReportFile(file,'',{}),'unsupported');
 assert.equal(await shareReportFile(file,'',{canShare:()=>false,share:()=>{count++}}),'unsupported');assert.equal(count,0);
 for(const [name,expected] of [['AbortError','cancelled'],['NotAllowedError','failed'],['DataError','failed']]){
  assert.equal(await shareReportFile(file,'',{canShare:()=>true,share:async()=>{count++;throw Object.assign(Error(),{name})}}),expected);
 }
 assert.equal(count,3);
});
