// Repeating an unchanged weekly summary reuses the same message id.
export async function weeklyMessageBatch(files,students,actor){
 if(!actor)throw Error('يلزم تسجيل الدخول');const messages=[];
 for(const file of files){const linked=students.find(s=>file.studentIds.includes(s.id)&&s.remoteId);if(!linked)throw Error('تعذر ربط الطالب بحساب الأسرة');if(!file.messageText||file.messageText.length>4000)throw Error('ملخص الطالب غير صالح');
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([actor,file.studentIds.map(id=>students.find(s=>s.id===id)?.remoteId).sort(),file.messageText,file.deliveryKey||'']))));digest[6]=(digest[6]&15)|128;digest[8]=(digest[8]&63)|128;const hex=[...digest.slice(0,16)].map(byte=>byte.toString(16).padStart(2,'0')).join('');const id=hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
 messages.push({id,student_id:linked.remoteId,teacher_id:actor,sender_id:actor,kind:'توجيه',body:file.messageText});
 }return messages;
}
