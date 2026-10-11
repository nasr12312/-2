import test from 'node:test';import assert from 'node:assert/strict';
import {flexibleNotes,readFlexibleNotes,normalizeQuranSearch} from '../src/utils/flexible-evaluation.mjs';
test('flexible evaluations retain actual assignment and progress separately from teacher notes',()=>{
 for(const mode of ['late','alternative','ahead','review']){
  const text=flexibleNotes(mode,'سورة الفاتحة • من الآية 1 إلى الآية 7','يراجع مواضع التردد\nمتابعة يومية');
  assert.deepEqual(readFlexibleNotes(text),{mode,assignment:'سورة الفاتحة • من الآية 1 إلى الآية 7',notes:'يراجع مواضع التردد\nمتابعة يومية'});
 }
 assert.deepEqual(readFlexibleNotes('ملاحظة قديمة'),{mode:'plan',assignment:'',notes:'ملاحظة قديمة'});
 assert.equal(flexibleNotes('plan','مقرر',' ملاحظة '),'ملاحظة');assert.equal(normalizeQuranSearch('الإِخْلَاص'),'الاخلاص');
});
