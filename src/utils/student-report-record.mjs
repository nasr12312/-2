import {entriesForClass} from './plan-entries.mjs';
import {dayIndex} from './school-calendar.mjs';
import {readAchievement} from './student-achievement.mjs';
import {quranSurahs} from '../data/quran-surahs.mjs';
import {achievementDescription,readFlexibleNotes,displayEvaluationTrack,progressLabels} from './flexible-evaluation.mjs';
import {numericEvaluationScore,isRecitationStatus,recitationStatusLabel,conciseAssignment} from './recitation-status.mjs';
export function studentReportPlan(e,plans=[],classroom){
 const linked=plans.find(p=>p.id===e.planEntryId&&(!p.classId||p.classId===classroom?.remoteId));
 if(linked)return linked;
 if(!classroom?.program||!classroom.grade||!classroom.stage)return undefined;
 const track=displayEvaluationTrack(e.track).split(' • ')[0];
 const rows=entriesForClass(plans,classroom).filter(p=>p.week===e.weekId&&p.track===track);
 return rows.find(p=>dayIndex(p.day)===e.day)||rows.find(p=>dayIndex(p.day)<0);
}
export function studentReportRecord(e,{date,plan,includeNotes=true,enrollment=''}={}){
 const status=isRecitationStatus(e),flexible=readFlexibleNotes(e.notes);
 const assignment=status?'':achievementDescription(e)||flexible.assignment||plan?.text||'';
 const actual=readAchievement(e.notes),position=actual?.position,surah=position&&quranSurahs.find(s=>s.id===position.surahId);
 const reached=status?'':[conciseAssignment(flexible.assignment),actual?.kind!=='checkpoint'&&surah&&position.ayah<=surah.ayahs?'وصل إلى الآية '+position.ayah+' من سورة '+surah.name:''].filter(Boolean).join('\n');
 const required=status?'':plan?.text||'';
 const notes=status||!includeNotes?'':[e.writtenFeedback,flexible.notes].filter((value,i,items)=>value&&value!==assignment&&items.indexOf(value)===i).join('\n');
 const simpleNote=status?recitationStatusLabel(e.grade):[recitationStatusLabel(e.grade),['late','multi_late'].includes(flexible.mode)?'ملاحظة: الطالب '+progressLabels[flexible.mode]:'',includeNotes?flexible.notes:'',includeNotes&&e.writtenFeedback!==actual?.summary&&e.writtenFeedback!==assignment&&!e.writtenFeedback?.startsWith('مستوى الإتقان: ')?e.writtenFeedback:'',includeNotes?e.nextStep:''].filter((value,i,items)=>value&&items.indexOf(value)===i).join('\n');
 return {required,reached,simpleNote,date,track:displayEvaluationTrack(e.track),enrollment,grade:recitationStatusLabel(e.grade),score:numericEvaluationScore(e)??'—',assignment,notes,nextStep:status||!includeNotes?'':e.nextStep||'',status,feedback:[assignment,notes,includeNotes&&!status?e.nextStep:''].filter(Boolean).join('\n')};
}
