import test from 'node:test';import assert from 'node:assert/strict';
import {flexibleNotes,readFlexibleNotes,normalizeQuranSearch} from '../src/utils/flexible-evaluation.mjs';
import {reachedAssignment,parseReachedAssignment} from '../src/utils/flexible-evaluation.mjs';
import {latestCheckpoint,checkpointChange,achievementDescription} from '../src/utils/flexible-evaluation.mjs';
test('latest checkpoint uses lesson date, excludes future lessons and other children/tracks, and handles edit history',()=>{
 const surahs=[{id:67,name:'الملك',ayahs:30}];
 const make=(id,day,ayah,extra={})=>({id,studentId:1,weekId:7,day,track:'الحفظ · إنجاز فردي '+id,createdAt:'2026-10-08T08:00:00Z',notes:flexibleNotes('late',reachedAssignment(surahs[0],ayah),''),...extra});
 const rows=[make('older',0,5,{createdAt:'2026-10-15T08:00:00Z'}),make('recent',1,10),make('future',2,15),make('other',1,30,{studentId:2}),make('reading',1,25,{track:'التلاوة'})];
 const options={studentId:1,track:'الحفظ',date:'2026-10-05',termStartDate:'2026-08-23'};
 assert.equal(latestCheckpoint(rows,surahs,options).ayah,10);
 assert.equal(latestCheckpoint(rows,surahs,{...options,excludeId:'recent'}).ayah,5);
 const review=make('review',2,3);review.notes+='\n'+checkpointChange({surahId:67,ayah:10},67,3);
 assert.equal(latestCheckpoint([rows[0],rows[1],review],surahs,{...options,date:'2026-10-06'}).ayah,10,'review must not move the saved progress backwards');
 assert.match(checkpointChange({surahId:67,ayah:5},67,10),/6 إلى الآية 10/);
 assert.match(checkpointChange({surahId:67,ayah:10},67,10),/لا يُحتسب تقدم/);
 assert.match(checkpointChange({surahId:67,ayah:10},67,5),/موضع سابق/);
 assert.match(checkpointChange({surahId:67,ayah:10},112,4),/لا يُفترض إنجاز سور أخرى/);
 assert.match(achievementDescription({...rows[1],notes:rows[1].notes+'\n'+checkpointChange({surahId:67,ayah:5},67,10)}),/6–10/);
});
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

