import {isFollowed,riyadhDate} from './school-calendar.mjs';
export function familyFollowupRows(students,evaluations,followups,homework,homeworkFollowups,classes,{from='',to=''}={}){
 const inRange=date=>(!from||date>=from)&&(!to||date<=to);
 const byStudent=new Map(students.map(s=>[s.id,[]]));
 for(const e of evaluations)if(byStudent.has(e.studentId)&&inRange(riyadhDate(new Date(e.createdAt))))byStudent.get(e.studentId).push(e);
 return students.map(s=>{
  const evals=byStudent.get(s.id),tasks=homework.filter(h=>!h.cancelled&&h.class_id===classes.find(c=>c.id===s.classId)?.remoteId&&(!h.student_id||h.student_id===s.remoteId)&&inRange(h.due_date));
  const receipts=evals.flatMap(e=>followups.filter(f=>f.evaluation_id===e.id&&Date.parse(f.evaluation_version)===Date.parse(e.createdAt)));
  const taskReceipts=tasks.flatMap(h=>homeworkFollowups.filter(f=>f.homework_id===h.id&&f.student_id===s.remoteId&&f.homework_version===h.updated_at));
  const evaluationDone=evals.filter(e=>isFollowed(e,followups)).length,homeworkDone=tasks.filter(h=>taskReceipts.some(f=>f.homework_id===h.id)).length;
  const total=evals.length+tasks.length,done=evaluationDone+homeworkDone;
  const last=[...receipts,...taskReceipts].map(f=>f.followed_at).sort().at(-1)||'';
  return {student:s,total,done,pending:total-done,evaluationTotal:evals.length,evaluationDone,homeworkTotal:tasks.length,homeworkDone,last,status:!total?'none':done===total?'complete':done?'partial':'pending'};
 });
}
