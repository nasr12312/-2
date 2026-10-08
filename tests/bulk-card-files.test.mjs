import test from 'node:test';import assert from 'node:assert/strict';import {loginCardFiles} from '../src/utils/login-card-files.mjs';import {reportZip} from '../src/utils/report-zip.mjs';
test('separate cards isolate each login, merge both programs, mark temporary numbers and avoid filename collisions',()=>{
 const rows=[{name:'طالب واحد',number:'9000000000',className:'ثنائي خامس',temporary:true},{name:'طالب واحد',number:'9000000000',className:'دبلومة خامس',temporary:true},{name:'طالب واحد',number:'9000000001',className:'ثنائي رابع'}];
 const files=loginCardFiles(rows,'مدرسة غراس','');assert.equal(files.length,2);assert.notEqual(files[0].name,files[1].name);assert.ok(files[0].content.includes('دبلومة خامس'));assert.ok(files[0].content.includes('مؤقت'));assert.ok(!files[0].content.includes('9000000001'));assert.ok(!files[1].content.includes('9000000000'));assert.ok(reportZip(files).length>100);assert.throws(()=>loginCardFiles([{...rows[0],number:''}],'غراس',''));
});
