import {isRecitationStatus} from './recitation-status.mjs';
export function quickDailyIndex(records,{week,day,track}){
 const byId=new Map();for(const row of records){const key=row.id||[row.studentId,row.weekId,row.day,row.track].join('|');const prior=byId.get(key);if(!prior||row.createdAt>=prior.createdAt)byId.set(key,row)}
 const latest=new Map(),graded=new Map();const rows=[...byId.values()].filter(e=>e.weekId===week&&e.day===day&&(e.track===track||e.track.startsWith(track+' · '))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||Number(isRecitationStatus(a))-Number(isRecitationStatus(b)));
 for(const e of rows){if(!latest.has(e.studentId))latest.set(e.studentId,e);if(!isRecitationStatus(e)&&!graded.has(e.studentId))graded.set(e.studentId,e)}return {latest,graded};
}
