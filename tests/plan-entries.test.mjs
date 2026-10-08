import test from 'node:test';import assert from 'node:assert/strict';import {entriesForClass} from '../src/utils/plan-entries.mjs';
test('families and plans show only their program and class override, retaining other base entries',()=>{
 const base={id:'one',program:'diploma',stage:'الابتدائية',grade:'الأول الابتدائي',text:'الأصل'};
 const entries=[base,{...base,id:'two'},{...base,classId:'own',text:'تعديل شعبي'},{...base,classId:'other',text:'تعديل شعبة أخرى'},{...base,program:'bilingual'}];
 assert.deepEqual(entriesForClass(entries,{remoteId:'own',program:'diploma',stage:'ابتدائي',grade:'اول'}).map(p=>p.text),['الأصل','تعديل شعبي']);
 assert.equal(entriesForClass(entries,undefined).length,0);
});
