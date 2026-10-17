import {isRecitationStatus} from './recitation-status.mjs';
import {evaluationDate} from './report-period.mjs';
// Resolve conflicting daily states for reports; never change the underlying history.
export function reportEvaluations(evaluations,termStartDate){const groups=new Map();for(const e of evaluations){const key=e.studentId+'|'+evaluationDate(e,termStartDate)+'|'+e.track.split(' · ')[0];if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e)}return [...groups.values()].flatMap(rows=>{const ordered=[...rows].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)||Number(isRecitationStatus(a))-Number(isRecitationStatus(b)));return isRecitationStatus(ordered[0])?[ordered[0]]:rows.filter(e=>!isRecitationStatus(e))})}
