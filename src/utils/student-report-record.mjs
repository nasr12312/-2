import {achievementDescription,readFlexibleNotes,displayEvaluationTrack} from './flexible-evaluation.mjs';
import {numericEvaluationScore,isRecitationStatus,recitationStatusLabel} from './recitation-status.mjs';
export function studentReportRecord(e,{date,plan,includeNotes=true,enrollment=''}={}){
 const status=isRecitationStatus(e),flexible=readFlexibleNotes(e.notes);
 const assignment=status?'':achievementDescription(e)||flexible.assignment||plan?.text||'';
 const notes=status||!includeNotes?'':[e.writtenFeedback,flexible.notes].filter((value,i,items)=>value&&value!==assignment&&items.indexOf(value)===i).join('\n');
 return {date,track:displayEvaluationTrack(e.track),enrollment,grade:recitationStatusLabel(e.grade),score:numericEvaluationScore(e)??'—',assignment,notes,nextStep:status||!includeNotes?'':e.nextStep||'',status,feedback:[assignment,notes,includeNotes&&!status?e.nextStep:''].filter(Boolean).join('\n')};
}
