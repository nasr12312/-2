import {readAchievement,achievementNotes} from './student-achievement.mjs';
import {flexibleNotes,readFlexibleNotes} from './flexible-evaluation.mjs';
import {multiAssignment,segmentsFromNotes} from './multi-recitation.mjs';
export function followupNotes(existing,{mode,assignment,note,assignmentChanged=false},surahs){
 const saved=readAchievement(existing);
 if(saved&&!assignmentChanged){const precise=achievementNotes({...saved,note},surahs);const original=readFlexibleNotes(precise).assignment;return flexibleNotes(mode==='plan'?'today':mode,original,precise.split('\n').slice(2).join('\n'))}
 const priorSegments=segmentsFromNotes(existing);const preciseAssignment=!assignmentChanged&&priorSegments.length?multiAssignment(priorSegments,surahs):assignment.trim();
 return flexibleNotes(mode==='plan'?'today':mode,preciseAssignment||'لم يحدد المعلم مقرر التسميع',note);
}
export function studentFollowupHistory(records,studentId,dateOf){
 const unique=new Map();for(const row of records){if(row.studentId!==studentId)continue;const key=row.id||[row.studentId,row.weekId,row.day,row.track].join('|');const old=unique.get(key);if(!old||Date.parse(row.createdAt)>=Date.parse(old.createdAt))unique.set(key,row)}
 return [...unique.values()].sort((a,b)=>dateOf(b).localeCompare(dateOf(a))||Date.parse(b.createdAt)-Date.parse(a.createdAt));
}
export function followupEditTarget(rows,{id,studentId,week,day,track}){return rows.find(e=>e.id===id&&e.studentId===studentId&&e.weekId===week&&e.day===day&&e.track.split(' · ')[0]===track)||null}
export function followupPassage(surahId,from,to,surahs){const s=surahs.find(s=>s.id===surahId);return s&&Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to>=from&&to<=s.ayahs?'سورة '+s.name+' • من الآية '+from+' إلى الآية '+to:''}
export function followupLabel(mode){return mode==='today'||mode==='plan'?'حسب الخطة':({late:'متأخر عن الخطة',ahead:'متقدم عن الخطة',multi:'متفرق • عدة سور أو مقاطع',multi_late:'متأخر ومتفرق',review:'مراجعة وتثبيت',alternative:'مقرر مختلف'})[mode]||'حسب الخطة'}
