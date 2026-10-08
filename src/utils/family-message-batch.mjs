import {weeklyMessageBatch} from './weekly-message-batch.mjs';
export function scopedMessageStudents(students,classes,{program='',grade='',classIds=[]}={}){
 const allowed=new Set(classes.filter(c=>(!program||c.program===program)&&(!grade||c.stage+'|'+c.grade===grade)&&(!classIds.length||classIds.includes(c.remoteId))).map(c=>c.id));
 const groups=new Map();for(const s of students.filter(s=>allowed.has(s.classId))){const key=/^\d{10}$/.test(s.academicId)?s.academicId:'student:'+s.remoteId;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s)}return [...groups.values()];
}
export async function familyMessageBatch(groups,actor,body,kind,batchId){
 if(!batchId||!body.trim()||body.trim().length>4000||!['رسالة','إشادة','تذكير','توجيه','استفسار'].includes(kind))throw Error('راجع الرسالة والمستلمين');
 const students=groups.flat();const messages=await weeklyMessageBatch(groups.map(group=>({studentIds:group.map(s=>s.id),messageText:body.trim(),deliveryKey:batchId})),students,actor);return messages.map(m=>({...m,kind}));
}
