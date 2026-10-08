import {weeklyMessageBatch} from './weekly-message-batch.mjs';
export async function weeklyReportPayload(files,students,actor,from,to){
 const enriched=await Promise.all(files.map(async file=>{if(!file.content||file.content.length>200000)throw Error('حجم التقرير غير صالح');const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(file.content));return {...file,deliveryKey:[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')};}));
 const messages=await weeklyMessageBatch(enriched,students,actor);return messages.map((message,i)=>({id:message.id,student_id:message.student_id,body:message.body,file_name:files[i].name,html:files[i].content,period_from:from,period_to:to}));
}
