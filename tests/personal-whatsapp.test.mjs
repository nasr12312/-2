import test from 'node:test';
import assert from 'node:assert/strict';
import {personalWhatsAppUrl,createWhatsAppLauncher} from '../src/utils/personal-whatsapp.mjs';
test('personal WhatsApp reuses one signed-in window across students and opens a new window only after closing it',()=>{
 const windows=[];const launcher=createWhatsAppLauncher((url,target)=>{const w={location:{href:url},closed:false,opener:{},focus(){this.focused=true}};windows.push({w,target});return w});
 assert.equal(launcher.open(personalWhatsAppUrl()),true);assert.equal(windows.length,1);assert.equal(windows[0].w.opener,null);
 const first=personalWhatsAppUrl('0501234567','تقرير أحمد & تاريخ');assert.equal(launcher.open(first),true);assert.equal(windows.length,1);assert.equal(windows[0].w.location.href,first);
 const second=personalWhatsAppUrl('0507654321','تقرير طالب آخر');assert.equal(launcher.open(second),true);assert.equal(windows.length,1);assert.equal(windows[0].w.location.href,second);
 windows[0].w.closed=true;assert.equal(launcher.open(first),true);assert.equal(windows.length,2);
 assert.equal(launcher.open('https://example.com/'),false);assert.equal(windows.length,2);
});
test('WhatsApp keeps phone and Arabic message intact, routes mobile safely, and reports a blocked popup',()=>{
 assert.equal(personalWhatsAppUrl('bad','text'),'');const url=new URL(personalWhatsAppUrl('0501234567','اسم الطالب + التاريخ & التقرير'));assert.equal(url.hostname,'web.whatsapp.com');assert.equal(url.searchParams.get('phone'),'966501234567');assert.equal(url.searchParams.get('text'),'اسم الطالب + التاريخ & التقرير');assert.equal(new URL(personalWhatsAppUrl('0501234567','نص',true)).hostname,'wa.me');assert.equal(createWhatsAppLauncher(()=>null).open(personalWhatsAppUrl()),false);
});
