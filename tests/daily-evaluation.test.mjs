import test from 'node:test';import assert from 'node:assert/strict';
import {dailyEvaluationKey,dailyPreset,nextUnassessedStudent} from '../src/utils/daily-evaluation.mjs';
import {sharedReportId,fullReportLink} from '../src/utils/shared-report-link.mjs';
test('daily settings isolate teacher, class, week, day and track; grades are never part of a preset',()=>{
 const base=['teacher','class',8,2,'حفظ'];const key=dailyEvaluationKey(...base);for(let i=0;i<base.length;i++){const changed=[...base];changed[i]=typeof base[i]==='number'?base[i]+1:base[i]+'x';assert.notEqual(dailyEvaluationKey(...changed),key)}
 assert.deepEqual(dailyPreset({entryId:'plan',assignment:'الملك 1–5',grade:5}),{entryId:'plan',assignment:'الملك 1–5',oneClick:true,autoNext:true});assert.equal(dailyPreset({assignment:''}).assignment,'');assert.equal(dailyPreset().assignment,undefined);assert.equal(dailyPreset({oneClick:false}).oneClick,false);
});
test('next student follows roster order, skips assessed or absent students, wraps and stops when complete',()=>{
 const roster=[1,2,3,4].map(id=>({id}));assert.equal(nextUnassessedStudent(roster,2,s=>[1,3].includes(s.id)),4);assert.equal(nextUnassessedStudent(roster,4,s=>[2,3].includes(s.id)),1);assert.equal(nextUnassessedStudent(roster,4,()=>true),null);assert.equal(nextUnassessedStudent([{id:1}],1,()=>false),null);
});
test('full report links preserve application path, carry only a valid report id and remove existing queries',()=>{
 const id='11111111-1111-4111-8111-111111111111';const url=fullReportLink('./','https://example.com/platform/?other=private#tab',id);assert.equal(url,'https://example.com/platform/?report='+id);assert.equal(sharedReportId('?report='+id),id);for(const input of ['?report=1000000000','?report=<script>','?report=bad'])assert.equal(sharedReportId(input),'');assert.throws(()=>fullReportLink('./','https://example.com','bad'));
});
