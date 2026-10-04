import type {SupabaseClient} from '@supabase/supabase-js';
export type UploadOptions={onProgress?:(percent:number)=>void;signal?:AbortSignal};
export const PREPARED_UPLOAD_BYTES=200*1024*1024;
export const FALLBACK_UPLOAD_BYTES=50*1024*1024;
export async function uploadCapacity(client:SupabaseClient){const r=await client.rpc('recitation_upload_limits');if(r.error||!r.data?.maximum_bytes)throw Error('تعذر التحقق من حد الرفع. أعد المحاولة.');return Math.min(PREPARED_UPLOAD_BYTES,Number(r.data.maximum_bytes));}
export async function resumableRecitation(client:SupabaseClient,baseUrl:string,file:File,studentId:string,assignment:Record<string,string|number>,options:UploadOptions={}){
 const {data:{user}}=await client.auth.getUser();if(!user)throw Error('انتهت الجلسة. أعد الدخول.');
 const contentType=({'audio/x-m4a':'audio/mp4','audio/x-wav':'audio/wav'} as Record<string,string>)[file.type]||file.type;if(!['audio/mpeg','audio/mp4','audio/wav','audio/webm','video/mp4','video/webm'].includes(contentType))throw Error('اختر تسجيلًا بصيغة MP3 أو MP4 أو M4A أو WAV أو WebM.');const limit=await uploadCapacity(client);if(file.size>limit)throw Error('الحد المتاح حاليًا '+Math.floor(limit/1024/1024)+' ميغابايت. دعم 200 ميغابايت مجهّز لحين رفع حد الاستضافة.');
 const pendingKey='gheras-upload-v2-'+user.id+'-'+studentId+'-'+file.name+'-'+file.size+'-'+file.lastModified;
 const extension=file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g,'')||'webm';
 let pending:{id:string;path:string;uploaded:boolean}|null=null;try{pending=JSON.parse(localStorage.getItem(pendingKey)||'null')}catch{}
 if(!pending||!pending.path.startsWith(studentId+'/'))pending={id:crypto.randomUUID(),path:studentId+'/'+crypto.randomUUID()+'.'+extension,uploaded:false};
 localStorage.setItem(pendingKey,JSON.stringify(pending));
 if(options.signal?.aborted)throw new DOMException('تم إيقاف الرفع','AbortError');
 if(!pending.uploaded){
 const {Upload}=await import('tus-js-client');const {data:{session}}=await client.auth.getSession();if(!session)throw Error('انتهت الجلسة.');
 const host=new URL(baseUrl);host.hostname=host.hostname.replace('.supabase.co','.storage.supabase.co');
 const current=pending;
 await new Promise<void>((resolve,reject)=>{
 let settled=false;const finish=(error?:Error)=>{if(settled)return;settled=true;options.signal?.removeEventListener('abort',cancel);error?reject(error):resolve()};
 const upload=new Upload(file,{endpoint:host.origin+'/storage/v1/upload/resumable',headers:{authorization:'Bearer '+session.access_token,'x-upsert':'false'},metadata:{bucketName:'recitations',objectName:current.path,contentType,cacheControl:'3600'},chunkSize:6*1024*1024,retryDelays:[0,3000,5000,10000,20000],uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,fingerprint:async()=>pendingKey,onProgress:(sent,total)=>options.onProgress?.(Math.round(sent/total*100)),onError:()=>finish(Error('تعذر رفع التسجيل. أعد المحاولة لاستكمال الرفع.')),onSuccess:()=>{current.uploaded=true;localStorage.setItem(pendingKey,JSON.stringify(current));finish()}});
 const cancel=()=>{void upload.abort(false);finish(new DOMException('تم إيقاف الرفع ويمكن استكماله بإعادة اختيار الملف نفسه','AbortError'))};options.signal?.addEventListener('abort',cancel,{once:true});
 if(options.signal?.aborted){cancel();return}
 void upload.findPreviousUploads().then(previous=>{if(settled)return;if(options.signal?.aborted){cancel();return}if(previous[0])upload.resumeFromPreviousUpload(previous[0]);upload.start()}).catch(()=>finish(Error('تعذر بدء الرفع. أعد المحاولة.')));
 });
 }
 if(options.signal?.aborted)throw new DOMException('تم إيقاف الرفع','AbortError');
 const row={id:pending.id,student_id:studentId,storage_path:pending.path,media_type:file.type.startsWith('video/')?'video':'audio',submitted_by:user.id,assignment,file_name:file.name,mime_type:contentType,file_size:file.size};
 const result=await client.from('recitation_submissions').insert(row);if(result.error){const existing=await client.from('recitation_submissions').select('id,storage_path').eq('id',pending.id).maybeSingle();if(existing.error||existing.data?.storage_path!==pending.path)throw Error('اكتمل رفع الملف وتعذر تسجيل الإرسال. أعد المحاولة بالملف نفسه.');}
 localStorage.removeItem(pendingKey);options.onProgress?.(100);return pending.id;
}
