import test from 'node:test';import assert from 'node:assert/strict';
import {flexibleNotes,readFlexibleNotes,normalizeQuranSearch} from '../src/utils/flexible-evaluation.mjs';
import {reachedAssignment,parseReachedAssignment} from '../src/utils/flexible-evaluation.mjs';
test('reached checkpoint rejects invalid verses and does not turn a middle passage into whole-surah progress',()=>{
 const surah={id:112,name:'الإخلاص',ayahs:4};
 for(const value of [0,-1,5,1.5,NaN])assert.equal(reachedAssignment(surah,value),'');
 assert.deepEqual(parseReachedAssignment(reachedAssignment(surah,4),[surah]),{surahId:112,ayah:4});
 assert.deepEqual(parseReachedAssignment('سورة الإخلاص • من الآية 1 إلى الآية 3',[surah]),{surahId:112,ayah:3});
 assert.equal(parseReachedAssignment('سورة الإخلاص • من الآية 2 إلى الآية 4',[surah]),null);
});
test('flexible evaluations retain actual assignment and progress separately from teacher notes',()=>{
 for(const mode of ['late','alternative','ahead','review']){
  const text=flexibleNotes(mode,'سورة الفاتحة • من الآية 1 إلى الآية 7','يراجع مواضع التردد\nمتابعة يومية');
  assert.deepEqual(readFlexibleNotes(text),{mode,assignment:'سورة الفاتحة • من الآية 1 إلى الآية 7',notes:'يراجع مواضع التردد\nمتابعة يومية'});
 }
 assert.deepEqual(readFlexibleNotes('ملاحظة قديمة'),{mode:'plan',assignment:'',notes:'ملاحظة قديمة'});
 assert.equal(flexibleNotes('plan','مقرر',' ملاحظة '),'ملاحظة');assert.equal(normalizeQuranSearch('الإِخْلَاص'),'الاخلاص');
});
