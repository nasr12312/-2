import test from 'node:test';import assert from 'node:assert/strict';
import {schoolWeekDate,academicFocus,schoolHoliday} from '../src/utils/academic-dates.mjs';
test('school numbering skips autumn vacation and agrees with supplied 1448 distributions',()=>{
 assert.equal(schoolWeekDate(1),'2026-08-23');assert.equal(schoolWeekDate(7,4),'2026-10-08');
 assert.equal(schoolWeekDate(13,4),'2026-11-19');assert.equal(schoolWeekDate(14),'2026-11-29');
 assert.equal(schoolWeekDate(17,4),'2026-12-24');
 for(let week=1;week<=17;week++){const focus=academicFocus(schoolWeekDate(week));assert.equal(focus.week,week);assert.equal(focus.schoolDay,true)}
 assert.equal(academicFocus('2026-11-22').schoolDay,false);assert.equal(academicFocus('2026-11-28').holiday,'إجازة الخريف');
 assert.equal(academicFocus('2026-12-27').phase,'اختبارات شفهية وعملية');assert.equal(academicFocus('2027-01-03').phase,'اختبارات نهائية');
 assert.equal(schoolHoliday('2026-09-23'),'إجازة اليوم الوطني');assert.equal(schoolHoliday('2026-09-24'),'إجازة اليوم الوطني');
 assert.equal(academicFocus('2027-01-08').holiday,'إجازة منتصف العام');assert.equal(academicFocus('2027-01-16').holiday,'إجازة منتصف العام');
 assert.throws(()=>schoolWeekDate(0));assert.throws(()=>schoolWeekDate(18));
});
