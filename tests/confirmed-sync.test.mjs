import test from 'node:test';import assert from 'node:assert/strict';
import {createConfirmedSync,mergeConfirmedChanges,syncErrorMessage,sameRemoteEvaluation,recordingEvaluationSlot} from '../src/utils/confirmed-sync.mjs';
test('no optimistic success and retries retain the identical job after partial remote success',async()=>{
 const rows=new Map(),commits=[],errors=[];let calls=0;const job={key:'stable-recording-id',grade:'متفوق'};
 const sync=createConfirmedSync({persist:async value=>{rows.set(value.key,value);if(++calls===1)throw Error('lost response')},commit:value=>commits.push(value),onFailure:e=>errors.push(e)});
 assert.equal(await sync.submit(job),false);assert.equal(commits.length,0);assert.equal(sync.hasPending(),true);
 assert.equal(await sync.submit({key:'another'}),false);assert.equal(rows.size,1);
 assert.equal(await sync.retry(),true);assert.equal(rows.size,1);assert.equal(commits[0],job);assert.equal(sync.hasPending(),false);assert.equal(await sync.retry(),false);
});
test('double clicks cannot duplicate a write and clearing a session prevents a late local commit',async()=>{
 let finish;let writes=0,commits=0;const sync=createConfirmedSync({persist:()=>{writes++;return new Promise(resolve=>finish=resolve)},commit:()=>commits++,onFailure:()=>{}});
 const pending=sync.submit({key:'a'});assert.equal(await sync.retry(),false);assert.equal(await sync.submit({key:'b'}),false);assert.equal(commits,0);sync.clear();finish();assert.equal(await pending,false);assert.equal(writes,1);assert.equal(commits,0);
});
test('confirmed retry merges changed records without replacing newer results on another page',()=>{
 const before={evaluations:{old:{grade:'جيد'}},recitations:[{id:'a',status:'pending'}],notifications:[],settings:{school:'غراس'}};
 const after=structuredClone(before);after.evaluations.recording={grade:'متفوق'};after.recitations[0].status='reviewed';after.notifications.push({id:'local'});
 const current=structuredClone(before);current.evaluations.newer={grade:'جيد جدًا'};current.settings.school='اسم محدث';current.notifications.push({id:'server'});
 const result=mergeConfirmedChanges(current,before,after);assert.equal(result.evaluations.newer.grade,'جيد جدًا');assert.equal(result.evaluations.recording.grade,'متفوق');assert.equal(result.recitations[0].status,'reviewed');assert.equal(result.settings.school,'اسم محدث');assert.equal(result.notifications.length,2);
});
test('write errors are actionable and never expose raw server details',()=>{assert.match(syncErrorMessage({code:'42501',message:'private SQL'}),/صلاحية/);assert.match(syncErrorMessage({code:'23514'}),/درجة/);assert.match(syncErrorMessage({code:'PGRST301'}),/جلسة/);assert.ok(!syncErrorMessage({message:'private SQL'}).includes('private SQL'))});
test('lost-response retry recognizes saved versions without resending a parent notification',()=>{const payload={client_key:'stable',grade:'جيد',scores:[3],evaluated_at:'2026-10-16T09:00:00.000Z'};assert.equal(sameRemoteEvaluation({...payload,id:'server-id',evaluated_at:'2026-10-16T09:00:00+00:00'},payload),true);assert.equal(sameRemoteEvaluation({...payload,grade:'متفوق'},payload),false);assert.equal(sameRemoteEvaluation({...payload,evaluated_at:'2026-10-16T09:00:01Z'},payload),false);assert.equal(sameRemoteEvaluation(undefined,payload),false)});
test('a recording from an old plan is graded in the current week, and a later retry retains its first slot',()=>{const submission={id:'recording',studentId:1,track:'الحفظ',weekId:1};const slot=recordingEvaluationSlot(submission,[],'2026-08-23','2026-10-12T09:00:00Z');assert.equal(slot.weekId,8);assert.equal(slot.day,1);assert.deepEqual(recordingEvaluationSlot(submission,[{studentId:1,...slot,track:'الحفظ · إنجاز فردي تسجيل-recording'}],'2026-08-23','2026-10-16T09:00:00Z'),slot);assert.equal(recordingEvaluationSlot({...submission,id:'other'},[],'2026-08-23','2026-10-12').track,slot.track);assert.deepEqual(recordingEvaluationSlot({...submission,evaluatedAt:'2026-10-12T09:00:00Z'},[],'2026-08-23','2026-10-16T09:00:00Z'),slot)});
