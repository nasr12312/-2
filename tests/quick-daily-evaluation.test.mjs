import test from 'node:test';import assert from 'node:assert/strict';import {quickDailyIndex} from '../src/utils/quick-daily-evaluation.mjs';
const make=(id,studentId,track,grade,createdAt,extra={})=>({id,studentId,track,grade,createdAt,weekId:8,day:2,notes:'',...extra});
test('quick daily list shows latest absence or no-recitation state while retaining the grade for a later correction',()=>{
 const grade=make('g',1,'الحفظ','جيد','2026-10-21T08:00:00Z'),absent=make('s',1,'الحفظ · حالة يومية','غائب اليوم','2026-10-21T09:00:00Z');const records=[grade,absent,make('other',2,'الحفظ','متفوق','2026-10-21T09:00:00Z')];const a=quickDailyIndex(records,{week:8,day:2,track:'الحفظ'});assert.equal(a.latest.get(1).grade,'غائب اليوم');assert.equal(a.graded.get(1).id,'g');assert.equal(records.length,3);
 const b=quickDailyIndex([...records,{...grade,grade:'متفوق',createdAt:'2026-10-21T10:00:00Z'}],{week:8,day:2,track:'الحفظ'});assert.equal(b.latest.get(1).grade,'متفوق');assert.equal(b.graded.get(1).id,'g');
});
test('day indexes isolate students, weeks and tracks, and an older local response cannot hide a newer remote correction',()=>{
 const old=make('g',1,'الحفظ','جيد','2026-10-21T08:00:00Z'),fresh={...old,grade:'متفوق',createdAt:'2026-10-21T10:00:00Z'};const rows=[fresh,old,make('d',1,'الحفظ','يحتاج متابعة','2026-10-21T11:00:00Z',{day:1}),make('r',1,'المراجعة','يحتاج متابعة','2026-10-21T12:00:00Z'),make('w',1,'الحفظ','جيد','2026-10-21T12:00:00Z',{weekId:9})];const a=quickDailyIndex(rows,{week:8,day:2,track:'الحفظ'});assert.equal(a.latest.size,1);assert.equal(a.latest.get(1).grade,'متفوق');
});
