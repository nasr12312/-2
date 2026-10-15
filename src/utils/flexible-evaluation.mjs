export const progressLabels={plan:'حسب الخطة',late:'متأخر عن الخطة',alternative:'مقرر مختلف',ahead:'متقدم عن الخطة',review:'مراجعة وتثبيت'};
export function flexibleNotes(mode,assignment,notes){return mode==='plan'?notes.trim():['متابعة الخطة: '+progressLabels[mode],'المقرر الفعلي: '+assignment,notes.trim()].filter(Boolean).join('\n')}
export function readFlexibleNotes(notes=''){
 const lines=notes.split('\n'),mode=Object.keys(progressLabels).find(k=>lines[0]==='متابعة الخطة: '+progressLabels[k]);
 return mode&&lines[1]?.startsWith('المقرر الفعلي: ')?{mode,assignment:lines[1].slice('المقرر الفعلي: '.length),notes:lines.slice(2).join('\n')}:{mode:'plan',assignment:'',notes};
}
export function normalizeQuranSearch(text){return text.replace(/[أإآ]/g,'ا').replace(/[ًٌٍَُِّْـ]/g,'').replace(/ى/g,'ي').trim()}
export function displayEvaluationTrack(track){return track.replace(/ · إنجاز فردي .+$/,' • إنجاز فردي')}
export function reachedAssignment(surah,ayah){return Number.isInteger(ayah)&&ayah>=1&&ayah<=surah.ayahs?'سورة '+surah.name+' • وصل إلى الآية '+ayah+' (من بداية السورة)'+(ayah===surah.ayahs?' • أتم السورة كاملة':''):''}
export function parseReachedAssignment(assignment,surahs){
 const match=assignment.match(/^سورة (.+?) • (?:وصل إلى الآية (\d+) \(من بداية السورة\)|من الآية 1 إلى الآية (\d+))(?: • أتم السورة كاملة)?$/);
 if(!match)return null;const surah=surahs.find(s=>s.name===match[1]),ayah=Number(match[2]||match[3]);
 return surah&&reachedAssignment(surah,ayah)?{surahId:surah.id,ayah}:null;
}
export function achievementDescription(evaluation){const f=readFlexibleNotes(evaluation.notes);return f.mode==='plan'?'':[f.assignment,'ملاحظة: الطالب '+progressLabels[f.mode]].join('\n')}

