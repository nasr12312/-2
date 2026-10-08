import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyReportRoster} from '../src/utils/weekly-report-scope.mjs';
import {weeklyStudentReports} from '../src/utils/weekly-student-reports.mjs';
test('section delivery includes every active child despite a single-student preview, and excludes other sections',()=>{
 const students=[{id:1,name:'طالب أول',academicId:'9000000001',classId:2,active:true},{id:2,name:'طالب ثان',academicId:'9000000002',classId:2,active:true},{id:3,name:'طالب ثالث',academicId:'9000000003',classId:3,active:true},{id:4,name:'طالب مؤرشف',academicId:'9000000004',classId:2,active:false}];
 const roster=weeklyReportRoster(students,'class',2,[students[0]]);
 assert.deepEqual(roster.map(s=>s.id),[1,2]);
 assert.deepEqual(weeklyReportRoster(students,'class',0),[]);
 assert.deepEqual(weeklyReportRoster(students,'all').map(s=>s.id),[1,2,3]);
 const reports=weeklyStudentReports(roster,[],{date:'2026-10-08',school:'غراس',logo:'',teacher:'معلم',classes:[{id:2,name:'ثنائي • أول • 1'}]});
 assert.equal(reports.length,2);
 assert.deepEqual(reports.flatMap(r=>r.studentIds).sort(),[1,2]);
 for(const file of reports){const own=roster.find(s=>file.studentIds.includes(s.id));const other=roster.find(s=>s.id!==own.id);assert.ok(file.content.includes(own.name));assert.ok(!file.content.includes(other.name));assert.ok(file.messageText.includes('فتح التقرير الأسبوعي الكامل'));}
});
