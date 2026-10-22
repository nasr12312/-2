import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluationClientKey,uniqueDailyEvaluations} from '../src/utils/evaluation-slot.mjs';
import {studentFollowupHistory} from '../src/utils/student-followup.mjs';
const row={id:'grade',studentId:1,weekId:8,day:1,track:'الحفظ',grade:'جيد',createdAt:'2026-10-12T08:00:00Z'};
test('all editors share the same lesson key, while tracks and days remain separate',()=>{
 for(const suffix of ['', ' · حالة يومية', ' · إنجاز فردي uuid'])assert.equal(evaluationClientKey('student',8,1,'الحفظ'+suffix),'student|8|1|الحفظ');
 assert.notEqual(evaluationClientKey('student',8,1,'الحفظ'),evaluationClientKey('student',8,1,'المراجعة'));
 assert.notEqual(evaluationClientKey('student',8,1,'الحفظ'),evaluationClientKey('student',8,2,'الحفظ'));
});
test('legacy duplicates and confirmed local edits show one latest daily row in either input order',()=>{
 const status={...row,id:'status',track:'الحفظ · حالة يومية',grade:'غائب اليوم',createdAt:'2026-10-12T09:00:00Z'},correction={...row,grade:'متفوق',createdAt:'2026-10-12T10:00:00Z'};
 for(const rows of [[row,status,correction],[correction,status,row]])assert.deepEqual(uniqueDailyEvaluations(rows),[correction]);
 const rows=[row,status,correction,{...row,id:'revision',track:'المراجعة'},{...row,id:'next',day:2},{...row,id:'other',studentId:2}];
 assert.equal(uniqueDailyEvaluations(rows).length,4);
 const history=studentFollowupHistory(rows,1,e=>'day-'+e.day);assert.equal(history.length,3);assert.equal(history.find(e=>e.track==='الحفظ'&&e.day===1).grade,'متفوق');
});
