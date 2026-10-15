export const progressLabels={plan:'حسب الخطة',late:'متأخر عن الخطة',alternative:'مقرر مختلف',ahead:'متقدم عن الخطة',review:'مراجعة وتثبيت'};
export function flexibleNotes(mode,assignment,notes){return mode==='plan'?notes.trim():['متابعة الخطة: '+progressLabels[mode],'المقرر الفعلي: '+assignment,notes.trim()].filter(Boolean).join('\n')}
export function readFlexibleNotes(notes=''){
 const lines=notes.split('\n'),mode=Object.keys(progressLabels).find(k=>lines[0]==='متابعة الخطة: '+progressLabels[k]);
 return mode&&lines[1]?.startsWith('المقرر الفعلي: ')?{mode,assignment:lines[1].slice('المقرر الفعلي: '.length),notes:lines.slice(2).join('\n')}:{mode:'plan',assignment:'',notes};
}
export function normalizeQuranSearch(text){return text.replace(/[أإآ]/g,'ا').replace(/[ًٌٍَُِّْـ]/g,'').replace(/ى/g,'ي').trim()}
export function displayEvaluationTrack(track){return track.replace(/ · إنجاز فردي .+$/,' • إنجاز فردي')}
