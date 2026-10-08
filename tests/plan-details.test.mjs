import test from 'node:test';import assert from 'node:assert/strict';
import {assignmentDetails,detailedPlanWeek} from '../src/utils/plan-details.mjs';
test('plan details use the daily range, Arabic digits, and flag reversed source ranges',()=>{
 assert.equal(assignmentDetails('ق ١-٢٣ — ٦-١١').count,6);
 assert.equal(assignmentDetails('الإسراء — 106-11').invalid,true);
 assert.equal(assignmentDetails('مراجعة وتثبيت').count,undefined);
 assert.equal(assignmentDetails('سورة ص — مراجعة 1-30').review,true);
});
test('weekly recitation remains separate and holidays do not invent daily assignments',()=>{
 const entries=[{week:5,day:'الأحد 9/4',text:'عبس 23-29'},{week:5,day:'مقرر التلاوة',text:'المعارج 23-44'}];
 const plan=detailedPlanWeek(entries,5);assert.equal(plan.weekly.length,1);assert.equal(plan.days[0].entries.length,1);assert.equal(plan.days[1].entries.length,0);assert.equal(plan.days[3].holiday,'إجازة اليوم الوطني');
 assert.equal(detailedPlanWeek([],14).from,'2026-11-29');
});
