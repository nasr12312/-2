import test from 'node:test';import assert from 'node:assert/strict';
import {checkpointHomework,homeworkRange} from '../src/utils/checkpoint-homework.mjs';
const surahs=[{id:67,name:'الملك',ayahs:30},{id:112,name:'الإخلاص',ayahs:4}];
test('individual homework starts after verified checkpoint and clamps at the surah boundary',()=>{
 const draft=checkpointHomework({surahId:67,ayah:15},surahs,5);assert.equal(draft.from,16);assert.equal(draft.to,20);assert.equal(draft.kind,'حفظ');assert.match(draft.instructions,/تسجيل صوتي/);assert.match(draft.instructions,/متأخر/);assert.deepEqual(homeworkRange(draft.title,surahs),{surahId:67,from:16,to:20,track:'الحفظ'});
 assert.equal(checkpointHomework({surahId:67,ayah:29},surahs,5).to,30);
 assert.equal(homeworkRange('حفظ سورة الملك • من الآية 30 إلى الآية 31',surahs),null);
});
test('completed surah becomes review without guessing another surah or fabricating missing progress',()=>{
 const draft=checkpointHomework({surahId:112,ayah:4},surahs);assert.equal(draft.kind,'مراجعة');assert.equal(draft.from,1);assert.equal(draft.to,4);
 for(const p of [null,{surahId:67,ayah:0},{surahId:67,ayah:31},{surahId:67,ayah:1.5}])assert.equal(checkpointHomework(p,surahs),null);
 assert.equal(checkpointHomework({surahId:67,ayah:10},surahs,0),null);
});
