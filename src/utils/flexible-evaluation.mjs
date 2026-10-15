import {conciseAssignment,conciseCheckpoint,isRecitationStatus} from './recitation-status.mjs';
import {multiAssignmentText} from './multi-recitation.mjs';
import {evaluationDate} from './report-period.mjs';
export const progressLabels={plan:'حسب الخطة',late:'متأخر عن الخطة',alternative:'مقرر مختلف',ahead:'متقدم عن الخطة',review:'مراجعة وتثبيت',multi:'تسميع عدة سور أو مقاطع',multi_late:'متأخر عن الخطة • عدة سور أو مقاطع'};
export function flexibleNotes(mode,assignment,notes){return mode==='plan'?notes.trim():['متابعة الخطة: '+progressLabels[mode],'المقرر الفعلي: '+assignment,notes.trim()].filter(Boolean).join('\n')}
export function readFlexibleNotes(notes=''){
 const lines=notes.split('\n'),mode=Object.keys(progressLabels).find(k=>lines[0]==='متابعة الخطة: '+progressLabels[k]);
 return mode&&lines[1]?.startsWith('المقرر الفعلي: ')?{mode,assignment:multiAssignmentText(lines[1].slice('المقرر الفعلي: '.length))||lines[1].slice('المقرر الفعلي: '.length),notes:lines.slice(2).join('\n')}:{mode:'plan',assignment:'',notes};
}
export function normalizeQuranSearch(text){return text.replace(/[أإآ]/g,'ا').replace(/[ًٌٍَُِّْـ]/g,'').replace(/ى/g,'ي').trim()}
export function displayEvaluationTrack(track){return track.replace(/ · إنجاز فردي .+$/,' • إنجاز فردي').replace(/ · حالة يومية$/,' • حالة اليوم')}
export function reachedAssignment(surah,ayah){return Number.isInteger(ayah)&&ayah>=1&&ayah<=surah.ayahs?'سورة '+surah.name+' • وصل إلى الآية '+ayah+' (من بداية السورة)'+(ayah===surah.ayahs?' • أتم السورة كاملة':''):''}
export function parseReachedAssignment(assignment,surahs){
 const match=assignment.match(/^سورة (.+?) • (?:وصل إلى الآية (\d+) \(من بداية السورة\)|من الآية 1 إلى الآية (\d+))(?: • أتم السورة كاملة)?$/);
 if(!match)return null;const surah=surahs.find(s=>s.name===match[1]),ayah=Number(match[2]||match[3]);
 return surah&&reachedAssignment(surah,ayah)?{surahId:surah.id,ayah}:null;
}
export function checkpointDetail(notes){return readFlexibleNotes(notes).notes.split('\n').find(line=>/^(الجديد في هذه المتابعة:|مراجعة وتثبيت عند الموضع|مراجعة عند موضع|موضع مسجل حتى الآية)/.test(line))||''}
export function achievementDescription(evaluation){if(isRecitationStatus(evaluation))return evaluation.grade+' — دون درجة.';const f=readFlexibleNotes(evaluation.notes);return f.mode==='plan'?'':[conciseAssignment(f.assignment),conciseCheckpoint(checkpointDetail(evaluation.notes)),'ملاحظة: الطالب '+progressLabels[f.mode]].filter(Boolean).join('\n')}
export function latestCheckpoint(evaluations,surahs,{studentId,track,date,termStartDate,excludeId}={}){
 const rows=evaluations.filter(e=>e.studentId===studentId&&(!excludeId||e.id!==excludeId)&&(e.track===track||e.track.startsWith(track+' · إنجاز فردي '))&&evaluationDate(e,termStartDate)<=date).sort((a,b)=>evaluationDate(b,termStartDate).localeCompare(evaluationDate(a,termStartDate))||b.createdAt.localeCompare(a.createdAt));
 for(const e of rows){if(checkpointDetail(e.notes).startsWith('مراجعة'))continue;const point=parseReachedAssignment(readFlexibleNotes(e.notes).assignment,surahs);if(point)return {...point,date:evaluationDate(e,termStartDate),assignment:readFlexibleNotes(e.notes).assignment}}
 return null;
}
export function checkpointChange(previous,surahId,ayah){
 if(!previous||previous.surahId!==surahId)return 'موضع مسجل حتى الآية '+ayah+' من بداية السورة؛ لا يُفترض إنجاز سور أخرى.';
 if(ayah>previous.ayah)return 'الجديد في هذه المتابعة: من الآية '+(previous.ayah+1)+' إلى الآية '+ayah+'.';
 return ayah===previous.ayah?'مراجعة وتثبيت عند الموضع نفسه؛ لا يُحتسب تقدم جديد.':'مراجعة عند موضع سابق؛ لا يُحتسب تقدم جديد.';
}


