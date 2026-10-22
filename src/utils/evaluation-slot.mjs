export const evaluationTrack=track=>String(track||'الحفظ').split(' · ')[0];
export const evaluationClientKey=(studentId,week,day,track)=>[studentId,Number(week),Number(day),evaluationTrack(track)].join('|');
// A lesson has one current assessment per track, regardless of the editor used.
export function uniqueDailyEvaluations(records,dateOf=e=>e.weekId+'|'+e.day){
 const slots=new Map();for(const row of records){const key=[row.studentId,dateOf(row),evaluationTrack(row.track)].join('|'),old=slots.get(key);if(!old||(Date.parse(row.createdAt)||0)>=(Date.parse(old.createdAt)||0))slots.set(key,row)}return [...slots.values()];
}
