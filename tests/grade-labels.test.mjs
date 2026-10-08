import test from 'node:test';
import assert from 'node:assert/strict';
import {levels,levelDescriptions,gradeLabel} from '../src/utils/domain.mjs';
test('historic evaluation names map to clear performance levels without changing their numeric rank',()=>{
 const old=['متفوق','متقدم','متمكن','غير مجتاز','إعادة التقييم'];
 assert.deepEqual(old.map(gradeLabel),levels);
 assert.deepEqual(levels.map(gradeLabel),levels);
 assert.equal(gradeLabel('بانتظار التقييم'),'بانتظار التقييم');
 assert.equal(gradeLabel(''),'');
 assert.equal(levelDescriptions.length,levels.length);
});
