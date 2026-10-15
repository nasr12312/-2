import test from 'node:test';import assert from 'node:assert/strict';
import {multiAssignment,segmentsFromNotes,humanizeRecitationText} from '../src/utils/multi-recitation.mjs';
import {flexibleNotes,readFlexibleNotes,achievementDescription} from '../src/utils/flexible-evaluation.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
const surahs=[{id:112,name:'الإخلاص',ayahs:4},{id:67,name:'الملك',ayahs:30}];
const rows=[{surahId:112,from:1,to:4,recommendation:'حافظ على المراجعة'},{surahId:67,from:10,to:15,recommendation:'تثبيت هذا المقطع'}];
test('multiple surahs retain complete and partial ranges, independent recommendations and late status in reports',()=>{
 const assignment=multiAssignment(rows,surahs),notes=flexibleNotes('multi_late',assignment,'ملاحظة عامة');
 assert.equal(segmentsFromNotes(notes).length,2);const f=readFlexibleNotes(notes);assert.match(f.assignment,/الإخلاص • السورة كاملة/);assert.match(f.assignment,/الملك • الآيات 10–15/);assert.match(f.assignment,/التوصية: تثبيت هذا المقطع/);
 const e={id:'e',studentId:1,weekId:7,day:4,track:'الحفظ · إنجاز فردي e',notes,createdAt:'2026-10-08T08:00:00Z',grade:'جيد',scores:[3]};
 assert.match(achievementDescription(e),/متأخر عن الخطة/);
 const [report]=weeklyStudentReports([{id:1,name:'طالب',academicId:'1000000000',classId:1,program:'bilingual'}],[e],{date:'2026-10-08',termStartDate:'2026-08-23',classes:[{id:1,name:'أ'}],school:'غراس',logo:'',teacher:'المعلم',includeNotes:false});
 for(const word of ['الإخلاص','السورة كاملة','10–15','تثبيت هذا المقطع','متأخر عن الخطة'])assert.ok(report.content.includes(word),word);
 assert.ok(!report.content.includes('"surahId"'));assert.ok(!report.content.includes('ملاحظة عامة'));
 const notification=humanizeRecitationText('تقييم جديد\n'+notes);assert.ok(notification.includes('تثبيت هذا المقطع'));assert.ok(!notification.includes('"surahId"'));
});
test('invalid and identical duplicate segments cannot be saved',()=>{
 for(const value of [[...rows,rows[0]],[{...rows[0],to:5}],[{...rows[1],from:20,to:10}],[],[{...rows[0],from:1.5}]])assert.equal(multiAssignment(value,surahs),'');
});
