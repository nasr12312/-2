import test from 'node:test';import assert from 'node:assert/strict';
import {familyFollowupRows} from '../src/utils/family-followup.mjs';
test('family followup distinguishes complete, partial, pending and no requirement without counting outdated confirmations',()=>{
 const students=[1,2,3,4].map(id=>({id,remoteId:'s'+id,classId:id}));
 const classes=students.map(s=>({id:s.classId,remoteId:'c'+s.classId}));
 const time='2026-10-08T08:00:00Z',old='2026-10-07T08:00:00Z';
 const evaluations=[1,2,3,99].map(id=>({id:'e'+id,studentId:id,createdAt:time}));
 const followups=[{evaluation_id:'e1',evaluation_version:time,followed_at:time},{evaluation_id:'e2',evaluation_version:time,followed_at:time},{evaluation_id:'e3',evaluation_version:old,followed_at:old}];
 const homework=[{id:'h2',class_id:'c2',student_id:null,due_date:'2026-10-08',updated_at:time},{id:'cancelled',class_id:'c4',due_date:'2026-10-08',cancelled:true}];
 const rows=familyFollowupRows(students,evaluations,followups,homework,[{homework_id:'h2',student_id:'s2',homework_version:old,followed_at:old}],classes,{from:'2026-10-08',to:'2026-10-08'});
 assert.deepEqual(rows.map(r=>r.status),['complete','partial','pending','none']);assert.equal(rows[1].pending,1);assert.equal(rows[2].last,'');assert.equal(rows.length,4);
 assert.equal(familyFollowupRows(students,evaluations,followups,homework,[],classes,{from:'2026-10-09',to:'2026-10-09'})[0].status,'none');
});
