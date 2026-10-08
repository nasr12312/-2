import test from 'node:test';import assert from 'node:assert/strict';import {parseStudentBatch,studentBatchConflict} from '../src/utils/bulk-students.mjs';
test('CSV and pasted Excel preserve leading zeros, support Arabic digits, and flag duplicate or invalid IDs',()=>{
 const rows=parseStudentBatch('الاسم\tالرقم\nطالب أول\t٠١٢٣٤٥٦٧٨٩\nطالب ثان\t0123456789\nطالب ثالث\t\nطالب ثالث\t\nطالب رابع\t1e9');
 assert.equal(rows[0].number,'0123456789');assert.equal(rows[0].error,'');assert.match(rows[1].error,/مكرر/);assert.equal(rows[2].error,'');assert.match(rows[3].error,/مكرر/);assert.match(rows[4].error,/10/);
 assert.equal(parseStudentBatch('"طالب، أول",9000000000')[0].name,'طالب، أول');assert.throws(()=>parseStudentBatch('"اسم,123'));assert.throws(()=>parseStudentBatch(''));
});
test('existing same-program registrations and repeated temporary-name entries require transfer rather than duplication',()=>{
 const students=[{full_name:'طالب أول',national_id:'9000000000',program_id:'diploma',class_id:'a'}],classroom={id:'a',program_id:'diploma'};
 assert.ok(studentBatchConflict({name:'طالب أول',number:'9000000000'},students,classroom));assert.ok(studentBatchConflict({name:'طالب أول',number:''},students,classroom));assert.equal(studentBatchConflict({name:'طالب أول',number:'9000000000'},students,{id:'b',program_id:'bilingual'}),'');
});
